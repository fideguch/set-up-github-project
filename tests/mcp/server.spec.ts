import { test, expect } from '@playwright/test';
import { createServer } from '../../src/server.js';
import type { graphql } from '@octokit/graphql';

// Mock GraphQL client (never called in these tests)
const mockGql = (() => {
  throw new Error('GraphQL should not be called in server tests');
}) as unknown as typeof graphql;

test.describe('MCP Server', () => {
  test('createServer returns an McpServer instance', () => {
    const server = createServer(mockGql);
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });

  test('server has tools capability', () => {
    const server = createServer(mockGql);
    // Access private getCapabilities via type assertion to verify tools are registered
    const capabilities = (
      server.server as unknown as { getCapabilities: () => Record<string, unknown> }
    ).getCapabilities();
    expect(capabilities.tools).toBeDefined();
  });

  test('server can be closed without error', async () => {
    const server = createServer(mockGql);
    await expect(server.close()).resolves.not.toThrow();
  });
});
