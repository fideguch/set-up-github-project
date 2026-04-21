# Cynefin Domain Discrimination — PM Orchestration Guide

> Before any non-trivial orchestration decision, classify the domain.
> Source: Snowden & Boone, *A Leader's Framework for Decision Making* (HBR 2007). Cynefin, IBM Systems Journal 2003.
> Purpose: stop over-engineering Clear problems and stop applying best practice to Complex ones.

## The five domains

| Domain | Cause-effect relationship | Response | Example in AI-assisted PM work |
|---|---|---|---|
| **Clear** (Obvious) | Known, visible | **Sense → Categorize → Respond** (best practice) | Renaming a typo; bumping a version; applying a lint rule |
| **Complicated** | Known, not visible | **Sense → Analyze → Respond** (good practice, experts help) | Refactoring a module; optimizing a query; migrating a schema |
| **Complex** | Known only in retrospect | **Probe → Sense → Respond** (emergent practice, safe-to-fail experiments) | New feature with unclear user adoption; AI orchestration process change; pricing change |
| **Chaotic** | No discernible cause | **Act → Sense → Respond** (stabilize first, novel practice) | Production incident; data loss; security breach mid-launch |
| **Disorder** | Domain unknown | Break into smaller problems until you can classify each | "I feel stuck" — biggest trap |

## PM mis-classification anti-patterns

**Treating Complex as Complicated** — using experts and analysis when the problem is emergent. You get confident-sounding plans that fail because user/market behavior is not deducible from first principles.
*Example*: new onboarding flow dispatched as multi-agent Full gate build, when the actual question is "will users even start it?"
*Fix*: reclassify as Complex → run safe-to-fail probe (landing page test, wizard-of-oz, fake door).

**Treating Clear as Complex** — over-engineering trivial problems because a heavy process "feels safer." Burns error budget on ritual.
*Example*: running forge_ace Full + gatekeeper + postmortem for a typo fix.
*Fix*: reclassify as Clear → direct implementation + post-review.

**Treating Chaotic as Complicated** — analyzing during a fire. You collect data while the incident spreads.
*Fix*: Act first to stabilize (rollback, feature-flag off, traffic shed). Analyze after.

**Staying in Disorder** — no classification at all, just momentum. The most common and most expensive failure mode.
*Fix*: force a domain tag before any dispatch > N hours of work.

## Decision tree — 60 seconds before dispatch

```
1. Is the outcome predictable given the inputs?
   Yes → Clear or Complicated
   No  → Complex or Chaotic
   Unknown → Disorder → break into smaller problems

2. If predictable:
   Solution is obvious to any practitioner? → Clear (best practice)
   Solution needs expert analysis?           → Complicated (good practice)

3. If not predictable:
   System is stable enough to experiment? → Complex (probe)
   System is collapsing right now?        → Chaotic (act to stabilize)
```

## Orchestration implications

| Domain | Orchestration approach | Gates | Rollback readiness |
|---|---|---|---|
| Clear | Direct implementation + post-review | Minimal (lint + test) | Trivial |
| Complicated | Planner → Writer → single reviewer | Standard (forge_ace Standard is appropriate) | Moderate (5-30 min) |
| Complex | Safe-to-fail experiment, small blast radius, feature flag | Light (can't plan-gate the unknown) | Must be < 1 hour |
| Chaotic | Stabilize first (rollback / shed traffic), dispatch later | None until stable | Must be instant |
| Disorder | Don't dispatch; decompose | N/A | N/A |

## Reversibility check

Every domain classification must carry: **"what would change my mind?"**
- Clear → if I observe any non-obvious behavior, reclassify up.
- Complicated → if expert disagreement persists > 2 rounds, reclassify to Complex.
- Complex → if a probe reveals stable cause-effect, reclassify down.
- Chaotic → as soon as stabilized, reclassify to discover what actually happened.

## Anti-dogma clause

Cynefin itself is a heuristic, not a law. Use it to avoid the two largest orchestration errors (over-engineering Clear, under-acting on Chaotic). Do not fetishize classification rituals; they are a tool, not the goal.
