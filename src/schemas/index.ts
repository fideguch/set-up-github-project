import { z } from 'zod';

/** Common parameters shared across most tools. */
export const projectParams = {
  owner: z.string().describe('GitHub username or organization'),
  projectNumber: z.number().int().positive().describe('GitHub Project V2 number'),
};

/** project_add_item input schema */
export const addItemSchema = {
  ...projectParams,
  repo: z
    .string()
    .regex(/^[^/]+\/[^/]+$/, "Must be in 'owner/repo' format")
    .describe("Repository in 'owner/repo' format"),
  itemNumber: z.number().int().positive().describe('Issue or Pull Request number'),
  itemType: z.enum(['issue', 'pr']).default('issue').describe('Type of item to add'),
};

/** project_move_status input schema */
export const moveStatusSchema = {
  ...projectParams,
  itemId: z.string().describe('Project item ID (PVTI_...)'),
  status: z.string().describe("Target status name (e.g. '開発中', 'Done')"),
};

/** project_set_priority input schema */
export const setPrioritySchema = {
  ...projectParams,
  itemId: z.string().describe('Project item ID (PVTI_...)'),
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']).describe('Priority level'),
};

/** project_list_items input schema */
export const listItemsSchema = {
  ...projectParams,
  statusFilter: z.string().optional().describe('Filter by status name (optional)'),
  priorityFilter: z.string().optional().describe('Filter by priority (optional)'),
};

/** project_list_fields input schema */
export const listFieldsSchema = {
  ...projectParams,
};

/** project_sprint_report input schema */
export const sprintReportSchema = {
  ...projectParams,
  sprint: z
    .string()
    .default('current')
    .describe("Sprint selector: 'current', 'previous', or a sprint title"),
};
