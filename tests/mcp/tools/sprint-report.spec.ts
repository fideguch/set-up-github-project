import { test, expect } from '@playwright/test';
import { sprintReport } from '../../../src/tools/sprint-report.js';
import type { graphql } from '@octokit/graphql';

function createMockGql(responses: unknown[]): typeof graphql {
  let callIndex = 0;
  return (async () => {
    return responses[callIndex++];
  }) as unknown as typeof graphql;
}

const today = new Date().toISOString().slice(0, 10);

const MOCK_PROJECT_FULL = {
  user: {
    projectV2: {
      id: 'PVT_123',
      title: 'My Project',
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
            id: 'PVTIF_sprint',
            name: 'Sprint',
            configuration: {
              iterations: [
                {
                  id: 'iter_current',
                  title: 'Sprint 2026-W13',
                  startDate: today,
                  duration: 14,
                },
              ],
              completedIterations: [
                {
                  id: 'iter_prev',
                  title: 'Sprint 2026-W11',
                  startDate: '2026-03-01',
                  duration: 14,
                },
              ],
            },
          },
        ],
      },
      items: {
        nodes: [
          {
            id: 'PVTI_1',
            content: {
              number: 1,
              title: 'Fix bug',
              state: 'CLOSED',
              labels: { nodes: [] },
            },
            fieldValues: {
              nodes: [
                { field: { name: 'Status' }, name: 'Done' },
                { field: { name: 'Priority' }, name: 'P0 - Critical' },
                { field: { name: 'Estimate' }, number: 3 },
                {
                  field: { name: 'Sprint' },
                  title: 'Sprint 2026-W13',
                  iterationId: 'iter_current',
                  startDate: today,
                  duration: 14,
                },
              ],
            },
          },
          {
            id: 'PVTI_2',
            content: {
              number: 2,
              title: 'Add feature',
              state: 'OPEN',
              labels: { nodes: [{ name: 'blocked' }] },
            },
            fieldValues: {
              nodes: [
                { field: { name: 'Status' }, name: '開発中' },
                { field: { name: 'Priority' }, name: 'P1 - High' },
                { field: { name: 'Estimate' }, number: 5 },
                {
                  field: { name: 'Sprint' },
                  title: 'Sprint 2026-W13',
                  iterationId: 'iter_current',
                  startDate: today,
                  duration: 14,
                },
              ],
            },
          },
          {
            id: 'PVTI_3',
            content: {
              number: 3,
              title: 'Old task',
              state: 'CLOSED',
              labels: { nodes: [] },
            },
            fieldValues: {
              nodes: [
                { field: { name: 'Status' }, name: 'Done' },
                {
                  field: { name: 'Sprint' },
                  title: 'Sprint 2026-W11',
                  iterationId: 'iter_prev',
                  startDate: '2026-03-01',
                  duration: 14,
                },
              ],
            },
          },
        ],
      },
    },
  },
};

test.describe('project_sprint_report tool', () => {
  test('generates report for current sprint', async () => {
    const gql = createMockGql([MOCK_PROJECT_FULL]);

    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'current',
    });

    expect(result.isError).toBeUndefined();
    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.sprint).toBe('Sprint 2026-W13');
    expect(report.summary.total).toBe(2);
    expect(report.summary.completed).toBe(1);
    expect(report.summary.completionRate).toBe(50);
    expect(report.summary.blocked).toBe(1);
  });

  test('calculates velocity from estimates', async () => {
    const gql = createMockGql([MOCK_PROJECT_FULL]);

    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'current',
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.velocity.estimateTotal).toBe(8);
    expect(report.velocity.estimateCompleted).toBe(3);
  });

  test('provides status breakdown', async () => {
    const gql = createMockGql([MOCK_PROJECT_FULL]);

    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'current',
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.statusBreakdown['Done']).toBe(1);
    expect(report.statusBreakdown['開発中']).toBe(1);
  });

  test('lists blocked items', async () => {
    const gql = createMockGql([MOCK_PROJECT_FULL]);

    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'current',
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.blockedItems).toHaveLength(1);
    expect(report.blockedItems[0].title).toBe('Add feature');
  });

  test('reports on previous sprint', async () => {
    const gql = createMockGql([MOCK_PROJECT_FULL]);

    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'previous',
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.sprint).toBe('Sprint 2026-W11');
    expect(report.summary.total).toBe(1);
  });

  test('reports by sprint title', async () => {
    const gql = createMockGql([MOCK_PROJECT_FULL]);

    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'Sprint 2026-W13',
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.sprint).toBe('Sprint 2026-W13');
  });

  test('returns truncated: false for small projects', async () => {
    const gql = createMockGql([MOCK_PROJECT_FULL]);
    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'current',
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.truncated).toBe(false);
    expect(report.warning).toBeUndefined();
  });

  test('returns truncated: true with warning when items hit 200 limit', async () => {
    const manyItems = Array.from({ length: 200 }, (_, i) => ({
      id: `PVTI_${i}`,
      content: {
        number: i + 1,
        title: `Item ${i + 1}`,
        state: 'OPEN',
        labels: { nodes: [] },
      },
      fieldValues: {
        nodes: [
          { field: { name: 'Status' }, name: '開発中' },
          {
            field: { name: 'Sprint' },
            title: 'Sprint 2026-W13',
            iterationId: 'iter_current',
            startDate: today,
            duration: 14,
          },
        ],
      },
    }));

    const bigProject = {
      user: {
        projectV2: {
          ...MOCK_PROJECT_FULL.user.projectV2,
          items: { nodes: manyItems },
        },
      },
    };
    const gql = createMockGql([bigProject]);
    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'current',
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.truncated).toBe(true);
    expect(report.warning).toContain('200+');
  });

  test('returns error for non-existent sprint', async () => {
    const gql = createMockGql([MOCK_PROJECT_FULL]);

    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'Sprint NonExistent',
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('not found');
  });

  test('returns error for non-existent project', async () => {
    const gql = createMockGql([{ user: { projectV2: null } }]);

    const result = await sprintReport(gql, {
      owner: 'nobody',
      projectNumber: 999,
      sprint: 'current',
    });

    expect(result.isError).toBe(true);
  });
});
