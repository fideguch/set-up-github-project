import { test, expect } from '@playwright/test';
import { scanZombies } from '../../../../src/tools/issue-sync/scan-zombies.js';
import type { GhRunner } from '../../../../src/utils/gh-cli.js';
import type { CommandRunner } from '../../../../src/utils/command-runner.js';

const OPEN_ISSUES = JSON.stringify([
  {
    number: 42,
    title: 'Add login form validation',
    body: 'Validate email and password fields on login page',
    labels: [{ name: 'feature' }],
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    number: 67,
    title: 'Search results sorting',
    body: 'Allow sorting search results by date and relevance',
    labels: [{ name: 'feature' }],
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    number: 99,
    title: 'Fix dashboard layout',
    body: null,
    labels: [],
    createdAt: '2025-06-01T00:00:00Z',
  },
]);

function createMockGh(
  issues = OPEN_ISSUES,
  shouldFail = false
): {
  runner: GhRunner;
  calls: string[][];
} {
  const calls: string[][] = [];
  const runner: GhRunner = async (args) => {
    calls.push([...args]);
    if (shouldFail) throw new Error('gh failed');
    return { stdout: issues, stderr: '' };
  };
  return { runner, calls };
}

function createMockCmd(responses: Record<string, string> = {}): {
  runner: CommandRunner;
  calls: { cmd: string; args: string[] }[];
} {
  const calls: { cmd: string; args: string[] }[] = [];
  const runner: CommandRunner = async (cmd, args) => {
    calls.push({ cmd, args: [...args] });
    // Match by command + first significant arg
    const key = cmd === 'grep' ? 'grep' : cmd === 'git' ? 'git' : cmd;
    const response = responses[key] ?? '';
    if (!response && cmd === 'grep') {
      throw new Error('exit code 1'); // grep no matches
    }
    return { stdout: response, stderr: '' };
  };
  return { runner, calls };
}

test.describe('project_scan_zombies tool', () => {
  test('returns empty report when no open issues', async () => {
    const { runner: gh } = createMockGh('[]');
    const { runner: cmd } = createMockCmd();

    const result = await scanZombies(gh, cmd, { repo: 'fideguch/my-app' });
    expect(result.isError).toBeUndefined();

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.totalOpenIssues).toBe(0);
    expect(report.candidates).toHaveLength(0);
  });

  test('classifies issue as implemented when commit refs with closes found', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd({
      grep: 'src/auth/LoginForm.tsx:25:  const validateEmail = (email: string) => {\n',
      git: 'a3f2c1d closes #42: add validation to login form\n',
    });

    const result = await scanZombies(gh, cmd, {
      repo: 'fideguch/my-app',
      basePath: process.cwd(),
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    const issue42 = report.candidates.find((c: { issueNumber: number }) => c.issueNumber === 42);
    expect(issue42).toBeDefined();
    expect(issue42.classification).toBe('implemented');
    expect(issue42.confidence).toBeGreaterThanOrEqual(0.8);
    expect(issue42.evidence.commitRefs.length).toBeGreaterThan(0);
  });

  test('classifies issue as partial when only code matches found', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd({
      grep: 'src/search/SearchResults.tsx:45:  const sortResults = () => {\nsrc/search/SearchResults.tsx:67:  return sorted;\n',
    });

    const result = await scanZombies(gh, cmd, {
      repo: 'fideguch/my-app',
      basePath: process.cwd(),
      confidenceThreshold: 0.1,
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    const candidates = report.candidates.filter(
      (c: { classification: string }) => c.classification !== 'no_code_found'
    );
    expect(candidates.length).toBeGreaterThan(0);
  });

  test('classifies issue as no_code_found when no matches', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd();

    const result = await scanZombies(gh, cmd, {
      repo: 'fideguch/my-app',
      basePath: process.cwd(),
      confidenceThreshold: 0,
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    const noCode = report.candidates.filter(
      (c: { classification: string }) => c.classification === 'no_code_found'
    );
    expect(noCode.length).toBeGreaterThan(0);
  });

  test('respects confidenceThreshold filter', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd({
      grep: 'src/file.ts:1:some match\n',
    });

    const highThreshold = await scanZombies(gh, cmd, {
      repo: 'fideguch/my-app',
      confidenceThreshold: 0.9,
    });
    const lowThreshold = await scanZombies(gh, cmd, {
      repo: 'fideguch/my-app',
      confidenceThreshold: 0.1,
    });

    const highReport = JSON.parse((highThreshold.content[0] as { text: string }).text);
    const lowReport = JSON.parse((lowThreshold.content[0] as { text: string }).text);
    expect(lowReport.candidates.length).toBeGreaterThanOrEqual(highReport.candidates.length);
  });

  test('handles gh issue list failure gracefully', async () => {
    const { runner: gh } = createMockGh('', true);
    const { runner: cmd } = createMockCmd();

    const result = await scanZombies(gh, cmd, { repo: 'fideguch/my-app' });
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Failed to fetch issues');
  });

  test('returns correct summary counts', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd({
      grep: 'src/auth/LoginForm.tsx:25:  validate\n',
      git: 'a3f2c1d closes #42: add validation\n',
    });

    const result = await scanZombies(gh, cmd, {
      repo: 'fideguch/my-app',
      confidenceThreshold: 0,
    });
    const report = JSON.parse((result.content[0] as { text: string }).text);

    expect(report.summary).toBeDefined();
    expect(typeof report.summary.implemented).toBe('number');
    expect(typeof report.summary.partial).toBe('number');
    expect(typeof report.summary.unconfirmed).toBe('number');
    expect(typeof report.summary.noCodeFound).toBe('number');

    const total =
      report.summary.implemented +
      report.summary.partial +
      report.summary.unconfirmed +
      report.summary.noCodeFound;
    expect(total).toBe(report.candidates.length);
  });

  test('caps at maxIssues', async () => {
    const { runner: gh, calls } = createMockGh();
    const { runner: cmd } = createMockCmd();

    await scanZombies(gh, cmd, {
      repo: 'fideguch/my-app',
      maxIssues: 5,
    });

    expect(calls[0]).toContain('--limit');
    expect(calls[0]).toContain('5');
  });

  test('includes stale days in report', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd({
      grep: 'src/file.ts:1:match\n',
    });

    const result = await scanZombies(gh, cmd, {
      repo: 'fideguch/my-app',
      confidenceThreshold: 0,
    });
    const report = JSON.parse((result.content[0] as { text: string }).text);

    for (const candidate of report.candidates) {
      expect(typeof candidate.staleDays).toBe('number');
      expect(candidate.staleDays).toBeGreaterThanOrEqual(0);
    }
  });

  test('never calls issue close or state change', async () => {
    const { runner: gh, calls } = createMockGh();
    const { runner: cmd } = createMockCmd({
      grep: 'src/auth/LoginForm.tsx:25:  validate\n',
      git: 'a3f2c1d closes #42: add validation\n',
    });

    await scanZombies(gh, cmd, { repo: 'fideguch/my-app' });

    // Verify no close/reopen commands were issued
    for (const call of calls) {
      expect(call).not.toContain('close');
      expect(call).not.toContain('reopen');
    }
  });
});
