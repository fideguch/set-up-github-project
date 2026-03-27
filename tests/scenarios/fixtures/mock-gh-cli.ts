import type { GhRunner, GhResult } from '../../../src/utils/gh-cli.js';

interface GhCallRecord {
  readonly args: readonly string[];
}

/**
 * Create a mock GhRunner that records calls and returns canned responses.
 * Optionally fails for specific subcommands.
 */
export function createMockGhRunner(options?: {
  readonly failOn?: readonly string[];
  readonly stdout?: string;
}): { gh: GhRunner; calls: GhCallRecord[] } {
  const calls: GhCallRecord[] = [];

  const gh: GhRunner = async (args: readonly string[]): Promise<GhResult> => {
    calls.push({ args });
    const failOn = options?.failOn ?? [];
    if (failOn.some((cmd) => args.includes(cmd))) {
      throw new Error(`Mock gh failure on: ${args.join(' ')}`);
    }
    return { stdout: options?.stdout ?? '', stderr: '' };
  };

  return { gh, calls };
}
