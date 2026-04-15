/**
 * Types for Issue-Sync tools: zombie detection, TODO scanning, and backlog health reporting.
 */

// --- Zombie scan types ---

export type ZombieClassification = 'implemented' | 'partial' | 'unconfirmed' | 'no_code_found';

export interface ZombieEvidence {
  readonly codeMatches: readonly {
    readonly file: string;
    readonly line: number;
    readonly snippet: string;
  }[];
  readonly commitRefs: readonly {
    readonly sha: string;
    readonly message: string;
  }[];
}

export interface ZombieCandidate {
  readonly issueNumber: number;
  readonly title: string;
  readonly classification: ZombieClassification;
  readonly confidence: number;
  readonly evidence: ZombieEvidence;
  readonly staleDays: number;
  readonly labels: readonly string[];
}

export interface ZombieSummary {
  readonly implemented: number;
  readonly partial: number;
  readonly unconfirmed: number;
  readonly noCodeFound: number;
}

export interface ZombieReport {
  readonly repo: string;
  readonly scannedAt: string;
  readonly totalOpenIssues: number;
  readonly candidates: readonly ZombieCandidate[];
  readonly summary: ZombieSummary;
}

// --- TODO scan types ---

export type TodoMarker = 'TODO' | 'FIXME' | 'HACK' | 'XXX' | string;
export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface TodoEntry {
  readonly file: string;
  readonly line: number;
  readonly marker: string;
  readonly text: string;
  readonly suggestedPriority: Priority;
  readonly matchingIssue: number | null;
  readonly proposedTitle: string;
}

export interface TodoReport {
  readonly repo: string;
  readonly scannedAt: string;
  readonly totalTodos: number;
  readonly alreadyTracked: number;
  readonly untracked: number;
  readonly entries: readonly TodoEntry[];
  readonly issuesCreated: readonly number[];
}

// --- Backlog health report types ---

export interface HealthDeduction {
  readonly reason: string;
  readonly points: number;
}

export interface BacklogMetrics {
  readonly totalOpenIssues: number;
  readonly zombieCount: number;
  readonly todoCount: number;
  readonly untrackedTodoCount: number;
  readonly staleIssueCount: number;
  readonly priorityDistribution: Record<string, number>;
  readonly avgAgeDays: number;
  readonly unlabeledCount: number;
}

export interface BacklogHealthReport {
  readonly repo: string;
  readonly projectNumber: number;
  readonly scannedAt: string;
  readonly healthScore: number;
  readonly metrics: BacklogMetrics;
  readonly deductions: readonly HealthDeduction[];
  readonly recommendations: readonly string[];
  readonly warnings: readonly string[];
}
