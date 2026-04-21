# Spec Quality Gate — Rubric

> Boolean gate. All 5 criteria must pass before an Issue body / PR-FAQ / spec file is accepted as source-of-truth for agent dispatch.
> Source: *ai-pm-principles-research.md* (Part 5.9 — OpenAI Codex spec-quality evaluations 2024; MAST 2025 spec-failure category = 41.77% of multi-agent failures).
> Purpose: attack the dominant failure mode of AI-assisted delivery at its source — the spec.

---

## The 5 criteria

### 1. JTBD stated
**What**: A single sentence naming the user, the job-to-be-done, and the desired outcome.
**Format**: "When [situation], [user role] wants to [job], so that [outcome]."
**Fail condition**: missing user role, missing outcome, or outcome = "ship the feature."

### 2. Acceptance criteria are numeric or boolean
**What**: Every AC is checkable by a non-author — either a number (latency < 300ms, cost < $X/month, coverage ≥ 80%) or a boolean (API returns 200 on valid input; user sees confirmation within 2 seconds).
**Fail condition**: "feels fast", "looks clean", "works as expected" — reject and rewrite.

### 3. Invariants listed explicitly
**What**: What must *not* change (APIs, schema, security boundary, performance floor). The list is exhaustive for this work's blast radius.
**Fail condition**: "don't break anything" — too broad. Force enumeration of the top 3-5 specific invariants.

### 4. Reversibility budget declared
**What**: How fast can this change be reverted? Target < 1 hour; state the mechanism (feature flag, kill switch, rollback script, traffic drain).
**Fail condition**: "we'll figure it out" or rollback requires code change at incident time.

### 5. Blast radius scored
**What**: If this fails, what is the worst-case impact? Pick from a scale:
- **S1** — single user, single session, < 5 min
- **S2** — single tenant / team, < 1 hour
- **S3** — all users for a single feature, < 4 hours
- **S4** — all users, whole product, < 1 day
- **S5** — data loss / security / compliance

S4 and S5 require explicit executive sign-off in the spec.

---

## Gate procedure

1. Open the Issue body / spec file.
2. Check each criterion in order. If any fail: reject, write specific rewrite guidance, **do not dispatch agents**.
3. If all 5 pass: tag the spec `spec-gate-passed-v<date>` and dispatch.

## Anti-patterns

- **Rubber-stamp gate** — checking boxes without reading. Signal: 100% pass rate. Fix: tag 10% of passes for re-review randomly.
- **Author self-rates** — author is biased. Fix: second reviewer required for S3+ work.
- **Gate skipped for "small" work** — small work becomes 80% of prod incidents. Fix: gate applies to every dispatch > 1 hour.
- **Gate grows indefinitely** — adding criterion #6, #7, #8… Fix: gate stays at 5; new concerns go to `references/anti-patterns.md`.

---

## Paste-in template (Issue body)

```markdown
## Spec Quality Gate

**JTBD**
> When <situation>, <user role> wants to <job>, so that <outcome>.

**Acceptance criteria**
- [ ] <numeric or boolean check 1>
- [ ] <numeric or boolean check 2>
- [ ] <numeric or boolean check 3>

**Invariants (must not change)**
1. <API / schema / security / performance floor>
2. …

**Reversibility budget**
- Rollback mechanism: <feature flag / script / traffic drain>
- Rollback SLO: < <minutes>

**Blast radius**
- [ ] S1 / [ ] S2 / [ ] S3 / [ ] S4 / [ ] S5
- Executive sign-off (required for S4/S5): @<name> — <date>

**Gate decision**
- [ ] All 5 criteria pass → dispatch approved
```
