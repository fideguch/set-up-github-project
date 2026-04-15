import { z } from 'zod';
import { repoParam, projectParams } from './index.js';

/** Default exclude paths for code scanning. */
const DEFAULT_EXCLUDES = ['node_modules', 'dist', '.git', 'vendor', '.next', 'build', 'coverage'];

/** Default TODO markers. */
const DEFAULT_MARKERS = ['TODO', 'FIXME', 'HACK', 'XXX'];

/** project_scan_zombies input schema */
export const scanZombiesSchema = {
  ...repoParam,
  basePath: z
    .string()
    .optional()
    .describe('Local codebase path (defaults to current working directory)'),
  excludePaths: z
    .array(z.string())
    .default(DEFAULT_EXCLUDES)
    .describe('Directories to exclude from code search'),
  maxIssues: z
    .number()
    .int()
    .positive()
    .default(100)
    .describe('Maximum number of open issues to scan'),
  confidenceThreshold: z
    .number()
    .min(0)
    .max(1)
    .default(0.4)
    .describe('Minimum confidence score to include in report (0.0-1.0)'),
};

/** project_scan_todos input schema */
export const scanTodosSchema = {
  ...repoParam,
  basePath: z
    .string()
    .optional()
    .describe('Local codebase path (defaults to current working directory)'),
  scanPaths: z
    .array(z.string())
    .default(['.'])
    .describe('Paths within basePath to scan (defaults to ["."])'),
  markers: z.array(z.string()).default(DEFAULT_MARKERS).describe('Comment markers to search for'),
  excludePaths: z
    .array(z.string())
    .default(DEFAULT_EXCLUDES)
    .describe('Directories to exclude from scan'),
  createIssues: z
    .boolean()
    .default(false)
    .describe('If true, create GitHub issues for untracked TODOs (max 10 per run)'),
};

/** project_backlog_report input schema */
export const backlogReportSchema = {
  ...repoParam,
  ...projectParams,
  basePath: z
    .string()
    .optional()
    .describe('Local codebase path (defaults to current working directory)'),
  staleThresholdDays: z
    .number()
    .int()
    .positive()
    .default(30)
    .describe('Days without update to consider an issue stale'),
};
