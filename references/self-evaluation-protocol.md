# PM Self-Evaluation Protocol — CALM Bias Check + Reflexion Ritual

> Source: CALM (ICLR 2025) — 12 documented biases in LLM-as-judge, with 64-68% alignment to human ground truth.
> The PM **is** the judge in AI-orchestration. These biases apply to the PM.
> Additional source: Shinn et al, *Reflexion* (NeurIPS 2023) — iterated self-critique outperforms one-shot.

---

## When to run

| Trigger | Run protocol? |
|---|---|
| After any session-completion acceptance | Yes |
| Before dispatching corrective action | Yes |
| Weekly PM retrospective | Yes (with aggregation) |
| When forming a judgment about a session/person | **Especially yes** |

---

## The 12-bias checklist (CALM)

Run down the list. If **any** check trips, pause and re-evaluate with evidence.

| # | Bias | Self-check question |
|---|---|---|
| 1 | **Position bias** | Did I accept the first option/plan/report because it came first, not because it was best? |
| 2 | **Verbosity bias** | Am I rating a longer report / PR description as better without checking content density? |
| 3 | **Self-enhancement bias** | Am I reinforcing my own prior judgment rather than re-examining? |
| 4 | **Familiarity bias** | Am I giving this session more trust because it's "the usual one"? |
| 5 | **Authority bias** | Am I deferring to a senior agent / tool without independent check? |
| 6 | **Bandwagon bias** | Am I agreeing because everyone else is, not because the evidence is there? |
| 7 | **Sentence-order bias** | Is my judgment anchored on the opening framing of the report? |
| 8 | **Compassion bias** | Am I lowering the bar because the session "tried hard"? |
| 9 | **Egocentric bias** | Am I centering my own comfort / preferred narrative over the evidence? |
| 10 | **Distraction bias** | Has an adjacent concern (unrelated stressor) degraded the quality of this judgment? |
| 11 | **Fallacy oversight** | Is the argument itself fallacious (circular, equivocation, false cause) and I accepted the conclusion? |
| 12 | **Length-bias** | Is brevity being mistaken for insufficient work (mirror of #2)? |

---

## Reflexion ritual (2 min after each session)

After each completed session or intervention, answer **4 questions in writing**:

1. **What did I miss?** — facts I did not check; assumptions I did not question.
2. **What am I anchored on?** — the first framing of this problem; the last similar failure.
3. **What evidence did I skip?** — logs / files / git state I referenced by prose instead of reading.
4. **What would change my mind?** — the observation that would flip my judgment. If none, I'm not reasoning.

Save outputs to a reflexion log (memo / issue comment / private journal). Weekly read-back for pattern detection.

---

## Weekly aggregation

Every 7 days, scan the reflexion log and flag:
- Which bias did I trip most often? (dominant bias)
- Which kind of session did I mis-judge most? (blind-spot domain)
- Which principle was violated most often? (weakest discipline)

Act on the **top-1** in the following week, not the full list. Diffuse remediation fails.

---

## When biased judgment has already shipped

You acted on a biased call and it became visible. Protocol:

1. **Acknowledge specifically** — name the bias, not "I made a mistake." Example: "I applied authority bias to Session X's status report and skipped `git log` cross-check; the report was partially wrong."
2. **Re-issue the judgment** with evidence. Don't delete the original (audit trail matters).
3. **Add the case to reflexion log** — future blind-spot avoidance.
4. **Do not over-compensate** — one biased call does not justify systemic rewrite.

---

## Anti-patterns

- **Skipping because "I'm tired"** — tiredness is when bias is highest, not when audit is optional.
- **Batch-skipping the 12-bias list** — pick 4 at random if time-constrained; never skip all.
- **Turning the log into a ritual diary without reading it back** — the weekly read-back is where the learning happens.
- **Using the log to punish yourself** — the goal is blind-spot shrinkage, not shame; per P5 (Just Culture), keep it blameless even with yourself.

---

## Evidence from the literature

- CALM (ICLR 2025): 12 biases measured across 6 LLM judges; alignment with human ground truth ranges 64-68%. The 30%+ mis-alignment is predictable and patternable — the checklist targets the dominant patterns.
- Reflexion (NeurIPS 2023): iterative self-critique beats one-shot on AlfWorld, HotpotQA, HumanEval tasks by 10-20 percentage points.
- Dual-process theory (Kahneman 2011): explicit slow-thinking checklists counter System 1 drift.
