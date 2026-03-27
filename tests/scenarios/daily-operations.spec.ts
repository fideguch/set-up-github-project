import { test, expect } from '@playwright/test';
import { createCallMatcherGql } from './fixtures/mock-gql.js';
import { listItems } from '../../src/tools/list-items.js';
import { moveStatus } from '../../src/tools/move-status.js';

const MOCK_PROJECT_ID = { user: { projectV2: { id: 'PVT_123' } } };

const MOCK_ITEMS = {
  node: {
    items: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          id: 'PVTI_1',
          content: {
            number: 1,
            title: 'Feature A',
            state: 'OPEN',
            labels: { nodes: [] },
          },
          fieldValues: {
            nodes: [
              { field: { name: 'Status' }, name: 'Backlog' },
              { field: { name: 'Priority' }, name: 'P1' },
            ],
          },
        },
        {
          id: 'PVTI_2',
          content: {
            number: 2,
            title: 'Bug B',
            state: 'OPEN',
            labels: { nodes: [{ name: 'blocked' }] },
          },
          fieldValues: {
            nodes: [{ field: { name: 'Status' }, name: '開発中' }],
          },
        },
      ],
    },
  },
};

const MOCK_FIELDS = {
  node: {
    fields: {
      nodes: [
        {
          id: 'PVTSSF_status',
          name: 'Status',
          options: [
            { id: 'opt_backlog', name: 'Backlog' },
            { id: 'opt_dev', name: '開発中' },
            { id: 'opt_done', name: 'Done' },
          ],
        },
      ],
    },
  },
};

test.describe('Daily Operations Scenario', () => {
  test('list items returns all items', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MOCK_ITEMS },
    ]);

    const result = await listItems(gql, { owner: 'fideguch', projectNumber: 1 });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toHaveLength(2);
  });

  test('list items filters by status', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MOCK_ITEMS },
    ]);

    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      statusFilter: 'Backlog',
    });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].title).toBe('Feature A');
  });

  test('list items filters by priority', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MOCK_ITEMS },
    ]);

    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      priorityFilter: 'P1',
    });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toHaveLength(1);
  });

  test('status change with alias "dev" resolves to 開発中', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectFields', response: MOCK_FIELDS },
      {
        match: 'UpdateItemField',
        response: { updateProjectV2ItemFieldValue: { projectV2Item: { id: 'PVTI_1' } } },
      },
    ]);

    const result = await moveStatus(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      itemId: 'PVTI_1',
      status: 'dev',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.summary).toContain('開発中');
  });

  test('blocked items are correctly identified', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MOCK_ITEMS },
    ]);

    const result = await listItems(gql, { owner: 'fideguch', projectNumber: 1 });
    const data = JSON.parse((result.content[0] as { text: string }).text);
    const blockedItems = data.items.filter((i: { isBlocked: boolean }) => i.isBlocked);
    expect(blockedItems).toHaveLength(1);
    expect(blockedItems[0].title).toBe('Bug B');
  });

  test('non-existent project returns error', async () => {
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: { user: { projectV2: null } } },
    ]);

    const result = await listItems(gql, { owner: 'nobody', projectNumber: 999 });
    expect(result.isError).toBe(true);
  });
});
