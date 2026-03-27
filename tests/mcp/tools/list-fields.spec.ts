import { test, expect } from '@playwright/test';
import { listFields } from '../../../src/tools/list-fields.js';
import type { graphql } from '@octokit/graphql';

function createMockGql(responses: unknown[]): typeof graphql {
  let callIndex = 0;
  return (async () => {
    const response = responses[callIndex++];
    return response;
  }) as unknown as typeof graphql;
}

const MOCK_PROJECT_ID_RESPONSE = {
  user: { projectV2: { id: 'PVT_123' } },
};

const MOCK_FIELDS_RESPONSE = {
  node: {
    fields: {
      nodes: [
        {
          id: 'PVTSSF_status',
          name: 'Status',
          options: [
            { id: 'opt_1', name: 'Backlog' },
            { id: 'opt_2', name: '開発中' },
            { id: 'opt_3', name: 'Done' },
          ],
        },
        {
          id: 'PVTSSF_priority',
          name: 'Priority',
          options: [
            { id: 'opt_p0', name: 'P0 - Critical' },
            { id: 'opt_p1', name: 'P1 - High' },
          ],
        },
        {
          id: 'PVTF_title',
          name: 'Title',
          dataType: 'TEXT',
        },
        {
          id: 'PVTIF_sprint',
          name: 'Sprint',
          configuration: {
            iterations: [],
            completedIterations: [],
          },
        },
      ],
    },
  },
};

test.describe('project_list_fields tool', () => {
  test('returns fields with correct structure', async () => {
    const gql = createMockGql([MOCK_PROJECT_ID_RESPONSE, MOCK_FIELDS_RESPONSE]);

    const result = await listFields(gql, {
      owner: 'fideguch',
      projectNumber: 1,
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);

    const data = JSON.parse((result.content[0] as { type: string; text: string }).text);
    expect(data.fields).toHaveLength(4);
    expect(data.fields[0].name).toBe('Status');
    expect(data.fields[0].type).toBe('SINGLE_SELECT');
    expect(data.fields[0].options).toHaveLength(3);
  });

  test('returns error for non-existent project', async () => {
    const gql = createMockGql([{ user: { projectV2: null } }]);

    const result = await listFields(gql, {
      owner: 'nobody',
      projectNumber: 999,
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('not found');
  });

  test('identifies ITERATION type fields', async () => {
    const gql = createMockGql([MOCK_PROJECT_ID_RESPONSE, MOCK_FIELDS_RESPONSE]);

    const result = await listFields(gql, {
      owner: 'fideguch',
      projectNumber: 1,
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    const sprintField = data.fields.find((f: { name: string }) => f.name === 'Sprint');
    expect(sprintField.type).toBe('ITERATION');
  });
});
