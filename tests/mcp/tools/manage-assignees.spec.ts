import { test, expect } from '@playwright/test';
import { manageAssignees } from '../../../src/tools/manage-assignees.js';
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

test.describe('project_manage_assignees tool', () => {
  test('adds assignees successfully', async () => {
    const { runner, calls } = createMockGh();
    const result = await manageAssignees(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      addAssignees: ['fideguch', 'octocat'],
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--add-assignee');
    expect(calls[0]).toContain('fideguch,octocat');
  });

  test('removes assignees successfully', async () => {
    const { runner, calls } = createMockGh();
    const result = await manageAssignees(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      removeAssignees: ['octocat'],
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--remove-assignee');
  });

  test('returns error when no assignees provided', async () => {
    const { runner } = createMockGh();
    const result = await manageAssignees(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
    });

    expect(result.isError).toBe(true);
  });
});
