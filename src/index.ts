#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createGraphQLClient } from './graphql/client.js';
import { createServer } from './server.js';

const gql = createGraphQLClient();
const server = createServer(gql);
const transport = new StdioServerTransport();

await server.connect(transport);
