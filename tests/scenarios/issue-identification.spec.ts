import { test, expect } from '@playwright/test';
import { createCallMatcherGql } from './fixtures/mock-gql.js';
import { listItems } from '../../src/tools/list-items.js';
import { getIssue } from '../../src/tools/get-issue.js';

const MOCK_PROJECT_ID = { user: { projectV2: { id: 'PVT_123' } } };

const MOCK_ITEMS = {
  node: {
    items: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          id: 'PVTI_1',
          content: { number: 10, title: 'Login bug', state: 'OPEN', labels: { nodes: [] } },
          fieldValues: { nodes: [{ field: { name: 'Status' }, name: 'Backlog' }] },
        },
        {
          id: 'PVTI_2',
          content: { number: 20, title: 'Dashboard chart', state: 'OPEN', labels: { nodes: [] } },
          fieldValues: { nodes: [{ field: { name: 'Status' }, name: '開発中' }] },
        },
        {
          id: 'PVTI_3',
          content: {
            number: 30,
            title: 'Login page redesign',
            state: 'OPEN',
            labels: { nodes: [] },
          },
          fieldValues: { nodes: [{ field: { name: 'Status' }, name: 'Backlog' }] },
        },
      ],
    },
  },
};

const MOCK_ISSUE_DETAIL = {
  repository: {
    issue: {
      id: 'I_10',
      number: 10,
      title: 'Login bug',
      body: 'Cannot login with email',
      state: 'OPEN',
      url: 'https://github.com/fideguch/my-app/issues/10',
      labels: { nodes: [] },
      assignees: { nodes: [] },
      milestone: null,
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-15T00:00:00Z',
    },
  },
};

test.describe('Issue Identification Scenario', () => {
  test('search by keyword in project items', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MOCK_ITEMS },
    ]);

    const result = await listItems(gql, { owner: 'fideguch', projectNumber: 1 });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    const loginItems = data.items.filter((i: { title: string }) =>
      i.title.toLowerCase().includes('login')
    );
    expect(loginItems).toHaveLength(2);
  });

  test('get specific issue after identification', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetIssueByNumber', response: MOCK_ISSUE_DETAIL },
    ]);

    const result = await getIssue(gql, { repo: 'fideguch/my-app', issueNumber: 10 });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.data.title).toBe('Login bug');
    expect(data.data.body).toContain('Cannot login');
  });

  test('filter by status narrows results', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MOCK_ITEMS },
    ]);

    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      statusFilter: '開発中',
    });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].title).toBe('Dashboard chart');
  });

  test('non-existent issue returns error', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetIssueByNumber', response: { repository: { issue: null } } },
    ]);

    const result = await getIssue(gql, { repo: 'fideguch/my-app', issueNumber: 999 });
    expect(result.isError).toBe(true);
  });

  test('all items have itemId for subsequent operations', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MOCK_ITEMS },
    ]);

    const result = await listItems(gql, { owner: 'fideguch', projectNumber: 1 });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    for (const item of data.items) {
      expect(item.itemId).toBeTruthy();
      expect(item.itemId).toMatch(/^PVTI_/);
    }
  });
});
