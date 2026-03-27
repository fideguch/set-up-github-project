import { test, expect } from '@playwright/test';
import { getIssue } from '../../../src/tools/get-issue.js';
import type { graphql } from '@octokit/graphql';

function createMockGql(responses: unknown[]): typeof graphql {
  let callIndex = 0;
  return (async () => {
    const resp = responses[callIndex++];
    if (resp instanceof Error) throw resp;
    return resp;
  }) as unknown as typeof graphql;
}

const MOCK_ISSUE = {
  repository: {
    issue: {
      id: 'I_123',
      number: 42,
      title: 'Login bug',
      body: 'Cannot login',
      state: 'OPEN',
      url: 'https://github.com/fideguch/my-app/issues/42',
      labels: { nodes: [{ name: 'bug' }] },
      assignees: { nodes: [{ login: 'fideguch' }] },
      milestone: { title: 'v1.0' },
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-15T00:00:00Z',
    },
  },
};

test.describe('project_get_issue tool', () => {
  test('returns issue details successfully', async () => {
    const gql = createMockGql([MOCK_ISSUE]);
    const result = await getIssue(gql, { repo: 'fideguch/my-app', issueNumber: 42 });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.summary).toContain('#42');
    expect(data.summary).toContain('Login bug');
    expect(data.data.labels).toEqual(['bug']);
    expect(data.data.assignees).toEqual(['fideguch']);
  });

  test('returns error for non-existent issue', async () => {
    const gql = createMockGql([{ repository: { issue: null } }]);
    const result = await getIssue(gql, { repo: 'fideguch/my-app', issueNumber: 999 });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('#999');
  });

  test('returns error for non-existent repo', async () => {
    const gql = createMockGql([new Error('Not Found')]);
    const result = await getIssue(gql, { repo: 'nobody/nope', issueNumber: 1 });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('nobody/nope');
  });
});
