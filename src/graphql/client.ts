import { graphql } from '@octokit/graphql';

/**
 * Create an authenticated GraphQL client for GitHub API.
 * Reads GITHUB_TOKEN from environment.
 */
export function createGraphQLClient(): typeof graphql {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN environment variable is required. ' +
        "Use a Classic PAT with 'project', 'repo', and 'read:org' scopes."
    );
  }

  return graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });
}
