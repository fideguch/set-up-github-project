import type { graphql } from '@octokit/graphql';

interface CallRecord {
  readonly query: string;
  readonly variables: Record<string, unknown>;
}

/**
 * Create a mock GraphQL client that matches queries by substring and returns
 * the corresponding response. Tracks all calls for assertion.
 */
export function createCallMatcherGql(
  matchers: readonly { readonly match: string; readonly response: unknown }[]
): { gql: typeof graphql; calls: CallRecord[] } {
  const calls: CallRecord[] = [];

  const gql = (async (query: string, variables?: Record<string, unknown>) => {
    calls.push({ query: String(query), variables: variables ?? {} });
    const matcher = matchers.find((m) => String(query).includes(m.match));
    if (!matcher) {
      throw new Error(`No mock matched for query containing: ${String(query).slice(0, 80)}`);
    }
    if (matcher.response instanceof Error) throw matcher.response;
    return matcher.response;
  }) as unknown as typeof graphql;

  return { gql, calls };
}
