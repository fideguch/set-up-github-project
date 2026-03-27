import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GhRunner } from '../utils/gh-cli.js';

export async function setIssueState(
  gh: GhRunner,
  args: {
    repo: string;
    issueNumber: number;
    state: 'open' | 'closed';
    reason?: 'completed' | 'not_planned';
  }
): Promise<CallToolResult> {
  const ghArgs: string[] = [];

  if (args.state === 'closed') {
    ghArgs.push('issue', 'close', String(args.issueNumber), '--repo', args.repo);
    if (args.reason === 'not_planned') {
      ghArgs.push('--reason', 'not planned');
    }
  } else {
    ghArgs.push('issue', 'reopen', String(args.issueNumber), '--repo', args.repo);
  }

  try {
    await gh(ghArgs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Failed to ${args.state === 'closed' ? 'close' : 'reopen'} issue: ${message}`,
        },
      ],
    };
  }

  const action = args.state === 'closed' ? 'Closed' : 'Reopened';
  const reasonSuffix = args.reason ? ` (${args.reason})` : '';

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            summary: `${action} ${args.repo}#${args.issueNumber}${reasonSuffix}`,
            data: {
              repo: args.repo,
              issueNumber: args.issueNumber,
              state: args.state,
              reason: args.reason ?? null,
            },
          },
          null,
          2
        ),
      },
    ],
  };
}
