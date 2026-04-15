import { test, expect } from '@playwright/test';
import { scanTodos } from '../../../../src/tools/issue-sync/scan-todos.js';
import type { GhRunner } from '../../../../src/utils/gh-cli.js';
import type { CommandRunner } from '../../../../src/utils/command-runner.js';

const GREP_OUTPUT = [
  'src/lib/payments/stripe.ts:124:  // HACK: Webhook idempotency guard missing',
  'src/components/Header.tsx:45:  // TODO: Add mobile responsive menu',
  'src/utils/cache.ts:89:  // FIXME: Cache invalidation race condition',
  'src/api/search.ts:201:  // XXX: SQL injection risk in raw query',
].join('\n');

const EXISTING_ISSUES = JSON.stringify([
  { number: 34, title: 'Add mobile responsive menu to header', body: 'Mobile menu needed' },
  { number: 55, title: 'Improve search performance', body: null },
]);

function createMockGh(
  issueListOutput = EXISTING_ISSUES,
  createdUrl = 'https://github.com/fideguch/my-app/issues/100'
): { runner: GhRunner; calls: string[][] } {
  const calls: string[][] = [];
  let issueCounter = 100;
  const runner: GhRunner = async (args) => {
    calls.push([...args]);
    if (args[0] === 'issue' && args[1] === 'list') {
      return { stdout: issueListOutput, stderr: '' };
    }
    if (args[0] === 'issue' && args[1] === 'create') {
      const url = createdUrl.replace('/100', `/${issueCounter}`);
      issueCounter++;
      return { stdout: url, stderr: '' };
    }
    return { stdout: '', stderr: '' };
  };
  return { runner, calls };
}

function createMockCmd(grepOutput = GREP_OUTPUT): {
  runner: CommandRunner;
  calls: { cmd: string; args: string[] }[];
} {
  const calls: { cmd: string; args: string[] }[] = [];
  const runner: CommandRunner = async (cmd, args) => {
    calls.push({ cmd, args: [...args] });
    if (cmd === 'grep') {
      if (!grepOutput) throw new Error('exit code 1');
      return { stdout: grepOutput, stderr: '' };
    }
    return { stdout: '', stderr: '' };
  };
  return { runner, calls };
}

test.describe('project_scan_todos tool', () => {
  test('finds TODO markers in grep output', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd();

    const result = await scanTodos(gh, cmd, { repo: 'fideguch/my-app' });
    expect(result.isError).toBeUndefined();

    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.totalTodos).toBe(4);
    expect(report.entries.some((e: { marker: string }) => e.marker === 'TODO')).toBe(true);
  });

  test('finds FIXME, HACK, XXX markers', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd();

    const result = await scanTodos(gh, cmd, { repo: 'fideguch/my-app' });
    const report = JSON.parse((result.content[0] as { text: string }).text);

    const markers = report.entries.map((e: { marker: string }) => e.marker);
    expect(markers).toContain('HACK');
    expect(markers).toContain('FIXME');
    expect(markers).toContain('XXX');
  });

  test('cross-references with existing issues (match found)', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd();

    const result = await scanTodos(gh, cmd, { repo: 'fideguch/my-app' });
    const report = JSON.parse((result.content[0] as { text: string }).text);

    // The TODO about mobile responsive menu should match issue #34
    const mobileEntry = report.entries.find((e: { text: string }) => e.text.includes('mobile'));
    expect(mobileEntry?.matchingIssue).toBe(34);
    expect(report.alreadyTracked).toBeGreaterThan(0);
  });

  test('detects untracked TODOs', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd();

    const result = await scanTodos(gh, cmd, { repo: 'fideguch/my-app' });
    const report = JSON.parse((result.content[0] as { text: string }).text);

    expect(report.untracked).toBeGreaterThan(0);
    const untrackedEntries = report.entries.filter(
      (e: { matchingIssue: number | null }) => e.matchingIssue === null
    );
    expect(untrackedEntries.length).toBe(report.untracked);
  });

  test('assigns priority based on marker type', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd();

    const result = await scanTodos(gh, cmd, { repo: 'fideguch/my-app' });
    const report = JSON.parse((result.content[0] as { text: string }).text);

    const fixmeEntry = report.entries.find((e: { marker: string }) => e.marker === 'FIXME');
    expect(fixmeEntry?.suggestedPriority).toBe('P1');

    const hackEntry = report.entries.find((e: { marker: string }) => e.marker === 'HACK');
    expect(hackEntry?.suggestedPriority).toBe('P2');

    const xxxEntry = report.entries.find((e: { marker: string }) => e.marker === 'XXX');
    expect(xxxEntry?.suggestedPriority).toBe('P0');

    const todoEntry = report.entries.find((e: { marker: string }) => e.marker === 'TODO');
    expect(todoEntry?.suggestedPriority).toBe('P3');
  });

  test('empty grep result returns empty report', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd('');

    const result = await scanTodos(gh, cmd, { repo: 'fideguch/my-app' });
    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.totalTodos).toBe(0);
    expect(report.entries).toHaveLength(0);
  });

  test('createIssues=false does not call create', async () => {
    const { runner: gh, calls } = createMockGh();
    const { runner: cmd } = createMockCmd();

    await scanTodos(gh, cmd, {
      repo: 'fideguch/my-app',
      createIssues: false,
    });

    const createCalls = calls.filter((c) => c[0] === 'issue' && c[1] === 'create');
    expect(createCalls).toHaveLength(0);
  });

  test('createIssues=true calls createIssue for untracked items', async () => {
    const { runner: gh, calls } = createMockGh();
    const { runner: cmd } = createMockCmd();

    const result = await scanTodos(gh, cmd, {
      repo: 'fideguch/my-app',
      createIssues: true,
    });

    const report = JSON.parse((result.content[0] as { text: string }).text);
    const createCalls = calls.filter((c) => c[0] === 'issue' && c[1] === 'create');
    expect(createCalls.length).toBeGreaterThan(0);
    expect(report.issuesCreated.length).toBe(createCalls.length);
  });

  test('generates proposed titles with marker prefix', async () => {
    const { runner: gh } = createMockGh();
    const { runner: cmd } = createMockCmd();

    const result = await scanTodos(gh, cmd, { repo: 'fideguch/my-app' });
    const report = JSON.parse((result.content[0] as { text: string }).text);

    for (const entry of report.entries) {
      expect(entry.proposedTitle).toMatch(/^\[(?:TODO|FIXME|HACK|XXX)\] /);
    }
  });

  test('handles grep failure gracefully', async () => {
    const { runner: gh } = createMockGh();
    const runner: CommandRunner = async () => {
      throw new Error('grep not found');
    };

    const result = await scanTodos(gh, runner, { repo: 'fideguch/my-app' });
    const report = JSON.parse((result.content[0] as { text: string }).text);
    expect(report.totalTodos).toBe(0);
  });
});
