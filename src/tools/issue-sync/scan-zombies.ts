import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GhRunner } from '../../utils/gh-cli.js';
import type { CommandRunner } from '../../utils/command-runner.js';
import type {
  ZombieCandidate,
  ZombieClassification,
  ZombieReport,
  ZombieSummary,
} from '../../types/issue-sync.js';
import {
  extractKeywords,
  grepCode,
  gitLogSearch,
  calculateStaleDays,
} from '../../utils/code-scanner.js';
import { validateBasePath, sanitizePaths } from '../../utils/path-validator.js';

/** Confidence weights for different evidence types. */
const WEIGHT_COMMIT_REF = 0.5;
const WEIGHT_MULTI_KEYWORD = 0.3;
const WEIGHT_SINGLE_KEYWORD = 0.15;

interface OpenIssue {
  readonly number: number;
  readonly title: string;
  readonly body: string | null;
  readonly labels: readonly { readonly name: string }[];
  readonly createdAt: string;
}

/**
 * Analyze a single issue against the codebase for zombie detection.
 */
async function analyzeIssue(
  cmd: CommandRunner,
  issue: OpenIssue,
  basePath: string,
  excludePaths: readonly string[]
): Promise<{
  readonly confidence: number;
  readonly classification: ZombieClassification;
  readonly codeMatches: readonly {
    readonly file: string;
    readonly line: number;
    readonly snippet: string;
  }[];
  readonly commitRefs: readonly { readonly sha: string; readonly message: string }[];
} | null> {
  const keywords = extractKeywords(issue.title, issue.body);
  if (keywords.length === 0) return null;

  // Search for commit references to this issue
  const commitRefs = await gitLogSearch(cmd, `#${issue.number}`, basePath);

  // Search for keyword matches in codebase
  const rawCodeMatches: {
    readonly file: string;
    readonly line: number;
    readonly snippet: string;
  }[] = [];
  let keywordsMatched = 0;

  for (const keyword of keywords) {
    const matches = await grepCode(cmd, keyword, basePath, {
      excludePaths,
      maxMatches: 10,
    });
    if (matches.length > 0) {
      keywordsMatched++;
      for (const m of matches.slice(0, 3)) {
        rawCodeMatches.push({ file: m.file, line: m.line, snippet: m.text.slice(0, 200) });
      }
    }
  }

  // Deduplicate code matches by file:line
  const seen = new Set<string>();
  const codeMatches = rawCodeMatches.filter((m) => {
    const key = `${m.file}:${m.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Calculate confidence score
  let confidence = 0;
  if (commitRefs.length > 0) confidence += WEIGHT_COMMIT_REF;
  if (keywordsMatched >= 2) {
    confidence += WEIGHT_MULTI_KEYWORD;
  } else if (keywordsMatched === 1) {
    confidence += WEIGHT_SINGLE_KEYWORD;
  }

  const hasCloseRef = commitRefs.some((c) =>
    /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+/i.test(c.message)
  );
  if (hasCloseRef) confidence += 0.3;
  confidence = Math.min(confidence, 1.0);

  // Classify
  let classification: ZombieClassification;
  if (codeMatches.length === 0 && commitRefs.length === 0) {
    classification = 'no_code_found';
  } else if (confidence >= 0.8) {
    classification = 'implemented';
  } else if (confidence >= 0.4) {
    classification = 'partial';
  } else {
    classification = 'unconfirmed';
  }

  return { confidence, classification, codeMatches, commitRefs };
}

/**
 * Scan for zombie issues — implemented but still Open.
 * NEVER auto-closes issues. Returns proposals for human review.
 */
export async function scanZombies(
  gh: GhRunner,
  cmd: CommandRunner,
  args: {
    repo: string;
    basePath?: string;
    excludePaths?: string[];
    maxIssues?: number;
    confidenceThreshold?: number;
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

  const excludeResult = sanitizePaths(args.excludePaths ?? ['node_modules', 'dist', '.git']);
  if (!excludeResult.valid) {
    return {
      isError: true,
      content: [{ type: 'text', text: excludeResult.error }],
    };
  }
  const excludePaths = [...excludeResult.paths];

  const maxIssues = args.maxIssues ?? 100;
  const threshold = args.confidenceThreshold ?? 0.4;

  // Step 1: Fetch open issues via gh CLI
  let issues: readonly OpenIssue[];
  try {
    const result = await gh([
      'issue',
      'list',
      '--repo',
      args.repo,
      '--state',
      'open',
      '--json',
      'number,title,body,labels,createdAt',
      '--limit',
      String(maxIssues),
    ]);
    issues = JSON.parse(result.stdout) as readonly OpenIssue[];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to fetch issues: ${message}` }],
    };
  }

  // Step 2: Analyze each issue against codebase
  const candidates: ZombieCandidate[] = [];

  for (const issue of issues) {
    const analysis = await analyzeIssue(cmd, issue, basePath, excludePaths);
    if (!analysis) continue;

    const { confidence, classification, codeMatches, commitRefs } = analysis;

    if (confidence >= threshold || classification === 'implemented') {
      candidates.push({
        issueNumber: issue.number,
        title: issue.title,
        classification,
        confidence: Math.round(confidence * 100) / 100,
        evidence: {
          codeMatches: codeMatches.slice(0, 5),
          commitRefs: commitRefs.slice(0, 5),
        },
        staleDays: calculateStaleDays(issue.createdAt),
        labels: issue.labels.map((l) => l.name),
      });
    }
  }

  // Step 5: Build summary
  const summary: ZombieSummary = {
    implemented: candidates.filter((c) => c.classification === 'implemented').length,
    partial: candidates.filter((c) => c.classification === 'partial').length,
    unconfirmed: candidates.filter((c) => c.classification === 'unconfirmed').length,
    noCodeFound: candidates.filter((c) => c.classification === 'no_code_found').length,
  };

  const report: ZombieReport = {
    repo: args.repo,
    scannedAt: new Date().toISOString(),
    totalOpenIssues: issues.length,
    candidates,
    summary,
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
