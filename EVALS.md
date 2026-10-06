# Evals

## Method

`app/data/golden.js` holds 24 synthetic applications. Each seeds zero or more known risk signals and states the tier a careful analyst would assign. `app/engine/evals.js` runs the same `assess()` the queue uses and compares:

- **Catch rate:** seeded signals the engine flagged, over seeded signals.
- **False positives:** flags raised that were not seeded.
- **Tier agreement:** engine tier equals expected tier.
- **Escalation precision / recall:** of cases the engine tiers high, how many should be; of cases that should be high, how many it caught.

The Eval lab computes all of this in the browser on page load, so the numbers on screen are the engine's, not typed in. The same harness is unit tested.

## Results (kyb-rules 1.4.0)

| Measure | Result |
|---|---|
| Cases | 24 (4 clean, 20 with seeded signals) |
| Catch rate | **95.8%** (23 of 24 seeded signals) |
| False-positive flags | 1 (G-08) |
| Tier agreement | 23 / 24 |
| Escalation precision | 100% (8 of 8 escalated were expected high) |
| Escalation recall | 89% (8 of 9 expected-high cases escalated) |

## The honest miss: G-19

*Lumen Harbour Ltd*, previously registered as *Brightwater Trading Ltd*. A synthetic fraud article (M-3342) names Brightwater Trading and says the company later changed its name. SCR-03 screens only the current legal and trading names, so nothing fired and the engine tiered the case **low** when it should be **high**.

This is left in on purpose and shown on the Eval lab screen. Fixing it means screening every previous name, which also widens the net for false positives (old names are often generic). That change needs its own eval run with new false-positive cases before it ships, so it sits in [ROADMAP-V2](ROADMAP-V2.md) rather than being tuned into v1 to make the number 100%.

Why it matters even though it is one case: an STP-eligible low tier on a fraud case is exactly the failure that would end trust in straight-through. It is why STP still requires analyst confirmation and why the "previous names" line is shown in the case file's register section.

## The known false positive: G-08

A clean company at a serviced office with 31 registered tenants. DIR-03 raises a low flag. It does not change the tier (one low flag stays low), but it costs a click on every co-working applicant. Proposed fix: a verified allow-list of serviced-office addresses, reviewed quarterly.

## Coverage by signal

| Check | Golden cases |
|---|---|
| REG-01..04 | G-04, G-05, G-06, G-07 |
| DIR-01..04 | G-09, G-10, G-11 (G-08 is the DIR-03 false positive) |
| OWN-01..04 | G-12, G-13, G-14, G-15, G-24 |
| SCR-01..03 | G-16, G-17, G-18, G-19 (miss), G-24 |
| DOC-01..04 | G-20, G-21, G-22 |
| BUS-01 | G-23, G-24 |
| Clean controls | G-01, G-02, G-03 (common director name, must not flag), G-08 |

## What this eval does not tell you

- Real-world match quality. Every list and article is synthetic and the golden set was written by the same person who wrote the rules. A production eval needs cases labelled by analysts who did not write the rules, drawn from real historical decisions.
- Rates at scale. 24 cases is enough to catch regressions, not to estimate a production false-positive rate.

## How to run

```bash
npm test                          # includes the eval assertions
open http://localhost:8080/#/evals
```
