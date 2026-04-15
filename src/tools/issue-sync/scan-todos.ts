import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GhRunner } from '../../utils/gh-cli.js';
import type { CommandRunner } from '../../utils/command-runner.js';
import type { TodoEntry, TodoReport, Priority } from '../../types/issue-sync.js';
import { fuzzyMatch } from '../../utils/code-scanner.js';
import { validateBasePath, sanitizePaths, sanitizeMarker } from '../../utils/path-validator.js';
import { createIssue } from '../create-issue.js';

/** Maximum issues to create in a single run to prevent mass-creation. */
const MAX_ISSUES_PER_RUN = 10;

interface ExistingIssue {
  readonly number: number;
  readonly title: string;
  readonly body: string | null;
}

interface ParsedTodo {
  readonly file: string;
  readonly line: number;
  readonly marker: string;
  readonly text: string;
}

/**
 * Determine suggested priority based on marker type.
 */
function suggestPriority(marker: string): Priority {
  const upper = marker.toUpperCase();
  if (upper === 'XXX') return 'P0';
  if (upper === 'FIXME') return 'P1';
  if (upper === 'HACK') return 'P2';
  return 'P3'; // TODO and custom markers
}

/**
 * Generate a proposed issue title from a TODO entry.
 */
function proposeTitle(entry: ParsedTodo): string {
  const cleanText = entry.text
    .replace(/^[:\s-]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return `[${entry.marker}] ${cleanText}`;
}

/**
 * Parse grep output for TODO markers into structured entries.
 */
function parseTodoOutput(stdout: string): readonly ParsedTodo[] {
  const lines = stdout.trim().split('\n').filter(Boolean);
  const results: ParsedTodo[] = [];

  for (const line of lines) {
    const firstColon = line.indexOf(':');
    if (firstColon === -1) continue;
    const secondColon = line.indexOf(':', firstColon + 1);
    if (secondColon === -1) continue;

    const file = line.slice(0, firstColon);
    const lineNum = parseInt(line.slice(firstColon + 1, secondColon), 10);
    const content = line.slice(secondColon + 1);

    if (isNaN(lineNum)) continue;

    // Extract marker and text
    const markerMatch = content.match(/\b(TODO|FIXME|HACK|XXX)\b[:\s]*(.*)/i);
    if (!markerMatch) continue;

    results.push({
      file,
      line: lineNum,
      marker: markerMatch[1]!.toUpperCase(),
      text: markerMatch[2]?.trim() ?? '',
    });
  }

  return results;
}

/**
 * Scan codebase for TODO/FIXME/HACK/XXX markers and propose issue creation.
 */
export async function scanTodos(
  gh: GhRunner,
  cmd: CommandRunner,
  args: {
    repo: string;
    basePath?: string;
    scanPaths?: string[];
    markers?: string[];
    excludePaths?: string[];
    createIssues?: boolean;
  }
): Promise<CallToolResult> {
  const basePathResult = validateBasePath(args.basePath);
  if (!basePathResult.valid) {
    return {
      isError: true,
      content: [{ type: 'text', text: basePathResult.error }],
    };
  }
  const basePath = basePathResult.resolved;

  const scanPathResult = sanitizePaths(args.scanPaths ?? ['.']);
  if (!scanPathResult.valid) {
    return {
      isError: true,
      content: [{ type: 'text', text: scanPathResult.error }],
    };
  }
  const scanPaths = scanPathResult.paths;

  const excludeResult = sanitizePaths(args.excludePaths ?? ['node_modules', 'dist', '.git']);
  if (!excludeResult.valid) {
    return {
      isError: true,
      content: [{ type: 'text', text: excludeResult.error }],
    };
  }
  const excludePaths = excludeResult.paths;

  const rawMarkers = args.markers ?? ['TODO', 'FIXME', 'HACK', 'XXX'];
  const validMarkers = rawMarkers.map(sanitizeMarker).filter((m): m is string => m !== null);
  if (validMarkers.length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'No valid markers provided. Markers must be alphanumeric.' }],
    };
  }

  const shouldCreate = args.createIssues ?? false;

  // Step 1: Grep for markers
  const pattern = validMarkers.map((m) => `\\b${m}\\b`).join('|');
  const grepArgs: string[] = ['-rn', '-E', pattern, '--max-count', '200'];

  // File type filters
  for (const glob of ['*.ts', '*.tsx', '*.js', '*.jsx', '*.py', '*.go', '*.rs', '*.sh']) {
    grepArgs.push('--include', glob);
  }

  // Exclude paths
  for (const ex of excludePaths) {
    grepArgs.push('--exclude-dir', ex);
  }

  // Add scan paths
  for (const p of scanPaths) {
    grepArgs.push(p);
  }

  let rawTodos: readonly ParsedTodo[];
  try {
    const result = await cmd('grep', grepArgs, { cwd: basePath });
    rawTodos = parseTodoOutput(result.stdout);
  } catch {
    // grep exit code 1 = no matches
    rawTodos = [];
  }

  // Step 2: Fetch existing open issues for dedup
  let existingIssues: readonly ExistingIssue[] = [];
  try {
    const result = await gh([
      'issue',
      'list',
      '--repo',
      args.repo,
      '--state',
      'open',
      '--json',
      'number,title,body',
      '--limit',
      '500',
    ]);
    existingIssues = JSON.parse(result.stdout) as readonly ExistingIssue[];
  } catch {
    // Non-fatal: proceed without dedup
  }

  // Step 3: Cross-reference and build entries
  const entries: TodoEntry[] = [];

  for (const todo of rawTodos) {
    // Check for matching existing issue
    let matchingIssue: number | null = null;
    for (const issue of existingIssues) {
      if (fuzzyMatch(todo.text, issue.title)) {
        matchingIssue = issue.number;
        break;
      }
    }

    entries.push({
      file: todo.file,
      line: todo.line,
      marker: todo.marker,
      text: todo.text,
      suggestedPriority: suggestPriority(todo.marker),
      matchingIssue,
      proposedTitle: proposeTitle(todo),
    });
  }

  const alreadyTracked = entries.filter((e) => e.matchingIssue !== null).length;
  const untracked = entries.filter((e) => e.matchingIssue === null);

  // Step 4: Optionally create issues for untracked TODOs
  const issuesCreated: number[] = [];

  if (shouldCreate) {
    const toCreate = untracked.slice(0, MAX_ISSUES_PER_RUN);

    for (const entry of toCreate) {
      const body = [
        `**File**: \`${entry.file}:${entry.line}\``,
        `**Marker**: ${entry.marker}`,
        `**Content**: ${entry.text}`,
        '',
        `> Auto-detected by issue-sync tool`,
      ].join('\n');

      const labels = entry.marker === 'FIXME' || entry.marker === 'XXX' ? ['bug'] : ['refine'];

      const result = await createIssue(gh, {
        repo: args.repo,
        title: entry.proposedTitle,
        body,
        labels,
      });

      // Extract issue number from result
      if (!result.isError) {
        const first = result.content[0];
        if (first && 'text' in first) {
          const parsed = JSON.parse(first.text) as Record<string, unknown>;
          const data = parsed['data'] as Record<string, unknown> | undefined;
          const issueNum = data?.['issueNumber'];
          if (typeof issueNum === 'number' && issueNum > 0) {
            issuesCreated.push(issueNum);
          }
        }
      }
    }
  }

  const report: TodoReport = {
    repo: args.repo,
    scannedAt: new Date().toISOString(),
    totalTodos: entries.length,
    alreadyTracked,
    untracked: untracked.length,
    entries,
    issuesCreated,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(report, null, 2),
      },
    ],
  };
}
