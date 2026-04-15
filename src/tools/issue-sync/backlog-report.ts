import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GhRunner } from '../../utils/gh-cli.js';
import type { CommandRunner } from '../../utils/command-runner.js';
import type {
  BacklogHealthReport,
  BacklogMetrics,
  HealthDeduction,
} from '../../types/issue-sync.js';
import { scanZombies } from './scan-zombies.js';
import { scanTodos } from './scan-todos.js';
import { calculateStaleDays } from '../../utils/code-scanner.js';
import { validateBasePath } from '../../utils/path-validator.js';

interface IssueListItem {
  readonly number: number;
  readonly title: string;
  readonly labels: readonly { readonly name: string }[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Generate a comprehensive backlog health report.
 * Combines zombie scan + TODO scan + project statistics.
 * Read-only — never mutates issues.
 */
export async function backlogReport(
  gh: GhRunner,
  cmd: CommandRunner,
  args: {
    repo: string;
    owner: string;
    projectNumber: number;
    basePath?: string;
    staleThresholdDays?: number;
  }
): Promise<CallToolResult> {
  const staleThreshold = args.staleThresholdDays ?? 30;

  // Validate basePath early (sub-tools validate too, but fail fast here)
  const basePathResult = validateBasePath(args.basePath);
  if (!basePathResult.valid) {
    return {
      isError: true,
      content: [{ type: 'text', text: basePathResult.error }],
    };
  }

  const warnings: string[] = [];

  // Step 1: Run zombie scan
  const zombieResult = await scanZombies(gh, cmd, {
    repo: args.repo,
    basePath: args.basePath,
    confidenceThreshold: 0.4,
  });

  let zombieCount = 0;
  if (zombieResult.isError) {
    warnings.push('ゾンビスキャンが失敗しました。ゾンビIssue数は0として算出されています。');
  } else {
    const first = zombieResult.content[0];
    if (first && 'text' in first) {
      const zombieData = JSON.parse(first.text);
      zombieCount = zombieData.summary?.implemented ?? 0;
    }
  }

  // Step 2: Run TODO scan (read-only)
  const todoResult = await scanTodos(gh, cmd, {
    repo: args.repo,
    basePath: args.basePath,
    createIssues: false,
  });

  let todoCount = 0;
  let untrackedTodoCount = 0;
  if (todoResult.isError) {
    warnings.push('TODOスキャンが失敗しました。TODO数は0として算出されています。');
  } else {
    const first = todoResult.content[0];
    if (first && 'text' in first) {
      const todoData = JSON.parse(first.text);
      todoCount = todoData.totalTodos ?? 0;
      untrackedTodoCount = todoData.untracked ?? 0;
    }
  }

  // Step 3: Fetch all open issues for statistics
  let allIssues: readonly IssueListItem[] = [];
  try {
    const result = await gh([
      'issue',
      'list',
      '--repo',
      args.repo,
      '--state',
      'open',
      '--json',
      'number,title,labels,createdAt,updatedAt',
      '--limit',
      '500',
    ]);
    allIssues = JSON.parse(result.stdout) as readonly IssueListItem[];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to fetch issues: ${message}` }],
    };
  }

  // Step 4: Calculate metrics
  const priorityDist: Record<string, number> = {};
  let staleCount = 0;
  let unlabeledCount = 0;
  let totalAgeDays = 0;

  for (const issue of allIssues) {
    // Priority from labels (P0-P4 pattern)
    const priorityLabel = issue.labels.find((l) => /^P[0-4]/.test(l.name));
    const pKey = priorityLabel ? priorityLabel.name.split(' ')[0]! : 'Unset';
    priorityDist[pKey] = (priorityDist[pKey] ?? 0) + 1;

    // Stale check
    const daysSinceUpdate = calculateStaleDays(issue.updatedAt);
    if (daysSinceUpdate >= staleThreshold) {
      staleCount++;
    }

    // Unlabeled check
    if (issue.labels.length === 0) {
      unlabeledCount++;
    }

    // Age for average
    totalAgeDays += calculateStaleDays(issue.createdAt);
  }

  const totalOpen = allIssues.length;
  const avgAgeDays = totalOpen > 0 ? Math.round(totalAgeDays / totalOpen) : 0;

  const metrics: BacklogMetrics = {
    totalOpenIssues: totalOpen,
    zombieCount,
    todoCount,
    untrackedTodoCount,
    staleIssueCount: staleCount,
    priorityDistribution: priorityDist,
    avgAgeDays,
    unlabeledCount,
  };

  // Step 5: Calculate health score (100 → deductions)
  const deductions: HealthDeduction[] = [];

  if (zombieCount > 0) {
    const pts = zombieCount * 2;
    deductions.push({ reason: `ゾンビIssue候補 (${zombieCount}件 × 2pt)`, points: pts });
  }

  if (untrackedTodoCount > 0) {
    const pts = Math.min(untrackedTodoCount, 20); // cap at 20
    deductions.push({ reason: `未追跡TODO (${untrackedTodoCount}件 × 1pt, 上限20)`, points: pts });
  }

  if (staleCount > 0) {
    const pts = Math.min(staleCount, 20); // cap at 20
    deductions.push({
      reason: `${staleThreshold}日以上更新なし (${staleCount}件 × 1pt, 上限20)`,
      points: pts,
    });
  }

  // Priority inflation: >30% is P0/P1
  const p0p1 = (priorityDist['P0'] ?? 0) + (priorityDist['P1'] ?? 0);
  if (totalOpen > 0 && p0p1 / totalOpen > 0.3) {
    deductions.push({
      reason: `優先度インフレ (P0+P1が${Math.round((p0p1 / totalOpen) * 100)}%、30%超)`,
      points: 5,
    });
  }

  if (unlabeledCount > 0) {
    const pts = Math.min(Math.round(unlabeledCount * 0.3), 10); // cap at 10
    deductions.push({
      reason: `ラベルなしIssue (${unlabeledCount}件 × 0.3pt, 上限10)`,
      points: pts,
    });
  }

  const totalDeductions = deductions.reduce((sum, d) => sum + d.points, 0);
  const healthScore = Math.max(0, Math.min(100, 100 - totalDeductions));

  // Step 6: Generate recommendations
  const recommendations: string[] = [];

  if (zombieCount > 0) {
    recommendations.push(
      `ゾンビIssue ${zombieCount}件を確認し、実装済みならCloseしてください。/pm issue-sync で詳細を確認できます。`
    );
  }
  if (untrackedTodoCount > 0) {
    recommendations.push(
      `未追跡のTODO/FIXME ${untrackedTodoCount}件があります。/pm issue-cleanup でIssue化を検討してください。`
    );
  }
  if (staleCount > 0) {
    recommendations.push(
      `${staleThreshold}日以上更新のないIssue ${staleCount}件。継続するか、Iceboxに移すか判断してください。`
    );
  }
  if ((priorityDist['Unset'] ?? 0) > 0) {
    recommendations.push(
      `優先度未設定のIssue ${priorityDist['Unset']}件。Sprint計画の精度向上のため設定を推奨します。`
    );
  }
  if (healthScore >= 80) {
    recommendations.push('バックログは概ね健全です。定期的な棚卸しを続けてください。');
  } else if (healthScore >= 60) {
    recommendations.push('バックログにやや課題があります。Sprint前に整理を推奨します。');
  } else {
    recommendations.push(
      'バックログの健全性が低い状態です。バックログ棚卸しセッションの実施を強く推奨します。'
    );
  }

  const report: BacklogHealthReport = {
    repo: args.repo,
    projectNumber: args.projectNumber,
    scannedAt: new Date().toISOString(),
    healthScore,
    metrics,
    deductions,
    recommendations,
    warnings,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(report, null, 2),
      },
    ],
  };
}
