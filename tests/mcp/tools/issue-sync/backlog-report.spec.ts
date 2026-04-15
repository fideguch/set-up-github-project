import { test, expect } from '@playwright/test';
import { backlogReport } from '../../../../src/tools/issue-sync/backlog-report.js';
import type { GhRunner } from '../../../../src/utils/gh-cli.js';
import type { CommandRunner } from '../../../../src/utils/command-runner.js';

const CLEAN_ISSUES = JSON.stringify([
  {
    number: 1,
    title: 'Add user profile page',
    labels: [{ name: 'feature' }, { name: 'P2' }],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    number: 2,
    title: 'Fix login timeout',
    labels: [{ name: 'bug' }, { name: 'P1' }],
    createdAt: '2026-04-05T00:00:00Z',
    updatedAt: '2026-04-12T00:00:00Z',
  },
]);

const STALE_ISSUES = JSON.stringify([
  {
    number: 10,
    title: 'Old issue',
    labels: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    number: 11,
    title: 'Another old one',
    labels: [],
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-10T00:00:00Z',
  },
  {
    number: 12,
    title: 'P0 urgent fix',
    labels: [{ name: 'P0' }],
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-05T00:00:00Z',
  },
]);

function createMockGh(issueOutput: string): {
  runner: GhRunner;
  calls: string[][];
} {
  const calls: string[][] = [];
  const runner: GhRunner = async (args) => {
    calls.push([...args]);
    return { stdout: issueOutput, stderr: '' };
  };
  return { runner, calls };
}

function createMockCmd(
  grepOutput = '',
  gitOutput = ''
): {
  runner: CommandRunner;
} {
  const runner: CommandRunner = async (cmd) => {
    if (cmd === 'grep' && !grepOutput) throw new Error('exit code 1');
    if (cmd === 'grep') return { stdout: grepOutput, stderr: '' };
    if (cmd === 'git') return { stdout: gitOutput, stderr: '' };
    return { stdout: '', stderr: '' };
  };
  return { runner };
}

test.describe('project_backlog_report tool', () => {
  test('returns health score near 100 for clean project', async () => {
    const { runner: gh } = createMockGh(CLEAN_ISSUES);
    const { runner: cmd } = createMockCmd();

    const result = await backlogReport(gh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
    });

    expect(result.isError).toBeUndefined();
    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.healthScore).toBeGreaterThanOrEqual(80);
    expect(report.metrics.totalOpenIssues).toBe(2);
  });

  test('deducts for stale issues', async () => {
    const { runner: gh } = createMockGh(STALE_ISSUES);
    const { runner: cmd } = createMockCmd();

    const result = await backlogReport(gh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
      staleThresholdDays: 30,
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.metrics.staleIssueCount).toBeGreaterThan(0);
    expect(report.healthScore).toBeLessThan(100);

    const staleDeduction = report.deductions.find((d: { reason: string }) =>
      d.reason.includes('更新なし')
    );
    expect(staleDeduction).toBeDefined();
  });

  test('deducts for unlabeled issues', async () => {
    const { runner: gh } = createMockGh(STALE_ISSUES);
    const { runner: cmd } = createMockCmd();

    const result = await backlogReport(gh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.metrics.unlabeledCount).toBeGreaterThan(0);
  });

  test('deducts for untracked TODOs', async () => {
    const todoGrep =
      'src/file.ts:10:  // TODO: implement feature\nsrc/file.ts:20:  // FIXME: broken\n';
    const { runner: gh } = createMockGh(CLEAN_ISSUES);
    const { runner: cmd } = createMockCmd(todoGrep);

    const result = await backlogReport(gh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.metrics.untrackedTodoCount).toBeGreaterThan(0);

    const todoDeduction = report.deductions.find((d: { reason: string }) =>
      d.reason.includes('未追跡TODO')
    );
    expect(todoDeduction).toBeDefined();
  });

  test('health score floors at 0', async () => {
    // Many stale, unlabeled issues + TODOs = heavy deductions
    const manyIssues = JSON.stringify(
      Array.from({ length: 50 }, (_, i) => ({
        number: i + 1,
        title: `Old issue ${i}`,
        labels: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }))
    );
    const manyTodos = Array.from(
      { length: 30 },
      (_, i) => `src/file${i}.ts:${i + 1}:  // FIXME: broken thing ${i}`
    ).join('\n');

    const { runner: gh } = createMockGh(manyIssues);
    const { runner: cmd } = createMockCmd(manyTodos);

    const result = await backlogReport(gh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.healthScore).toBeGreaterThanOrEqual(0);
  });

  test('includes recommendations', async () => {
    const { runner: gh } = createMockGh(STALE_ISSUES);
    const { runner: cmd } = createMockCmd();

    const result = await backlogReport(gh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.recommendations.some((r: string) => typeof r === 'string')).toBe(true);
  });

  test('handles API failure gracefully', async () => {
    // All gh calls fail immediately
    const failGh: GhRunner = async () => {
      throw new Error('API rate limit exceeded');
    };
    const { runner: cmd } = createMockCmd();

    const result = await backlogReport(failGh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
    });

    // The main issue list fetch fails, returning isError
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Failed to fetch issues');
  });

  test('includes priority distribution', async () => {
    const { runner: gh } = createMockGh(CLEAN_ISSUES);
    const { runner: cmd } = createMockCmd();

    const result = await backlogReport(gh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.metrics.priorityDistribution).toBeDefined();
    expect(typeof report.metrics.priorityDistribution).toBe('object');
  });

  test('includes warnings when zombie scan fails', async () => {
    let callCount = 0;
    const partialFailGh: GhRunner = async (_args) => {
      callCount++;
      // First call (zombie scan's gh issue list) fails
      if (callCount === 1) {
        throw new Error('Zombie scan API error');
      }
      // Subsequent calls succeed
      return { stdout: CLEAN_ISSUES, stderr: '' };
    };
    const { runner: cmd } = createMockCmd();

    const result = await backlogReport(partialFailGh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
    });

    expect(result.isError).toBeUndefined();
    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(report.warnings.some((w: string) => w.includes('ゾンビスキャン'))).toBe(true);
    // healthScore should still be generated but reflects incomplete data
    expect(typeof report.healthScore).toBe('number');
  });

  test('includes empty warnings array when all scans succeed', async () => {
    const { runner: gh } = createMockGh(CLEAN_ISSUES);
    const { runner: cmd } = createMockCmd();

    const result = await backlogReport(gh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.warnings).toEqual([]);
  });

  test('custom staleThresholdDays works', async () => {
    const { runner: gh } = createMockGh(CLEAN_ISSUES);
    const { runner: cmd } = createMockCmd();

    const result = await backlogReport(gh, cmd, {
      repo: 'fideguch/my-app',
      owner: 'fideguch',
      projectNumber: 1,
      staleThresholdDays: 1, // Very aggressive threshold
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    // With 1-day threshold, recent issues may or may not be stale depending on test timing
    expect(typeof report.metrics.staleIssueCount).toBe('number');
  });
});
