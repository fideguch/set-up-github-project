import { test, expect } from '@playwright/test';
import { setPriority } from '../../../src/tools/set-priority.js';
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
          id: 'PVTSSF_priority',
          name: 'Priority',
          options: [
            { id: 'opt_p0', name: 'P0 - Critical' },
            { id: 'opt_p1', name: 'P1 - High' },
            { id: 'opt_p2', name: 'P2 - Medium' },
            { id: 'opt_p3', name: 'P3 - Low' },
            { id: 'opt_p4', name: 'P4 - Nice to have' },
          ],
        },
      ],
    },
  },
};

test.describe('project_set_priority tool', () => {
  test('sets priority successfully', async () => {
    const gql = createMockGql([
      MOCK_PROJECT_ID,
      MOCK_FIELDS,
      { updateProjectV2ItemFieldValue: { projectV2Item: { id: 'PVTI_1' } } },
    ]);

    const result = await setPriority(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      itemId: 'PVTI_1',
      priority: 'P0',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.success).toBe(true);
    expect(data.message).toContain('P0');
  });

  test('matches by prefix (P0 matches P0 - Critical)', async () => {
    const gql = createMockGql([
      MOCK_PROJECT_ID,
      MOCK_FIELDS,
      { updateProjectV2ItemFieldValue: { projectV2Item: { id: 'PVTI_1' } } },
    ]);

    const result = await setPriority(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      itemId: 'PVTI_1',
      priority: 'P2',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.success).toBe(true);
  });

  test('returns error when Priority field not found', async () => {
    const gql = createMockGql([MOCK_PROJECT_ID, { node: { fields: { nodes: [] } } }]);

    const result = await setPriority(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      itemId: 'PVTI_1',
      priority: 'P0',
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('not found');
  });
});
