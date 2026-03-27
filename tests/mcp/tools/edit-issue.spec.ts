import { test, expect } from '@playwright/test';
import { editIssue } from '../../../src/tools/edit-issue.js';
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

test.describe('project_edit_issue tool', () => {
  test('edits title successfully', async () => {
    const { runner, calls } = createMockGh();
    const result = await editIssue(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      title: 'New Title',
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--title');
    expect(calls[0]).toContain('New Title');
  });

  test('edits body successfully', async () => {
    const { runner, calls } = createMockGh();
    const result = await editIssue(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      body: 'Updated body',
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--body');
  });

  test('edits both title and body', async () => {
    const { runner, calls } = createMockGh();
    const result = await editIssue(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      title: 'New Title',
      body: 'New Body',
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--title');
    expect(calls[0]).toContain('--body');
  });

  test('returns error when gh CLI fails', async () => {
    const { runner } = createMockGh(true);
    const result = await editIssue(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      title: 'Will Fail',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Failed to edit issue');
  });
});
