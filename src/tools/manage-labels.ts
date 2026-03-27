import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GhRunner } from '../utils/gh-cli.js';

export async function manageLabels(
  gh: GhRunner,
  args: {
    repo: string;
    issueNumber: number;
    addLabels?: string[];
    removeLabels?: string[];
  }
): Promise<CallToolResult> {
  const hasAdd = args.addLabels && args.addLabels.length > 0;
  const hasRemove = args.removeLabels && args.removeLabels.length > 0;

  if (!hasAdd && !hasRemove) {
    return {
      isError: true,
      content: [
        { type: 'text', text: 'At least one of addLabels or removeLabels must be provided.' },
      ],
    };
  }

  const ghArgs = ['issue', 'edit', String(args.issueNumber), '--repo', args.repo];
  if (hasAdd) ghArgs.push('--add-label', args.addLabels!.join(','));
  if (hasRemove) ghArgs.push('--remove-label', args.removeLabels!.join(','));

  try {
    await gh(ghArgs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to manage labels: ${message}` }],
    };
  }

  const actions = [
    hasAdd ? `added: ${args.addLabels!.join(', ')}` : '',
    hasRemove ? `removed: ${args.removeLabels!.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            summary: `Labels on ${args.repo}#${args.issueNumber}: ${actions}`,
            data: {
              repo: args.repo,
              issueNumber: args.issueNumber,
              addedLabels: args.addLabels ?? [],
              removedLabels: args.removeLabels ?? [],
            },
          },
          null,
          2
        ),
      },
    ],
  };
}
