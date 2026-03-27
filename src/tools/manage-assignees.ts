import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GhRunner } from '../utils/gh-cli.js';

export async function manageAssignees(
  gh: GhRunner,
  args: {
    repo: string;
    issueNumber: number;
    addAssignees?: string[];
    removeAssignees?: string[];
  }
): Promise<CallToolResult> {
  const hasAdd = args.addAssignees && args.addAssignees.length > 0;
  const hasRemove = args.removeAssignees && args.removeAssignees.length > 0;

  if (!hasAdd && !hasRemove) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'At least one of addAssignees or removeAssignees must be provided.',
        },
      ],
    };
  }

  const ghArgs = ['issue', 'edit', String(args.issueNumber), '--repo', args.repo];
  if (hasAdd) ghArgs.push('--add-assignee', args.addAssignees!.join(','));
  if (hasRemove) ghArgs.push('--remove-assignee', args.removeAssignees!.join(','));

  try {
    await gh(ghArgs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to manage assignees: ${message}` }],
    };
  }

  const actions = [
    hasAdd ? `assigned: ${args.addAssignees!.join(', ')}` : '',
    hasRemove ? `unassigned: ${args.removeAssignees!.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            summary: `Assignees on ${args.repo}#${args.issueNumber}: ${actions}`,
            data: {
              repo: args.repo,
              issueNumber: args.issueNumber,
              addedAssignees: args.addAssignees ?? [],
              removedAssignees: args.removeAssignees ?? [],
            },
          },
          null,
          2
        ),
      },
    ],
  };
}
