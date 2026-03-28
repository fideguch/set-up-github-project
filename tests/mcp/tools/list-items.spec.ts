import { test, expect } from '@playwright/test';
import { listItems } from '../../../src/tools/list-items.js';
import type { graphql } from '@octokit/graphql';

function createMockGql(responses: unknown[]): typeof graphql {
  let callIndex = 0;
  return (async () => {
    return responses[callIndex++];
  }) as unknown as typeof graphql;
}

const MOCK_PROJECT_ID = { user: { projectV2: { id: 'PVT_123' } } };

const MOCK_ITEMS = {
  node: {
    items: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          id: 'PVTI_item1',
          content: {
            number: 1,
            title: 'Fix login bug',
            state: 'OPEN',
            labels: { nodes: [{ name: 'bug' }] },
          },
          fieldValues: {
            nodes: [
              { field: { name: 'Status' }, name: '開発中' },
              { field: { name: 'Priority' }, name: 'P0 - Critical' },
              { field: { name: 'Estimate' }, number: 3 },
            ],
          },
        },
        {
          id: 'PVTI_item2',
          content: {
            number: 2,
            title: 'Add dashboard',
            state: 'OPEN',
            labels: { nodes: [{ name: 'blocked' }] },
          },
          fieldValues: {
            nodes: [
              { field: { name: 'Status' }, name: 'Backlog' },
              { field: { name: 'Priority' }, name: 'P1 - High' },
            ],
          },
        },
        {
          id: 'PVTI_item3',
          content: {
            number: 3,
            title: 'Update docs',
            state: 'CLOSED',
          },
          fieldValues: {
            nodes: [{ field: { name: 'Status' }, name: 'Done' }],
          },
        },
      ],
    },
  },
};

test.describe('project_list_items tool', () => {
  test('returns all items', async () => {
    const gql = createMockGql([MOCK_PROJECT_ID, MOCK_ITEMS]);

    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalCount).toBe(3);
    expect(data.items).toHaveLength(3);
  });

  test('maps item fields correctly', async () => {
    const gql = createMockGql([MOCK_PROJECT_ID, MOCK_ITEMS]);

    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    const item1 = data.items[0];
    expect(item1.itemId).toBe('PVTI_item1');
    expect(item1.number).toBe(1);
    expect(item1.title).toBe('Fix login bug');
    expect(item1.status).toBe('開発中');
    expect(item1.priority).toBe('P0 - Critical');
    expect(item1.estimate).toBe(3);
  });

  test('detects blocked items', async () => {
    const gql = createMockGql([MOCK_PROJECT_ID, MOCK_ITEMS]);

    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items[1].isBlocked).toBe(true);
    expect(data.items[0].isBlocked).toBe(false);
  });

  test('filters by status', async () => {
    const gql = createMockGql([MOCK_PROJECT_ID, MOCK_ITEMS]);

    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      statusFilter: 'Done',
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalCount).toBe(1);
    expect(data.items[0].title).toBe('Update docs');
  });

  test('filters by priority', async () => {
    const gql = createMockGql([MOCK_PROJECT_ID, MOCK_ITEMS]);

    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      priorityFilter: 'P0',
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalCount).toBe(1);
    expect(data.items[0].title).toBe('Fix login bug');
  });

  test('returns pagination metadata for single page', async () => {
    const gql = createMockGql([MOCK_PROJECT_ID, MOCK_ITEMS]);

    const result = await listItems(gql, { owner: 'fideguch', projectNumber: 1 });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.pagesFetched).toBe(1);
    expect(data.totalCount).toBe(3);
  });

  test('paginates through multiple pages', async () => {
    const page1 = {
      node: {
        items: {
          pageInfo: { hasNextPage: true, endCursor: 'cursor_1' },
          nodes: MOCK_ITEMS.node.items.nodes.slice(0, 2),
        },
      },
    };
    const page2 = {
      node: {
        items: {
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: MOCK_ITEMS.node.items.nodes.slice(2),
        },
      },
    };
    const gql = createMockGql([MOCK_PROJECT_ID, page1, page2]);

    const result = await listItems(gql, { owner: 'fideguch', projectNumber: 1 });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.pagesFetched).toBe(2);
    expect(data.totalCount).toBe(3);
  });

  test('returns error for non-existent project', async () => {
    const gql = createMockGql([{ user: { projectV2: null } }]);

    const result = await listItems(gql, {
      owner: 'nobody',
      projectNumber: 999,
    });

    expect(result.isError).toBe(true);
  });
});
