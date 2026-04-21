# Premortem + Devil's Advocate Ritual — Template

> Source: Klein, G. *Performing a Project Premortem* (HBR 2007). Prospective hindsight increases risk identification by ~30% vs standard risk analysis.
> Use before any P0/P1 dispatch or work larger than N hours.
> Time budget: 5 minutes. If it takes longer, the session is already too ambiguous — stop and decompose.

---

## When to run

| Trigger | Run premortem? |
|---|---|
| Work > 4 hours estimated | Yes |
| Touches shared infra (DB, auth, payments) | Yes |
| P0 or P1 launch blocker | Yes |
| Cross-session dependency | Yes |
| Any work in Cynefin Complex domain | Yes |
| Typo fix, lint change, doc-only | No |
| Reversible in < 5 minutes | No |

---

## The 3-step template

### Step 1 — Imagine the failure (2 min)

> "Assume it is 2 weeks from now. This work shipped and **failed catastrophically**. Write the one-sentence obituary."

Do not hedge. Do not say "maybe." Write it as a fact.

Example obituary:
> "Migration 047 deadlocked on production at peak traffic because we didn't run it in a maintenance window."

### Step 2 — List the causes (2 min)

Generate at minimum **5 distinct causes** that could have led to the obituary. Work across layers:

| Layer | Prompt |
|---|---|
| Spec | What requirement was missed or misunderstood? |
| Code | What edge case wasn't covered? |
| Ops | What deployment / rollout assumption was wrong? |
| Human | What communication gap bit us? |
| Timing | What external event made it worse? |

### Step 3 — Define early-warning indicators + reversibility budget (1 min)

For each cause, answer:
- **What would we see in the first 30 minutes that suggests this is happening?**
- **How do we roll back within our reversibility budget (target < 1 hour)?**

---

## Artifact format (paste into Issue or PR description)

```markdown
## Premortem — <feature / change title>

### Obituary (single sentence)
> <imagined failure>

### Top 5 causes
1. <spec-layer cause> — early warning: <signal>, rollback: <action>
2. <code-layer cause> — early warning: <signal>, rollback: <action>
3. <ops-layer cause> — early warning: <signal>, rollback: <action>
4. <human-layer cause> — early warning: <signal>, rollback: <action>
5. <timing-layer cause> — early warning: <signal>, rollback: <action>

### Reversibility budget
- Detection SLO: <how fast we see the problem>
- Rollback SLO: <how fast we can undo>
- Blast radius if undetected: <users/data/revenue impact>

### Decision
- [ ] GO (risks acceptable)
- [ ] GO with mitigations: <list>
- [ ] NO-GO (defer or redesign)
```

---

## Devil's Advocate variant (for Complicated+ domains)

For work in Complicated, Complex, or Chaotic Cynefin domains, **add a Devil's Advocate step**:

1. Dispatch a second agent (or take 5 min yourself in a different "hat") with the explicit prompt:
   > "Find three reasons this plan will fail."
2. Merge findings into the premortem before dispatch.
3. If Devil's Advocate and primary plan disagree on more than 2 causes, treat this as a classification signal — you may be in Complex when you thought you were in Complicated. Reclassify.

---

## Anti-patterns

- **Rubber-stamp premortem** — filling it in without actually imagining the failure. Signal: all "causes" are generic ("insufficient testing", "tight deadline"). Fix: force concrete, feature-specific scenarios.
- **Only one cause** — indicates low effort, not low risk. Force ≥ 5.
- **Rollback budget unfilled** — "we'll figure it out" is not a budget. Force explicit SLO.
- **Skipped because "obvious"** — obvious is a System 1 trap. If Cynefin tag ≠ Clear, run it.

---

## Evidence from the literature

- Klein (HBR 2007): field studies show prospective hindsight surfaces ~30% more risks than standard risk analysis.
- Mitchell, Russo, Pennington (1989, JBDM): groups engaging in prospective hindsight generate 25-30% more and richer reasons.
- NASA / DoD use standardized premortem for mission-critical launches.
- Amazon engineering: PR-FAQ + anticipated failure modes are documented before any new-service dispatch.

The 5-minute cost is dwarfed by the median cost of skipping it.
