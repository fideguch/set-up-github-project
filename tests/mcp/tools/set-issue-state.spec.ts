import { test, expect } from '@playwright/test';
import { setIssueState } from '../../../src/tools/set-issue-state.js';
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

test.describe('project_set_issue_state tool', () => {
  test('closes issue successfully', async () => {
    const { runner, calls } = createMockGh();
    const result = await setIssueState(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      state: 'closed',
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('close');
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.summary).toContain('Closed');
  });

  test('reopens issue successfully', async () => {
    const { runner, calls } = createMockGh();
    const result = await setIssueState(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      state: 'open',
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('reopen');
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.summary).toContain('Reopened');
  });

  test('closes with not_planned reason', async () => {
    const { runner, calls } = createMockGh();
    const result = await setIssueState(runner, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      state: 'closed',
      reason: 'not_planned',
    });

    expect(result.isError).toBeUndefined();
    expect(calls[0]).toContain('--reason');
    expect(calls[0]).toContain('not planned');
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.summary).toContain('not_planned');
  });
});
