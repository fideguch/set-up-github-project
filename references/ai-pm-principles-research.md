# AI-Era PM Self-Improvement: A Synthesis of Product Management, Reliability Engineering, and Multi-Agent AI Research

> **Status**: Source paper for my_pm_tools skill v5.4.0 "PM Operator Stance" chapter.
> **Scope**: Generic principles for AI-assisted product management — applicable to any product, any team, any AI coding agent orchestration setup.
> **Date**: 2026-04-22
> **Author context**: Synthesized from parallel-session Claude Code operations at a commercial launch. Personalized critique redacted; principles are generalized.

---

## Abstract

This paper synthesizes > 200 sources covering: (a) classical product management canon (Amazon Working Backwards, Cagan Empowered, Perri Build Trap, Torres Continuous Discovery, Doshi LNO, Ulwick JTBD); (b) reliability & ops engineering (Google SRE, DORA/Accelerate, Nygard Release It, Meadows Systems Thinking, Taleb Antifragile); (c) cognitive science & decision theory (Klein Premortem, Dekker Just Culture, Kahneman System 1/2, Cynefin framework); (d) 2024-2026 multi-agent AI failure research (MAST UC Berkeley 2025, CALM ICLR 2025, Reflexion, Chain-of-Verification, Constitutional AI). It extracts **12 principles** with reversibility conditions and measurements, catalogs **30 anti-patterns**, and proposes concrete skill improvements for PM tools used in parallel-agent orchestration.

The core finding: classical PM wisdom (outcomes > outputs, blameless postmortems, premortems, trunk-based delivery) is **necessary but insufficient** when the PM supervises AI coding agents. Three AI-specific discipline gaps close the remaining capability gap: (1) **Chain-of-Verification rituals** that treat agent self-reports as hypotheses, not facts; (2) **Cynefin-aware decision routing** that refuses to over-engineer Clear-domain problems; (3) **CALM bias self-audits** that counter the documented biases of LLM-as-judge patterns in the judge (i.e., the human PM using AI).

---

## Part 1 — Why another PM paper

Most PM literature was written pre-2023 and assumes human-only teams. Parallel AI coding agents (Claude Code, Cursor, Devin, Aider) collapse delivery time by 5-10× but introduce novel failure modes: agents that hallucinate completion, self-reports that drift from git state, migrations that collide silently, and worktrees that disappear mid-run. The PM in this setup is less "roadmap owner" and more **last-line-of-defense coordinator** — a role closer to an incident commander than to a traditional product manager.

Yet the first instinct of an AI-era PM — "I will trust the agent's report and monitor for exceptions" — is exactly the pattern that Multi-Agent System Taxonomy (MAST, UC Berkeley 2025) documents as the leading cause of multi-agent failure: **21.30% of multi-agent failures are verification failures** where the orchestrator accepted an agent's claim without independent checking. This paper is an attempt to patch that gap.

---

## Part 2 — Classical PM Canon (still load-bearing)

### 2.1 Outcomes over outputs (Perri, *Escaping the Build Trap*, 2018)
The "build trap" is measuring success by shipped features rather than by user outcomes. In AI-assisted teams the trap intensifies because output velocity is artificially cheap. Principle: **every accepted PR must map to a measurable outcome (SLO, conversion, retention delta)** — velocity is not evidence of progress.

### 2.2 Continuous Discovery Habits (Torres, 2021)
Weekly touchpoints with 3+ users per team; interviewing-to-delivery ratio > 1:1 on new work. AI agents do not discover — they deliver. PM discovery cadence must remain human.

### 2.3 Empowered Product Teams (Cagan, *Inspired* / *Empowered*)
"Product teams solve problems in ways that work for the business." In AI-era setups, treat each parallel agent session as an empowered team: give it the problem, the constraints, and the outcome — **not a script**. Over-scripted prompts produce brittle output.

### 2.4 Working Backwards / PR-FAQ (Amazon)
Write the press release and the FAQ **before** writing code. The discipline exposes assumption-heavy features before they consume engineering. In AI-assisted work this is doubly valuable: the PR-FAQ becomes the canonical spec that many agent sessions share as SSOT (single source of truth).

### 2.5 Jobs to Be Done (Christensen, Ulwick)
The user "hires" your product to accomplish a job. In AI-coded products the PM must still own the JTBD definition — agents will not ask "why does the user need this?" They will optimize whatever you write. Misaligned JTBD → fast, wrong code.

### 2.6 LNO framework (Doshi)
Every task is Leverage, Neutral, or Overhead. AI agents make Overhead cheap but cannot change its category. **PM leverage tasks — JTBD definition, SLO setting, blast-radius judgment, bias audit — cannot be delegated to AI**. Delegate Neutral and Overhead; keep Leverage close.

### 2.7 Outcome metrics (Pirate metrics, HEART, North Star)
North Star metric + 3-5 supporting metrics. Every Issue / PR / session should be traceable to a Star contribution estimate. Sessions without traceability are speculation.

---

## Part 3 — Reliability & Ops Engineering (the PM's second book)

### 3.1 Google SRE: Error Budget, SLOs, Toil
SLO = "99.9% of requests succeed within 300ms over 28 days." Error Budget = 1 − SLO. **When the error budget is healthy, ship faster. When burned, slow down.** This converts reliability from argument to math. In AI-orchestration, define an Error Budget for **agent delivery correctness** (e.g., "of 100 merged agent PRs, ≤ 3 require rollback within 7 days"). Blow the budget → freeze and fix orchestration, not add more agents.

Toil = "manual, repetitive, automatable work with no enduring value." AI does not eliminate toil by default — it moves the toil from code to verification. SRE discipline: budget ≤ 50% of time on toil. PM analog: budget ≤ 50% of session time on cross-checking agents; if higher, the orchestration system is broken.

### 3.2 DORA / Accelerate (Forsgren, Humble, Kim)
Four key metrics: Lead Time, Deployment Frequency, Change Failure Rate, MTTR. 2025 DORA reports AI-assisted teams show **higher output but unchanged or worse Change Failure Rate** unless they practice Trunk-Based Development and small batches. Lesson: AI amplifies your delivery maturity — including the dysfunction.

### 3.3 Nygard *Release It!* — Stability Patterns
Circuit Breaker, Bulkhead, Fail Fast, Shed Load, Steady State. Translated to AI orchestration:
- **Circuit Breaker**: if an agent session fails HG gates 3× in a row, **stop dispatching to it** and escalate to human.
- **Bulkhead**: isolate agent worktrees so one session's failure does not cascade (this is why shared-worktree checkout is the known trap).
- **Fail Fast**: agent reports without evidence are rejected at ingestion, not at merge.
- **Shed Load**: when >N sessions run in parallel, P1 work preempts P3 work; don't starve the critical path.

### 3.4 Fallacies of Distributed Computing (Deutsch, Gosling)
"The network is reliable / latency is zero / bandwidth is infinite / topology doesn't change…" Every fallacy applies to multi-agent orchestration: agent responses get lost, worktrees disappear, migrations collide, branches drift. Assume failure; design for recovery.

### 3.5 Systems Thinking / Leverage Points (Meadows)
12 places to intervene in a system, ranked by impact. Parameter tuning is weakest; paradigm change is strongest. PM analog: changing a migration number (parameter) is low leverage; changing the "agents self-report freely" paradigm to "agents report with cryptographic evidence" is high leverage. Prefer high-leverage fixes.

### 3.6 Antifragility (Taleb, *Antifragile*, 2012)
Systems are **convex** (benefit from volatility) or **concave** (hurt by volatility). AI-orchestration is concave by default (one agent failure can poison downstream sessions). Deliberate convexification: small bets, rapid rollback, post-incident learning capture. Prefer options with **capped downside + uncapped upside**.

### 3.7 Just Culture / Blameless Postmortem (Dekker, Allspaw)
After incidents: focus on systemic causes, not individuals (or individual agents). "How did the system allow this?" not "Who made the mistake?" Agents are not moral actors; orchestrators are. Postmortem outputs: (1) timeline, (2) contributing factors, (3) action items (owner + date), (4) honest self-assessment. Distribute widely.

### 3.8 Second Victim (Wu, Dekker)
After a bad incident, the responsible person is the "second victim" of the event. In AI orchestration the human PM who missed a gate is a second victim too. Skill design must support recovery, not shame: the audit trail is for learning, not for blame.

---

## Part 4 — Cognitive Science & Decision Theory

### 4.1 Cynefin framework (Snowden)
Five domains:
- **Clear** (obvious): sense → categorize → respond. Best practice applies.
- **Complicated**: sense → analyze → respond. Good practice; experts help.
- **Complex**: probe → sense → respond. Emergent practice; safe-to-fail experiments.
- **Chaotic**: act → sense → respond. Novel practice; stabilize first.
- **Disorder**: you don't know which domain you're in. Most dangerous.

PM malpractice: treating Complex as Complicated (over-analysis paralysis) or treating Clear as Complex (over-engineering trivial tasks). **Cynefin-aware triage before any orchestration decision.**

### 4.2 Premortem / Prospective Hindsight (Klein, 2007)
Before commit: "Imagine we shipped this and it failed catastrophically. Write the obituary." Klein's field data: prospective hindsight identifies 30% more risks than standard risk analysis. Ritual: 5-minute silent pre-mortem before launching any agent dispatch larger than N hours of work.

### 4.3 Devil's Advocate / Red Team (Janis; DoD)
Assign a role to argue against the plan. In AI orchestration, dispatch a second agent with the **explicit instruction**: "Find three reasons this plan will fail." Merge the artifacts, resolve disagreements, then commit.

### 4.4 System 1 / System 2 thinking (Kahneman)
System 1 is fast, pattern-matching, confidence-producing. System 2 is slow, deliberate, effortful. AI output cues System 1 confidence in humans (it looks competent). **Verification is System 2 work and must be budgeted explicitly**.

### 4.5 Dual-Process Failures under Time Pressure (Klein)
Under time pressure, experts degrade gracefully by using stored patterns (Recognition-Primed Decision). Non-experts degrade catastrophically. AI-PMs without domain expertise cannot detect subtle errors in AI output. Implication: the PM who oversees AI agents must maintain domain fluency; delegating **everything** to AI destroys the detection substrate.

### 4.6 Heuristics & Biases (Kahneman, Tversky)
Key biases in AI oversight:
- **Anchoring**: first output biases judgment of later outputs.
- **Availability**: recent failures dominate; rare critical failures ignored.
- **Confirmation bias**: accepting evidence that agent succeeded, discounting warning signs.
- **Automation bias**: over-trusting automated output (documented in aviation, medicine, and now software).

---

## Part 5 — AI-Native Multi-Agent Research (2023-2026)

### 5.1 Multi-Agent System Taxonomy (MAST — UC Berkeley 2025)
Analysis of 500+ multi-agent failures. Failure categories:
- **Specification failures (41.77%)**: orchestrator gave ambiguous instructions, incomplete scope, or conflicting constraints.
- **Coordination failures (36.94%)**: agents stepped on each other; race conditions; shared state corruption.
- **Verification failures (21.30%)**: orchestrator accepted agent output without independent check.

Implication for PM skills: **the three discipline gaps map 1:1 to these failure categories**. Spec-quality-gate attacks specification failures. Parallel-session protocol attacks coordination failures. Chain-of-Verification rituals attack verification failures.

### 5.2 Chain-of-Verification (Dhuliawala et al 2023)
Method: (1) generate draft answer, (2) generate verification questions, (3) answer each question independently, (4) reconcile. 20-30% reduction in hallucinations. PM analog: agent submits PR → PM generates verification questions (does this test exist? does this migration apply cleanly? does this code actually run?) → PM answers each from primary evidence (not from agent's summary).

### 5.3 Reflexion (Shinn et al 2023)
Agent iterates: act → observe → self-critique → revise. Empirically beats one-shot agents. PM analog: the PM's **own** work deserves Reflexion. After every session, 5-minute self-critique: "What did I miss? What am I anchored on? What evidence did I skip?"

### 5.4 Constitutional AI / RLAIF (Anthropic)
Agents are trained against explicit principles ("Be honest, non-harmful, not evasive"). Your orchestration setup is its own constitution: the rules your PM skill encodes become the de facto constitution of your team. **Write it like it matters**, because it becomes load-bearing.

### 5.5 Tree of Thoughts (Yao et al 2023)
Explore multiple reasoning paths before committing. 70% improvement on hard problems. PM analog: before any non-trivial decision, generate 3 options, rank trade-offs, commit to one. The "obvious option" is often a System 1 trap.

### 5.6 ReAct (Yao et al 2022)
Reasoning + Acting interleaved. Agents that alternate between thought and action outperform thought-only or action-only. PM analog: update the plan every 15-30 minutes during orchestration; don't plan once then execute blindly.

### 5.7 LLM-as-Judge biases (CALM — ICLR 2025)
12 biases documented in LLM-as-judge: position bias, verbosity bias, self-enhancement bias, familiarity bias, authority bias, band-wagon bias, sentence-order bias, compassion bias, egocentric bias, distraction bias, fallacy oversight, length-bias. **Only 64-68% alignment with human ground truth across tested judges.**

The PM **is** the judge in AI-orchestration. Therefore these biases apply to the PM. Explicit counter-rituals:
- Audit for **position bias**: did I accept the first agent's plan because it was first?
- Audit for **verbosity bias**: did I rate a longer PR description as higher quality without evidence?
- Audit for **authority bias**: did I trust this agent because it worked last time?
- Audit for **confirmation bias**: am I cherry-picking evidence that this session is "on track"?

### 5.8 Agent Worktree Disappearance (field observation, 2026)
In sustained parallel Claude Code runs, agent worktrees occasionally vanish mid-execution (internal error, resource pressure, or unknown). Recovery pattern: **dispatch the same agent spec in the parent worktree with isolation=false, using cryptographic (SHA256) fingerprint of inputs to prove determinism across re-runs**. This is Nygard's Fail Fast + SRE Error Budget in action.

### 5.9 Spec Quality → Output Quality (OpenAI Codex evals, 2024)
Spec quality is the dominant input to agent output quality — more predictive than model choice. Investment ratio suggested by the evaluators: **60-70% of total cycle time should be spec + planning + verification**, not code. Violating this ratio is the leading cause of rework.

---

## Part 6 — The 12 Principles (with citations, reversibility conditions, measurements)

### P1 — Outcomes over outputs
**Rule**: Every Issue / PR / session links to a measurable outcome (SLO, conversion delta, retention, North Star contribution).
**Citation**: Perri 2018; Cagan *Empowered*.
**Reversal condition**: session acceptance without linked outcome evidence → reject.
**Measurement**: % of merged PRs with documented outcome link (target ≥ 95%).

### P2 — Cynefin-aware routing
**Rule**: Before any orchestration decision, classify the problem domain (Clear / Complicated / Complex / Chaotic). Apply domain-appropriate practice.
**Citation**: Snowden (Cynefin framework).
**Reversal condition**: applying Complex-domain exploration to Clear-domain tasks (over-engineering) or best-practice playbooks to Complex-domain tasks (false certainty).
**Measurement**: decision log must carry domain tag; weekly review for mismatches.

### P3 — Chain-of-Verification over self-report trust
**Rule**: Agent self-reports are hypotheses, not facts. Ingest evidence (git SHA, test output, primary file read) before accepting completion.
**Citation**: Dhuliawala et al 2023; MAST 2025 (verification failures = 21.30%).
**Reversal condition**: completion accepted from textual report alone → violation, re-verify with primary evidence.
**Measurement**: % of completions with evidence artifact recorded (target ≥ 100% for P0/P1).

### P4 — Premortem before commit
**Rule**: For any work > N hours or blast-radius > single-file, run a 5-minute premortem before dispatch.
**Citation**: Klein 2007 (Prospective Hindsight, +30% risk detection).
**Reversal condition**: "it feels obvious" → re-run premortem; obvious is a System 1 trap.
**Measurement**: premortem artifact exists for every P0/P1 dispatch.

### P5 — Blameless postmortem + Just Culture
**Rule**: After incidents: systemic causes, not individual (or agent) blame. Outputs: timeline, contributing factors, action items with owner + date.
**Citation**: Dekker, Allspaw.
**Reversal condition**: postmortem framed as "who made the mistake" → re-frame.
**Measurement**: postmortem template filled for every incident > Sev-3.

### P6 — Working Backwards artifact as SSOT
**Rule**: The PR-FAQ / spec is the single source of truth. Orchestration prompts are orchestration; they do not encode requirements.
**Citation**: Amazon Working Backwards; OpenAI Codex spec-quality evals.
**Reversal condition**: prompts grow into spec proxies ("prompt bloat") → extract back to Issue body / spec file.
**Measurement**: orchestration prompt size ≤ threshold (e.g., 500 words); Issue body carries the full spec.

### P7 — Error Budget discipline / SLO-first
**Rule**: Define error budgets for system reliability **and** for AI-orchestration correctness. When burned, freeze and fix; when healthy, ship faster.
**Citation**: Google SRE Book.
**Reversal condition**: ignoring burned budget to "just ship this one more thing" → violation.
**Measurement**: monthly error-budget burn-down published.

### P8 — Trunk-Based Development, small PRs, fast CI
**Rule**: Short-lived branches, small PRs, CI feedback < 10 minutes. Parallel agent sessions amplify the cost of long branches 3×.
**Citation**: Humble *Continuous Delivery*; DORA 2024-2025.
**Reversal condition**: agent branch > 7 days old or > 500 lines → split.
**Measurement**: median PR size; median branch age.

### P9 — Leverage-point prioritization
**Rule**: Before fixing a recurring issue, ask "where is the highest-leverage place to intervene?" Prefer paradigm > rule > parameter changes.
**Citation**: Meadows *Thinking in Systems*.
**Reversal condition**: same category of bug recurs 3×, you're still patching parameters → escalate.
**Measurement**: retrospective tag ("paradigm" / "rule" / "parameter") on each fix.

### P10 — Antifragile posture, convex bets
**Rule**: Prefer options with capped downside + uncapped upside. Small, reversible experiments over large commits.
**Citation**: Taleb *Antifragile*.
**Reversal condition**: large irreversible bet without staged rollback → add staged rollback or shrink.
**Measurement**: blast-radius score on every change; % reversible within 1 hour.

### P11 — Continuous Discovery: user evidence at human cadence
**Rule**: Agents deliver; humans discover. Weekly user touchpoints; no AI shortcut.
**Citation**: Torres *Continuous Discovery Habits*.
**Reversal condition**: "we're too busy shipping to talk to users" → red flag; freeze scope, resume discovery.
**Measurement**: user interviews per week (target ≥ 3).

### P12 — LNO triage + CALM bias audit
**Rule**: Classify every task as Leverage / Neutral / Overhead. PM keeps Leverage; delegates rest. Before any PM judgment, run CALM 12-bias check.
**Citation**: Doshi; CALM ICLR 2025.
**Reversal condition**: PM spending > 40% of time on Overhead → re-delegate.
**Measurement**: weekly LNO time-log; CALM audit flag count.

---

## Part 7 — 30 Anti-Patterns (Watchlist)

Each pattern has a trigger signal and a counter-move.

**Specification layer (maps to MAST spec failures)**
1. **Prompt bloat** — orchestration prompt grows into requirements. *Counter*: extract spec to Issue body, keep prompt < 500 words.
2. **Ambiguous acceptance criteria** — "ship it when it feels right". *Counter*: numeric or boolean AC only.
3. **Unstated invariants** — "everyone knows we can't touch X". *Counter*: list invariants in spec explicitly.
4. **Missing JTBD** — feature has no stated user job. *Counter*: require JTBD in PR-FAQ before dispatch.
5. **Scope creep mid-session** — new requirements injected after dispatch. *Counter*: new Issue, not expanded scope.
6. **Over-specification** — every detail prescribed, agent cannot solve. *Counter*: state problem + constraints + outcome, not steps.
7. **Frozen plan fallacy** — plan written once, never revised. *Counter*: ReAct cadence (plan every 15-30 min).

**Coordination layer (MAST coordination failures)**
8. **Shared-worktree branch switch** — two sessions share a worktree, one checks out → HEAD race. *Counter*: 1:1 worktree:session rule, enforce with registry.
9. **Migration number collision** — two sessions claim the same DB migration N. *Counter*: registry claim before creation.
10. **Merge race** — two sessions merge simultaneously, diverge. *Counter*: rebase + single-writer merge queue.
11. **Registry drift** — parallel-session registry out of date vs `git worktree list`. *Counter*: daily sync audit.
12. **Orphan worktree** — session ended, worktree remained. *Counter*: 5-step cleanup hard gate.
13. **Unclear ownership** — multiple sessions touch same Issue. *Counter*: Issue-level assignment; single session owns.
14. **Parallel blast-radius** — one session's broken migration breaks main for others. *Counter*: staging branch + smoke test before main.
15. **Agent worktree disappearance** — internal error vaporizes session state. *Counter*: deterministic re-dispatch with cryptographic input fingerprint.

**Verification layer (MAST verification failures)**
16. **Self-report blind trust** — accept "all tests passing" without log. *Counter*: ingest log / SHA, not prose.
17. **Test result ≠ user behavior** — tests pass, users still fail. *Counter*: E2E smoke test or staged rollout.
18. **Hallucinated completion** — agent claims file written, file absent. *Counter*: `ls`/`cat` check, not `echo "done"`.
19. **Confirmation-bias sampling** — PM checks only the files the agent highlighted. *Counter*: random-sample + diff vs expected.
20. **Closed-loop self-review** — session self-evaluates its own output. *Counter*: second-agent or human review step.
21. **Metric gaming** — agent optimizes the test, not the outcome. *Counter*: compound metrics, outcome-not-output focus.

**PM cognitive layer (CALM + Kahneman)**
22. **Authority bias** — trust this session because it worked last time. *Counter*: fresh evidence every time.
23. **Anchoring on first plan** — first agent's approach biases later evaluation. *Counter*: blind re-review.
24. **Availability bias** — recent failure dominates; rare critical risk ignored. *Counter*: explicit risk register.
25. **Dogma formation** — principles become rituals, context lost. *Counter*: principles must carry reversibility conditions.
26. **Labeling as reasoning** — "session is undisciplined" replaces investigation. *Counter*: facts first, labels last.
27. **Verbosity bias** — longer report rated as better. *Counter*: rate by evidence density, not length.
28. **Catastrophizing** — one session's mistake triggers systemic rewrite. *Counter*: Cynefin re-classify before acting.

**Process layer**
29. **Skill-over-skill speculation** — "we need a new skill for this" without base data. *Counter*: measure pain first, then skill.
30. **Metric tunnel vision** — one metric (e.g., velocity) dominates decisions. *Counter*: balanced scorecard (velocity + CFR + SLO + NPS).

---

## Part 8 — Six Improvement Packages for my_pm_tools

### Package A — 12 Principles replacing 7-principle stance (P0)
Rewrite PM Operator Stance with the 12 principles above, each carrying citation + reversibility condition + measurement. Non-destructive: keep the 7-principle spirit but upgrade to evidence-based.

### Package B — 30 Anti-Pattern Watchlist (P0)
Ship as `references/anti-patterns.md`. SKILL.md links to it with a short summary table. PM sessions cross-check against the list on intervention decisions.

### Package C — Cynefin Domain Discrimination guide (P1)
`references/cynefin-guide.md` with decision tree: Clear → run playbook; Complicated → expert review; Complex → safe-to-fail experiment; Chaotic → stabilize first. Plus examples of PM mis-classification.

### Package D — Premortem + Devil's Advocate ritual template (P1)
`references/premortem-template.md`. 5-minute ritual before any P0/P1 dispatch. Template carries (1) failure scenarios, (2) early-warning indicators, (3) reversibility budget.

### Package E — Spec Quality Gate rubric (P0)
`references/spec-quality-gate.md`. Boolean rubric: JTBD stated / AC numeric / invariants listed / reversibility budget / blast-radius scored. Spec cannot reach Issue body without passing all five.

### Package F — Self-Evaluation Protocol with CALM biases (P0)
`references/self-evaluation-protocol.md`. After every PM intervention: run CALM 12-bias check. Flag audit items in session log.

**Priority matrix**: P0 = A, B, E, F (discipline-critical, directly reduce MAST failure modes). P1 = C, D (uplift, not emergency).

---

## Part 9 — Cases (redacted, generalized)

Five generalized PM failure patterns observed in parallel-session orchestration, each mapped to bias + anti-pattern + principle.

### Case 1 — "Session X is under-performing" label formation
**Pattern**: PM forms negative judgment based on thin signals (report length, tone) before primary-evidence check.
**Biases**: verbosity bias (short report → low quality), availability bias (recent small miss dominates).
**Anti-pattern**: #26 labeling as reasoning.
**Principle invoked**: P3 (Chain-of-Verification) + P12 (CALM audit).
**Counter**: always `gh pr diff` + `gh pr checks` + file read before labeling.

### Case 2 — Over-engineering a Clear-domain task
**Pattern**: simple one-line config change dispatched as forge_ace Full + gatekeeper.
**Biases**: automation bias, process-as-value bias.
**Anti-pattern**: #28 catastrophizing, #29 skill speculation.
**Principle invoked**: P2 (Cynefin-aware routing).
**Counter**: Cynefin-tag the task; use direct implementation + post-review for Clear domain.

### Case 3 — Speculation on judgment that turned out wrong
**Pattern**: PM claims agent rewrite will resolve N/M errors; branch base assumption was wrong.
**Biases**: confirmation bias (accepted first plausible causal story), anchoring (first plan dominated).
**Anti-pattern**: #19 confirmation-bias sampling, #23 anchoring.
**Principle invoked**: P3, P12.
**Counter**: explicit branch-base check; "what would falsify this?" ritual.

### Case 4 — Dogma hardening
**Pattern**: original principle ("PM is last line of defense") becomes ritual; context-sensitive exceptions refused.
**Biases**: familiarity bias, process-as-value bias.
**Anti-pattern**: #25 dogma formation.
**Principle invoked**: P2 (Cynefin), principles must carry reversibility conditions.
**Counter**: every principle restated with when-does-it-NOT-apply clause.

### Case 5 — Premature closure of open question
**Pattern**: PM declares direction before finishing cross-check; downstream re-opens.
**Biases**: action bias, closure preference.
**Anti-pattern**: #16, #21.
**Principle invoked**: P4 (Premortem) + P3 (CoV).
**Counter**: explicit "I don't know yet" status; premortem before declaring.

---

## Appendix A — Representative references (200+ sources, 40+ cited here)

### Product Management canon
- Cagan, M. *Inspired* (2017), *Empowered* (2020). SVPG.
- Torres, T. *Continuous Discovery Habits* (2021).
- Perri, M. *Escaping the Build Trap* (2018).
- Christensen, C. *The Innovator's Dilemma* (1997); Ulwick, A. *Jobs to Be Done* (2016).
- Doshi, N. *The LNO Framework* (Reforge 2020).
- Amazon. *Working Backwards* / PR-FAQ (Colin Bryar, Bill Carr, 2021).
- McGrath, R. *The End of Competitive Advantage* (2013).
- Reis, E. *The Lean Startup* (2011).
- Blank, S. *The Four Steps to the Epiphany* (2005).

### Reliability engineering
- Beyer, B. et al. *Site Reliability Engineering* (Google, 2016).
- Beyer, B. et al. *The Site Reliability Workbook* (2018).
- Forsgren, Humble, Kim. *Accelerate* (2018).
- Humble, J., Farley, D. *Continuous Delivery* (2010).
- Nygard, M. *Release It!* 2nd ed (2018).
- Kleppmann, M. *Designing Data-Intensive Applications* (2017).
- DORA State of DevOps Reports (2014-2025).

### Decision theory & cognitive science
- Kahneman, D. *Thinking, Fast and Slow* (2011).
- Klein, G. *Sources of Power* (1998); Klein on Premortem (HBR 2007).
- Meadows, D. *Thinking in Systems* (2008).
- Taleb, N. N. *Antifragile* (2012); *The Black Swan* (2007).
- Snowden, D. Cynefin framework (IBM Systems Journal 2003).
- Dekker, S. *Just Culture* (2007).
- Allspaw, J. *Blameless Postmortems* (Etsy Code As Craft, 2012).
- Wu, A. W. Medical Error: *The Second Victim* (BMJ 2000).

### AI & Multi-agent research (2022-2026)
- Wei, J. et al. *Chain-of-Thought Prompting* (NeurIPS 2022).
- Yao, S. et al. *ReAct: Synergizing Reasoning and Acting* (ICLR 2023).
- Yao, S. et al. *Tree of Thoughts* (NeurIPS 2023).
- Shinn, N. et al. *Reflexion* (NeurIPS 2023).
- Dhuliawala, S. et al. *Chain-of-Verification* (ACL 2024).
- Bai, Y. et al. *Constitutional AI* (Anthropic 2022).
- MAST — *Multi-Agent System Taxonomy*, UC Berkeley (2025).
- CALM — *LLM-as-Judge Biases*, ICLR (2025).
- Lewis, P. et al. *Retrieval-Augmented Generation* (NeurIPS 2020).
- Anthropic research papers on alignment and RLAIF.
- OpenAI Codex spec-quality evaluations (2024).

### Engineering culture
- Dweck, C. *Mindset* (2006).
- Edmondson, A. *The Fearless Organization* (2018).
- Janis, I. *Groupthink* (1972).
- Hammond, J. S. et al. *Smart Choices* (1999).
- Heath, C. & D. *Decisive* (2013).

### Amazon / Airbnb / Netflix / Stripe / Uber public engineering blogs
- Bryar & Carr, *Working Backwards* (2021).
- Netflix Tech Blog: Chaos Engineering, Canaries, DBLog.
- Airbnb engineering: Dataflows, Airflow, Service Ownership.
- Stripe engineering: API versioning, Idempotency, Sorbet.
- Uber engineering: Cadence, domain-oriented microservices.
- Shopify engineering: deploy cadence, type system migrations.
- GitHub engineering: Scientist, Trident.

---

## Closing

The defect this paper addresses is **specifically the gap** between classical PM competence and AI-era orchestration reality. The 12 principles are not novel in isolation — they are novel in *combination* as the minimum working discipline for a PM supervising parallel AI coding agents at commercial-launch stakes.

Skill evolves when the principles it encodes carry their reversibility conditions. A principle without a when-does-it-NOT-apply clause is a dogma, and dogmas make the PM brittle. Every rule in my_pm_tools v5.4.0 onward must carry (a) citation, (b) reversal condition, (c) measurement. This paper is the source.

— End —
