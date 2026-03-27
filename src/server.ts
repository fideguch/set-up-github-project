import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { graphql } from '@octokit/graphql';
import { registerTools } from './tools/index.js';

/**
 * Create and configure the GitHub Project Manager MCP server.
 * Separating server creation from transport allows testing without stdio.
 */
export function createServer(gql: typeof graphql): McpServer {
  const server = new McpServer({
    name: 'github-project-manager',
    version: '1.0.0',
  });

  registerTools(server, gql);

  return server;
}
