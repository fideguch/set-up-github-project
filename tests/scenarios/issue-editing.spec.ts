import { test, expect } from '@playwright/test';
import { createCallMatcherGql } from './fixtures/mock-gql.js';
import { createMockGhRunner } from './fixtures/mock-gh-cli.js';
import { getIssue } from '../../src/tools/get-issue.js';
import { editIssue } from '../../src/tools/edit-issue.js';
import { manageLabels } from '../../src/tools/manage-labels.js';
import { manageAssignees } from '../../src/tools/manage-assignees.js';
import { setIssueState } from '../../src/tools/set-issue-state.js';

const MOCK_ISSUE_RESPONSE = {
  repository: {
    issue: {
      id: 'I_42',
      number: 42,
      title: 'Login bug',
      body: 'Steps to reproduce...',
      state: 'OPEN',
      url: 'https://github.com/fideguch/my-app/issues/42',
      labels: { nodes: [{ name: 'bug' }] },
      assignees: { nodes: [{ login: 'fideguch' }] },
      milestone: null,
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-15T00:00:00Z',
    },
  },
};

test.describe('Issue Editing Scenario', () => {
  test('get issue → verify details', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetIssueByNumber', response: MOCK_ISSUE_RESPONSE },
    ]);

    const result = await getIssue(gql, { repo: 'fideguch/my-app', issueNumber: 42 });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.data.title).toBe('Login bug');
    expect(data.data.state).toBe('OPEN');
  });

  test('edit title via gh CLI', async () => {
    const { gh, calls } = createMockGhRunner();
    const result = await editIssue(gh, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      title: 'Login page bug fix',
    });

    expect(result.isError).toBeUndefined();
    expect(calls).toHaveLength(1);
    expect(calls[0]!.args).toContain('--title');
  });

  test('add labels then remove labels', async () => {
    const { gh, calls } = createMockGhRunner();

    await manageLabels(gh, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      addLabels: ['frontend', 'P0'],
    });
    expect(calls).toHaveLength(1);

    await manageLabels(gh, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      removeLabels: ['bug'],
    });
    expect(calls).toHaveLength(2);
  });

  test('manage assignees', async () => {
    const { gh, calls } = createMockGhRunner();
    await manageAssignees(gh, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      addAssignees: ['octocat'],
      removeAssignees: ['fideguch'],
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.args).toContain('--add-assignee');
    expect(calls[0]!.args).toContain('--remove-assignee');
  });

  test('close issue → reopen issue', async () => {
    const { gh, calls } = createMockGhRunner();

    const closeResult = await setIssueState(gh, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      state: 'closed',
    });
    expect(closeResult.isError).toBeUndefined();

    const reopenResult = await setIssueState(gh, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      state: 'open',
    });
    expect(reopenResult.isError).toBeUndefined();
    expect(calls).toHaveLength(2);
    expect(calls[0]!.args).toContain('close');
    expect(calls[1]!.args).toContain('reopen');
  });

  test('gh CLI failure is handled gracefully', async () => {
    const { gh } = createMockGhRunner({ failOn: ['edit'] });
    const result = await editIssue(gh, {
      repo: 'fideguch/my-app',
      issueNumber: 42,
      title: 'Will fail',
    });

    expect(result.isError).toBe(true);
  });
});
