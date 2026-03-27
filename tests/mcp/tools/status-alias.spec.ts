import { test, expect } from '@playwright/test';
import { resolveStatusAlias } from '../../../src/utils/status-alias.js';

const STATUSES = ['Backlog', '開発中', 'コードレビュー', 'Done', 'Icebox', 'テスト中'];

test.describe('resolveStatusAlias', () => {
  test('exact match returns the status', () => {
    expect(resolveStatusAlias('開発中', STATUSES)).toBe('開発中');
    expect(resolveStatusAlias('Done', STATUSES)).toBe('Done');
  });

  test('alias match resolves correctly', () => {
    expect(resolveStatusAlias('dev', STATUSES)).toBe('開発中');
    expect(resolveStatusAlias('review', STATUSES)).toBe('コードレビュー');
    expect(resolveStatusAlias('testing', STATUSES)).toBe('テスト中');
  });

  test('partial match (case-insensitive) resolves correctly', () => {
    expect(resolveStatusAlias('done', STATUSES)).toBe('Done');
    expect(resolveStatusAlias('back', STATUSES)).toBe('Backlog');
    expect(resolveStatusAlias('ice', STATUSES)).toBe('Icebox');
  });

  test('returns null for no match', () => {
    expect(resolveStatusAlias('nonexistent', STATUSES)).toBeNull();
  });
});
