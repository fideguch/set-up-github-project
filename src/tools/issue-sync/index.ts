import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { graphql } from '@octokit/graphql';
import type { GhRunner } from '../../utils/gh-cli.js';
import { createGhRunner } from '../../utils/gh-cli.js';
import { createCommandRunner } from '../../utils/command-runner.js';
import type { CommandRunner } from '../../utils/command-runner.js';
import {
  scanZombiesSchema,
  scanTodosSchema,
  backlogReportSchema,
} from '../../schemas/issue-sync.js';
import { scanZombies } from './scan-zombies.js';
import { scanTodos } from './scan-todos.js';
import { backlogReport } from './backlog-report.js';

/**
 * Register all Issue-Sync tools on the MCP server.
 * @param gh - Optional GhRunner for gh CLI operations. Defaults to real gh CLI.
 * @param cmd - Optional CommandRunner for grep/git. Defaults to real execFile.
 */
export function registerIssueSyncTools(
  server: McpServer,
  _gql: typeof graphql,
  gh?: GhRunner,
  cmd?: CommandRunner
): void {
  const ghRunner = gh ?? createGhRunner();
  const cmdRunner = cmd ?? createCommandRunner();

  server.registerTool(
    'project_scan_zombies',
    {
      description:
        'Scan for zombie issues (implemented but still Open). Cross-references code, commits, and issue titles. Never auto-closes — returns proposals only.',
      inputSchema: scanZombiesSchema,
      annotations: { readOnlyHint: true },
    },
    async (args) => scanZombies(ghRunner, cmdRunner, args)
  );

  server.registerTool(
    'project_scan_todos',
    {
      description:
        'Scan codebase for TODO/FIXME/HACK/XXX markers, cross-reference with existing issues, and propose new issue creation. Set createIssues=true to auto-create (max 10/run).',
      inputSchema: scanTodosSchema,
    },
    async (args) => scanTodos(ghRunner, cmdRunner, args)
  );

  server.registerTool(
    'project_backlog_report',
    {
      description:
        'Generate a comprehensive backlog health report: zombie issues, untracked TODOs, stale issues, priority distribution, and a 0-100 health score.',
      inputSchema: backlogReportSchema,
      annotations: { readOnlyHint: true },
    },
    async (args) => backlogReport(ghRunner, cmdRunner, args)
  );
}
