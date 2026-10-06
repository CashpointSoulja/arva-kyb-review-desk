# Metrics

All operational figures below are **modelled** from stated assumptions applied to the 14-case Northbank queue. They are hypotheses for a pilot to test, not results. Eval figures are **computed** by the engine on the golden set.

## North star

**Median time from application received to a defensible decision.** "Defensible" means the decision has a named analyst, a confirmed tier and a rationale in the audit trail. It captures both speed (the customer's problem) and defensibility (the bank's problem). Speed alone could be gamed by approving faster.

## Shown on the Metrics page

| Metric | Definition | Current value | Source |
|---|---|---|---|
| Cost per review | (avg desk minutes per case / 60) x analyst cost + engine cost per case | £29.72 vs £76.00 manual (−61%) | Model, `app/engine/metrics.js` |
| Analyst time saved | (manual minutes x cases) − sum of desk minutes by tier | 13.6 hours on this queue | Model |
| Straight-through rate | Cases recommended for STP that an analyst approved without changing the tier, over cases decided | 4 of 14 recommended (29%); live count as decisions are made | Engine + session |
| Escalation precision | Of cases the engine tiers high, the share expected high | 100% (8/8) on the golden set; recall 89% (8/9) | Eval |

### Why the modelled saving is 61%, not the ~85% Arva cites

The Northbank queue is deliberately risk-heavy: 10 of 14 cases are medium or high, because the demo has to show the hard cases. High-tier cases still take 70 minutes of analyst time in the model. With a more typical book where most applications are low risk, the same assumptions give a much larger saving. That is the point to test in a pilot: the saving depends on the tier mix and the STP confirmation time, so measure both.

## Assumptions to test

| Input | Value | How to replace it |
|---|---|---|
| Fully loaded analyst cost | £48/h | Finance |
| Manual review time | 95 min | Time-and-motion sample of 50 current cases |
| Desk time, low / medium / high | 6 / 28 / 70 min | Instrument the desk during a shadow pilot |
| Engine and data cost per case | £0.35 | Data vendor contracts |

## Guardrails (must not get worse)

| Guardrail | Why | Threshold before widening STP |
|---|---|---|
| Golden-set catch rate | A drop means the rules regressed | ≥ 95%, no regression between engine versions |
| Missed high-tier cases | The costly error | 0 unexplained; every miss documented like G-19 |
| Tier override rate | Rising overrides mean rules and analysts disagree | Review rules if > 15% of cases |
| Discount rate per check | A check discounted most of the time is noise | Review any check discounted on > 50% of its flags |
| Auto-approvals | Policy | Always 0 |

## Leading indicators for a pilot

- Evidence chips opened per case (are analysts verifying or rubber-stamping?)
- Time from case open to tier confirmation, by tier
- Share of "request more information" that cite a specific finding
