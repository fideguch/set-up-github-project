import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { graphql } from '@octokit/graphql';
import type { GhRunner } from './utils/gh-cli.js';
import { registerTools } from './tools/index.js';

/**
 * Create and configure the My PM Tools MCP server.
 * Separating server creation from transport allows testing without stdio.
 * @param gh - Optional GhRunner for issue write operations (defaults to real gh CLI).
 */
export function createServer(gql: typeof graphql, gh?: GhRunner): McpServer {
  const server = new McpServer({
    name: 'my-pm-tools',
    version: '2.0.0',
  });

  registerTools(server, gql, gh);

  return server;
}
