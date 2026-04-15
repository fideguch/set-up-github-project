import type { CommandRunner } from './command-runner.js';

// --- Types ---

export interface GrepMatch {
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

export interface CommitRef {
  readonly sha: string;
  readonly message: string;
}

// --- Stop words for keyword extraction (English + common code terms) ---

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'can',
  'shall',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'out',
  'off',
  'up',
  'down',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'and',
  'but',
  'or',
  'nor',
  'not',
  'no',
  'so',
  'if',
  'when',
  'than',
  'too',
  'very',
  'just',
  'about',
  'also',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'my',
  'your',
  'his',
  'her',
  'our',
  'their',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'only',
  'same',
  'new',
  'old',
  'add',
  'fix',
  'update',
  // Japanese particles / common words
  'の',
  'を',
  'に',
  'は',
  'が',
  'で',
  'と',
  'も',
  'か',
  'へ',
  'から',
  'まで',
  'より',
  'する',
  'した',
  'して',
  'される',
  'ある',
  'ない',
  'こと',
  'もの',
  'ため',
  'よう',
  'など',
  'について',
  'として',
]);

/**
 * Extract meaningful keywords from issue title and body.
 * Filters stop words, short tokens, and returns up to maxKeywords terms.
 */
export function extractKeywords(
  title: string,
  body: string | null,
  maxKeywords = 5
): readonly string[] {
  const combined = `${title} ${body ?? ''}`;

  // Split on whitespace, punctuation, markdown syntax
  const tokens = combined
    .replace(/[#*`[\](){}|<>:;,."'!?=+\-_/\\@~^]/g, ' ')
    .split(/\s+/)
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length >= 3)
    .filter((t) => !STOP_WORDS.has(t))
    .filter((t) => !/^\d+$/.test(t)); // exclude pure numbers

  // Deduplicate while preserving order (title keywords first)
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const token of tokens) {
    if (!seen.has(token)) {
      seen.add(token);
      unique.push(token);
    }
  }

  return unique.slice(0, maxKeywords);
}

/**
 * Run grep against a codebase directory.
 * Returns structured matches, limited to maxMatches per invocation.
 */
export async function grepCode(
  runner: CommandRunner,
  pattern: string,
  basePath: string,
  options?: {
    readonly excludePaths?: readonly string[];
    readonly maxMatches?: number;
    readonly fileGlobs?: readonly string[];
  }
): Promise<readonly GrepMatch[]> {
  const args: string[] = ['-rn', '--max-count', String(options?.maxMatches ?? 50)];

  // File type filters
  const globs = options?.fileGlobs ?? ['*.ts', '*.tsx', '*.js', '*.jsx', '*.py', '*.go', '*.rs'];
  for (const glob of globs) {
    args.push('--include', glob);
  }

  // Exclude paths
  const excludes = options?.excludePaths ?? ['node_modules', 'dist', '.git', 'vendor', '.next'];
  for (const ex of excludes) {
    args.push('--exclude-dir', ex);
  }

  // Use -F (fixed strings) to prevent regex metacharacter injection from issue titles
  args.push('-F', '-e', pattern, basePath);

  try {
    const result = await runner('grep', args, { cwd: basePath });
    return parseGrepOutput(result.stdout);
  } catch {
    // grep returns exit code 1 for no matches — not an error
    return [];
  }
}

/**
 * Search git log for commits referencing a pattern (e.g., issue number).
 */
export async function gitLogSearch(
  runner: CommandRunner,
  query: string,
  basePath: string
): Promise<readonly CommitRef[]> {
  try {
    const result = await runner(
      'git',
      [
        '-C',
        basePath,
        'log',
        '--all',
        '--oneline',
        '--max-count=20',
        '--fixed-strings',
        `--grep=${query}`,
      ],
      { cwd: basePath }
    );
    return parseGitLogOutput(result.stdout);
  } catch {
    return [];
  }
}

/**
 * Calculate days since a given ISO date string.
 */
export function calculateStaleDays(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Simple keyword overlap matching for TODO-to-issue deduplication.
 * Returns true if overlap ratio exceeds threshold.
 */
export function fuzzyMatch(todoText: string, issueTitle: string, threshold = 0.4): boolean {
  const todoTokens = new Set(
    todoText
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 3)
  );
  const issueTokens = issueTitle
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  if (issueTokens.length === 0 || todoTokens.size === 0) return false;

  let matches = 0;
  for (const token of issueTokens) {
    if (todoTokens.has(token)) matches++;
  }

  return matches / issueTokens.length >= threshold;
}

// --- Internal parsers ---

function parseGrepOutput(stdout: string): readonly GrepMatch[] {
  const lines = stdout.trim().split('\n').filter(Boolean);
  const matches: GrepMatch[] = [];

  for (const line of lines) {
    // Format: file:line:text
    const firstColon = line.indexOf(':');
    if (firstColon === -1) continue;
    const secondColon = line.indexOf(':', firstColon + 1);
    if (secondColon === -1) continue;

    const file = line.slice(0, firstColon);
    const lineNum = parseInt(line.slice(firstColon + 1, secondColon), 10);
    const text = line.slice(secondColon + 1).trim();

    if (!isNaN(lineNum)) {
      matches.push({ file, line: lineNum, text });
    }
  }

  return matches;
}

function parseGitLogOutput(stdout: string): readonly CommitRef[] {
  const lines = stdout.trim().split('\n').filter(Boolean);
  return lines.map((line) => {
    const spaceIdx = line.indexOf(' ');
    return {
      sha: spaceIdx > 0 ? line.slice(0, spaceIdx) : line,
      message: spaceIdx > 0 ? line.slice(spaceIdx + 1) : '',
    };
  });
}
