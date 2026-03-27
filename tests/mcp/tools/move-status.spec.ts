import { test, expect } from '@playwright/test';
import { moveStatus } from '../../../src/tools/move-status.js';
import type { graphql } from '@octokit/graphql';

function createMockGql(responses: unknown[]): typeof graphql {
  let callIndex = 0;
  return (async () => {
    return responses[callIndex++];
  }) as unknown as typeof graphql;
}

const MOCK_PROJECT_ID = { user: { projectV2: { id: 'PVT_123' } } };

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
            { id: 'opt_review', name: 'コードレビュー' },
            { id: 'opt_done', name: 'Done' },
          ],
        },
      ],
    },
  },
};

test.describe('project_move_status tool', () => {
  test('changes status successfully', async () => {
    const gql = createMockGql([
      MOCK_PROJECT_ID,
      MOCK_FIELDS,
      { updateProjectV2ItemFieldValue: { projectV2Item: { id: 'PVTI_1' } } },
    ]);

    const result = await moveStatus(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      itemId: 'PVTI_1',
      status: '開発中',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.success).toBe(true);
    expect(data.message).toContain('開発中');
  });

  test('returns error for invalid status', async () => {
    const gql = createMockGql([MOCK_PROJECT_ID, MOCK_FIELDS]);

    const result = await moveStatus(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      itemId: 'PVTI_1',
      status: 'InvalidStatus',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('not found');
    expect(text).toContain('Backlog');
    expect(text).toContain('Done');
  });

  test('returns error for non-existent project', async () => {
    const gql = createMockGql([{ user: { projectV2: null } }]);

    const result = await moveStatus(gql, {
      owner: 'nobody',
      projectNumber: 999,
      itemId: 'PVTI_1',
      status: 'Done',
    });

    expect(result.isError).toBe(true);
  });
});
