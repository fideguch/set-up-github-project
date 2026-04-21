# 30 Anti-Pattern Watchlist — AI-Era PM Orchestration

> Cross-check against this list on any intervention decision.
> Source: `ai-pm-principles-research.md` Part 7.
> Categories map to **MAST 2025** failure taxonomy (Specification 41.77% / Coordination 36.94% / Verification 21.30%) + PM cognitive biases (CALM ICLR 2025, Kahneman).

Each entry: **trigger signal** → **counter-move** → **principle invoked**.

---

## Specification layer (MAST spec failures)

| # | Pattern | Trigger | Counter-move | Principle |
|---|---------|---------|--------------|-----------|
| 1 | Prompt bloat | Orchestration prompt > 500 words, grows each turn | Extract spec to Issue body; prompt stays orchestration-only | P6 |
| 2 | Ambiguous acceptance criteria | "ship it when it feels right" | Numeric or boolean AC only | P1 |
| 3 | Unstated invariants | "everyone knows we can't touch X" | List invariants in spec explicitly | P6 |
| 4 | Missing JTBD | Feature has no stated user job | Require JTBD in PR-FAQ before dispatch | P1, P11 |
| 5 | Scope creep mid-session | New requirements injected after dispatch | New Issue, not expanded scope | P6, P8 |
| 6 | Over-specification | Every detail prescribed, agent cannot solve | State problem + constraints + outcome, not steps | P6 |
| 7 | Frozen plan fallacy | Plan written once, never revised | ReAct cadence: update every 15-30 min | P3 |

## Coordination layer (MAST coordination failures)

| # | Pattern | Trigger | Counter-move | Principle |
|---|---------|---------|--------------|-----------|
| 8 | Shared-worktree branch switch | Two sessions share a worktree, one checks out → HEAD race | 1:1 worktree:session rule, enforce with registry | P8 |
| 9 | Migration number collision | Two sessions claim same DB migration N | Registry claim before creation | P9 |
| 10 | Merge race | Two sessions merge simultaneously, diverge | Rebase + single-writer merge queue | P8 |
| 11 | Registry drift | Parallel-session registry out of sync vs `git worktree list` | Daily sync audit | P7 |
| 12 | Orphan worktree | Session ended, worktree remained | 5-step cleanup hard gate | P8 |
| 13 | Unclear ownership | Multiple sessions touch same Issue | Issue-level assignment; single session owns | P6 |
| 14 | Parallel blast-radius | One session's broken migration breaks main for others | Staging branch + smoke test before main | P10 |
| 15 | Agent worktree disappearance | Internal error vaporizes session state | Deterministic re-dispatch with cryptographic input fingerprint | P3, P10 |

## Verification layer (MAST verification failures)

| # | Pattern | Trigger | Counter-move | Principle |
|---|---------|---------|--------------|-----------|
| 16 | Self-report blind trust | Accept "all tests passing" without log | Ingest log / SHA, not prose | P3 |
| 17 | Test result ≠ user behavior | Tests pass, users still fail | E2E smoke test or staged rollout | P3, P7 |
| 18 | Hallucinated completion | Agent claims file written, file absent | `ls`/`cat` check, not `echo done` | P3 |
| 19 | Confirmation-bias sampling | PM checks only files agent highlighted | Random-sample + diff vs expected | P12 |
| 20 | Closed-loop self-review | Session self-evaluates own output | Second-agent or human review step | P3 |
| 21 | Metric gaming | Agent optimizes the test, not the outcome | Compound metrics, outcome-not-output focus | P1 |

## PM cognitive layer (CALM 12 biases + Kahneman)

| # | Pattern | Trigger | Counter-move | Principle |
|---|---------|---------|--------------|-----------|
| 22 | Authority bias | "Trust this session because it worked last time" | Fresh evidence every time | P3, P12 |
| 23 | Anchoring on first plan | First agent's approach biases later evaluation | Blind re-review | P12 |
| 24 | Availability bias | Recent failure dominates; rare critical risk ignored | Explicit risk register | P4 |
| 25 | Dogma formation | Principles become rituals, context lost | Each principle carries reversibility clause | P2 |
| 26 | Labeling as reasoning | "Session X is undisciplined" replaces investigation | Facts first, labels last | P5, P12 |
| 27 | Verbosity bias | Longer report rated as better | Rate by evidence density, not length | P12 |
| 28 | Catastrophizing | One session's mistake → systemic rewrite | Cynefin re-classify before acting | P2 |

## Process layer

| # | Pattern | Trigger | Counter-move | Principle |
|---|---------|---------|--------------|-----------|
| 29 | Skill-over-skill speculation | "We need a new skill for this" without base data | Measure pain first, then skill | P9 |
| 30 | Metric tunnel vision | One metric (e.g., velocity) dominates | Balanced scorecard (velocity + CFR + SLO + NPS) | P1, P7 |

---

## How to use

**On intervention decision**: scan the 30-row table. If the intervention matches a counter-move, proceed with that principle. If it matches an anti-pattern trigger, stop and re-frame.

**On weekly PM retrospective**: tag each incident of the past week with its matching row(s). Clusters indicate structural issues (fix the orchestration, not the session).

**On new principle proposal**: ensure it falls into an existing category or document why it's a new category. Resist proliferation; favor composition of existing principles.
