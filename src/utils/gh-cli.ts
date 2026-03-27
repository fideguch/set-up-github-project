import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Result of a gh CLI command execution. */
export interface GhResult {
  readonly stdout: string;
  readonly stderr: string;
}

/** Function signature for executing gh CLI commands. */
export type GhRunner = (args: readonly string[]) => Promise<GhResult>;

/**
 * Create a GhRunner that shells out to the real `gh` CLI.
 * In tests, replace this with a mock that returns canned responses.
 */
export function createGhRunner(): GhRunner {
  return async (args: readonly string[]): Promise<GhResult> => {
    const { stdout, stderr } = await execFileAsync('gh', [...args]);
    return { stdout, stderr };
  };
}
