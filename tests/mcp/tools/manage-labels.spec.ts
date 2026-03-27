import { test, expect } from '@playwright/test';
import { manageLabels } from '../../../src/tools/manage-labels.js';
import type { GhRunner } from '../../../src/utils/gh-cli.js';

function createMockGh(shouldFail = false): { runner: GhRunner; calls: string[][] } {
  const calls: string[][] = [];
  const runner: GhRunner = async (args) => {
    calls.push([...args]);
    if (shouldFail) throw new Error('gh failed');
    return { stdout: '', stderr: '' };
  };
  return { runner, calls };
}

test.describe('project_manage_labels tool', () => {
  test('adds labels successfully', async () => {
    const { runner, calls } = createMockGh();
    const result = await manageLabels(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      addLabels: ['bug', 'frontend'],
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--add-label');
    expect(calls[0]).toContain('bug,frontend');
  });

  test('removes labels successfully', async () => {
    const { runner, calls } = createMockGh();
    const result = await manageLabels(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      removeLabels: ['wontfix'],
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--remove-label');
  });

  test('adds and removes labels simultaneously', async () => {
    const { runner, calls } = createMockGh();
    const result = await manageLabels(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      addLabels: ['bug'],
      removeLabels: ['feature'],
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--add-label');
    expect(calls[0]).toContain('--remove-label');
  });

  test('returns error when no labels provided', async () => {
    const { runner } = createMockGh();
    const result = await manageLabels(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
    });

    expect(result.isError).toBe(true);
  });
});
