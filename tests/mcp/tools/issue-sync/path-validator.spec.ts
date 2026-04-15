import { test, expect } from '@playwright/test';
import {
  validateBasePath,
  sanitizePaths,
  escapeGrepPattern,
  sanitizeMarker,
} from '../../../../src/utils/path-validator.js';

test.describe('validateBasePath', () => {
  test('accepts current working directory', () => {
    const result = validateBasePath(undefined);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.resolved).toBe(process.cwd());
    }
  });

  test('accepts existing absolute directory', () => {
    const result = validateBasePath('/tmp');
    expect(result.valid).toBe(true);
  });

  test('rejects path with shell metacharacters', () => {
    const result = validateBasePath('/tmp; rm -rf /');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('invalid characters');
    }
  });

  test('rejects path with pipe character', () => {
    const result = validateBasePath('/tmp | cat /etc/passwd');
    expect(result.valid).toBe(false);
  });

  test('rejects path with backtick', () => {
    const result = validateBasePath('/tmp/`whoami`');
    expect(result.valid).toBe(false);
  });

  test('rejects path with dollar sign', () => {
    const result = validateBasePath('/tmp/$HOME');
    expect(result.valid).toBe(false);
  });

  test('rejects non-existent path', () => {
    const result = validateBasePath('/nonexistent/path/that/does/not/exist');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('does not exist');
    }
  });

  test('rejects file path (not directory)', () => {
    const result = validateBasePath('/etc/hosts');
    // /etc/hosts is a file, not a directory — should be rejected
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('not a directory');
    }
  });

  test('rejects relative traversal with ..', () => {
    const result = validateBasePath('../../etc');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('traversal');
    }
  });
});

test.describe('sanitizePaths', () => {
  test('accepts normal paths', () => {
    const result = sanitizePaths(['src', 'lib', 'app']);
    expect(result.valid).toBe(true);
  });

  test('accepts dot paths', () => {
    const result = sanitizePaths(['.', './src']);
    expect(result.valid).toBe(true);
  });

  test('rejects flag-like arguments', () => {
    const result = sanitizePaths(['--include=*.env']);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('flag');
    }
  });

  test('rejects -e flag injection', () => {
    const result = sanitizePaths(['-e']);
    expect(result.valid).toBe(false);
  });

  test('rejects paths with shell metacharacters', () => {
    const result = sanitizePaths(['src; rm -rf /']);
    expect(result.valid).toBe(false);
  });

  test('accepts empty array', () => {
    const result = sanitizePaths([]);
    expect(result.valid).toBe(true);
  });
});

test.describe('sanitizeMarker', () => {
  test('accepts TODO', () => {
    expect(sanitizeMarker('TODO')).toBe('TODO');
  });

  test('accepts FIXME', () => {
    expect(sanitizeMarker('FIXME')).toBe('FIXME');
  });

  test('accepts HACK', () => {
    expect(sanitizeMarker('HACK')).toBe('HACK');
  });

  test('accepts custom alphanumeric marker', () => {
    expect(sanitizeMarker('REVIEW')).toBe('REVIEW');
  });

  test('accepts marker with hyphen', () => {
    expect(sanitizeMarker('NO-COMMIT')).toBe('NO-COMMIT');
  });

  test('rejects marker with regex metacharacters', () => {
    expect(sanitizeMarker('TODO.*')).toBeNull();
  });

  test('rejects marker with parentheses', () => {
    expect(sanitizeMarker('TODO(user)')).toBeNull();
  });

  test('rejects marker with pipe', () => {
    expect(sanitizeMarker('TODO|FIXME')).toBeNull();
  });

  test('rejects marker with spaces', () => {
    expect(sanitizeMarker('TODO please')).toBeNull();
  });

  test('rejects empty string', () => {
    expect(sanitizeMarker('')).toBeNull();
  });
});

test.describe('escapeGrepPattern', () => {
  test('escapes regex metacharacters', () => {
    expect(escapeGrepPattern('foo.bar')).toBe('foo\\.bar');
    expect(escapeGrepPattern('a*b+c?')).toBe('a\\*b\\+c\\?');
    expect(escapeGrepPattern('[test]')).toBe('\\[test\\]');
    expect(escapeGrepPattern('(group)')).toBe('\\(group\\)');
  });

  test('leaves alphanumeric unchanged', () => {
    expect(escapeGrepPattern('foobar123')).toBe('foobar123');
  });

  test('handles empty string', () => {
    expect(escapeGrepPattern('')).toBe('');
  });
});
