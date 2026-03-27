import { test, expect } from '@playwright/test';
import { addItem } from '../../../src/tools/add-item.js';
import type { graphql } from '@octokit/graphql';

function createMockGql(responses: unknown[]): typeof graphql {
  let callIndex = 0;
  return (async () => {
    return responses[callIndex++];
  }) as unknown as typeof graphql;
}

test.describe('project_add_item tool', () => {
  test('adds an issue to a project', async () => {
    const gql = createMockGql([
      // get project id
      { user: { projectV2: { id: 'PVT_123' } } },
      // get node id
      { repository: { issue: { id: 'I_issue1' } } },
      // add item mutation
      { addProjectV2ItemById: { item: { id: 'PVTI_new1' } } },
    ]);

    const result = await addItem(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      repo: 'fideguch/my_pm_tools',
      itemNumber: 42,
      itemType: 'issue',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.itemId).toBe('PVTI_new1');
    expect(data.message).toContain('fideguch/my_pm_tools#42');
  });

  test('adds a PR to a project', async () => {
    const gql = createMockGql([
      { user: { projectV2: { id: 'PVT_123' } } },
      { repository: { pullRequest: { id: 'PR_pr1' } } },
      { addProjectV2ItemById: { item: { id: 'PVTI_new2' } } },
    ]);

    const result = await addItem(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      repo: 'fideguch/my_pm_tools',
      itemNumber: 10,
      itemType: 'pr',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.itemId).toBe('PVTI_new2');
  });

  test('returns error for non-existent project', async () => {
    const gql = createMockGql([{ user: { projectV2: null } }]);

    const result = await addItem(gql, {
      owner: 'nobody',
      projectNumber: 999,
      repo: 'nobody/repo',
      itemNumber: 1,
      itemType: 'issue',
    });

    expect(result.isError).toBe(true);
  });

  test('returns error when issue not found', async () => {
    let callCount = 0;
    const throwingGql = (async () => {
      callCount++;
      if (callCount === 1) {
        return { user: { projectV2: { id: 'PVT_123' } } };
      }
      throw new Error('Not found');
    }) as unknown as typeof graphql;

    const result = await addItem(throwingGql, {
      owner: 'fideguch',
      projectNumber: 1,
      repo: 'fideguch/my_pm_tools',
      itemNumber: 9999,
      itemType: 'issue',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('not found');
  });
});
