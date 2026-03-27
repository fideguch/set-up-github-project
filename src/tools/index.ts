import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { graphql } from '@octokit/graphql';
import {
  addItemSchema,
  moveStatusSchema,
  setPrioritySchema,
  listItemsSchema,
  listFieldsSchema,
  sprintReportSchema,
} from '../schemas/index.js';
import { listFields } from './list-fields.js';
import { listItems } from './list-items.js';
import { addItem } from './add-item.js';
import { moveStatus } from './move-status.js';
import { setPriority } from './set-priority.js';
import { sprintReport } from './sprint-report.js';

/**
 * Register all project management tools on the MCP server.
 */
export function registerTools(server: McpServer, gql: typeof graphql): void {
  server.registerTool(
    'project_list_fields',
    {
      description: 'List all fields and their options in a GitHub Project V2',
      inputSchema: listFieldsSchema,
    },
    async (args) => listFields(gql, args)
  );

  server.registerTool(
    'project_list_items',
    {
      description: 'List all items in a GitHub Project V2 with status and metadata',
      inputSchema: listItemsSchema,
    },
    async (args) => listItems(gql, args)
  );

  server.registerTool(
    'project_add_item',
    {
      description: 'Add an Issue or Pull Request to a GitHub Project V2',
      inputSchema: addItemSchema,
      annotations: { destructiveHint: false },
    },
    async (args) => addItem(gql, args)
  );

  server.registerTool(
    'project_move_status',
    {
      description: "Change the status of a project item (e.g. 'Backlog', '開発中', 'Done')",
      inputSchema: moveStatusSchema,
      annotations: { destructiveHint: false },
    },
    async (args) => moveStatus(gql, args)
  );

  server.registerTool(
    'project_set_priority',
    {
      description: 'Set the priority of a project item (P0-P4)',
      inputSchema: setPrioritySchema,
      annotations: { destructiveHint: false },
    },
    async (args) => setPriority(gql, args)
  );

  server.registerTool(
    'project_sprint_report',
    {
      description: 'Generate a sprint report with velocity, completion rate, and blocker stats',
      inputSchema: sprintReportSchema,
      annotations: { readOnlyHint: true },
    },
    async (args) => sprintReport(gql, args)
  );
}
