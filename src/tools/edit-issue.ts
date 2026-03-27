import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GhRunner } from '../utils/gh-cli.js';

export async function editIssue(
  gh: GhRunner,
  args: {
    repo: string;
    issueNumber: number;
    title?: string;
    body?: string;
  }
): Promise<CallToolResult> {
  if (!args.title && !args.body) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'At least one of title or body must be provided.' }],
    };
  }

  const ghArgs = ['issue', 'edit', String(args.issueNumber), '--repo', args.repo];
  if (args.title) ghArgs.push('--title', args.title);
  if (args.body) ghArgs.push('--body', args.body);

  try {
    await gh(ghArgs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to edit issue: ${message}` }],
    };
  }

  const changes = [args.title ? `title="${args.title}"` : '', args.body ? 'body updated' : '']
    .filter(Boolean)
    .join(', ');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            summary: `Edited ${args.repo}#${args.issueNumber}: ${changes}`,
            data: {
              repo: args.repo,
              issueNumber: args.issueNumber,
              title: args.title,
              body: args.body,
            },
          },
          null,
          2
        ),
      },
    ],
  };
}
