import { resolve } from 'node:path';
import { existsSync, statSync } from 'node:fs';

/** Characters that should never appear in paths passed to shell commands. */
const DANGEROUS_PATH_CHARS = /[<>|&;`$\0]/;

/** Characters that should never appear in grep/git arguments. */
const DANGEROUS_ARG_CHARS = /^-/;

/**
 * Validate and resolve a basePath for use with grep/git commands.
 * Returns the resolved absolute path or an error message.
 */
export function validateBasePath(
  basePath: string | undefined
):
  | { readonly valid: true; readonly resolved: string }
  | { readonly valid: false; readonly error: string } {
  const raw = basePath ?? process.cwd();

  if (DANGEROUS_PATH_CHARS.test(raw)) {
    return { valid: false, error: `basePath contains invalid characters: ${raw}` };
  }

  const resolved = resolve(raw);

  // Reject paths that escape the current working directory
  const cwd = process.cwd();
  if (!resolved.startsWith(cwd) && raw !== resolved) {
    // Allow absolute paths that exist (e.g., /home/user/project), but reject relative traversal
    if (raw.includes('..')) {
      return { valid: false, error: `basePath traversal detected: ${raw} resolves to ${resolved}` };
    }
  }

  if (!existsSync(resolved)) {
    return { valid: false, error: `basePath does not exist: ${resolved}` };
  }

  try {
    const stat = statSync(resolved);
    if (!stat.isDirectory()) {
      return { valid: false, error: `basePath is not a directory: ${resolved}` };
    }
  } catch {
    return { valid: false, error: `Cannot access basePath: ${resolved}` };
  }

  return { valid: true, resolved };
}

/**
 * Sanitize path-like arguments (scanPaths, excludePaths).
 * Rejects arguments that look like flags (start with -).
 */
export function sanitizePaths(
  paths: readonly string[]
):
  | { readonly valid: true; readonly paths: readonly string[] }
  | { readonly valid: false; readonly error: string } {
  for (const p of paths) {
    if (DANGEROUS_ARG_CHARS.test(p)) {
      return { valid: false, error: `Path argument looks like a flag: "${p}"` };
    }
    if (DANGEROUS_PATH_CHARS.test(p)) {
      return { valid: false, error: `Path contains invalid characters: "${p}"` };
    }
  }
  return { valid: true, paths };
}

/**
 * Escape a string for use as a grep fixed-string pattern.
 * Removes regex metacharacters to prevent pattern injection.
 */
export function escapeGrepPattern(pattern: string): string {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize marker strings for use in grep -E patterns.
 * Only allows alphanumeric + underscore + hyphen.
 */
export function sanitizeMarker(marker: string): string | null {
  if (/^[a-zA-Z0-9_-]+$/.test(marker)) {
    return marker;
  }
  return null;
}
