import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Result of a shell command execution. */
export interface CommandResult {
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * Function signature for executing arbitrary shell commands.
 * Uses execFile (no shell) to prevent command injection.
 */
export type CommandRunner = (
  cmd: string,
  args: readonly string[],
  options?: { readonly cwd?: string; readonly timeout?: number }
) => Promise<CommandResult>;

/** Default timeout for command execution (30 seconds). */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Create a CommandRunner that shells out via execFile (no shell interpolation).
 * In tests, replace this with a mock that returns canned responses.
 */
export function createCommandRunner(): CommandRunner {
  return async (
    cmd: string,
    args: readonly string[],
    options?: { readonly cwd?: string; readonly timeout?: number }
  ): Promise<CommandResult> => {
    const { stdout, stderr } = await execFileAsync(cmd, [...args], {
      cwd: options?.cwd,
      timeout: options?.timeout ?? DEFAULT_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return { stdout, stderr };
  };
}
