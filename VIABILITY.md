# Viability: how this maps to Arva

## Which Arva workflow it extends

Arva deploys agents for critical banking operations. Its KYB agent handles low and medium-risk manual work in real time during onboarding: registry lookups, document verification, sanctions and adverse-media screening, AML reviews. The public claim is roughly an 85% cut in operational cost for banks and fintechs.

An agent that does the work still needs a surface where a human accepts, challenges or escalates it, and where the bank proves to its regulator what happened. That surface is this concept: the analyst-facing review desk on top of the KYB agent's output.

| Arva capability (public) | Desk feature |
|---|---|
| Registry lookups | REG-01..04 with the register entry as the evidence source |
| Document verification | DOC-01..04, with the document line cited |
| Sanctions and adverse-media screening | SCR-01..03 with for/against reasoning per match |
| Low/medium-risk work handled in real time | Straight-through recommendation for low tier, human confirmation kept |
| Adaptive, policy-based decisioning and explainable decisions (site messaging) | Published tier rule, contributing factors, versioned engine, hard stops |
| Governance | Audit trail with rule ID, evidence anchors and engine version on every row |

## Why a bank buys this layer, not just the agent

1. **Model risk and regulator expectations.** UK and EU supervisors expect firms to explain automated decisions and keep a human accountable. A desk that shows the rule and evidence is what lets compliance sign off on the agent at all.
2. **Adoption.** Analysts adopt tools that save them time on the boring 80% and give them better material for the hard 20%. Evidence chips and explained matches do both.
3. **Expansion.** Once the bank trusts the desk on low tier, the same surface can take medium-tier cases, then periodic reviews and lending checks. That is the land-and-expand path for an agent platform.

## Adaptive decisioning

The tier rule here is fixed, and that is deliberate for v1. The path to adaptive decisioning is the data the desk already captures: every override, discount and rationale is a labelled example of where the policy and the analyst disagree. Aggregated, that tells the bank which checks are noise (discount rate), which tiers are wrong (override rate) and where to tighten or loosen STP, with the Eval lab as the regression gate before any rule change ships.

## Unit economics (modelled)

On the risk-heavy demo queue the model shows £29.72 per review against £76 manual. The lever is the low-tier confirmation time (6 minutes in the model): a bank whose book is mostly low risk sees most of its saving there, which is consistent with the order of magnitude Arva cites. See [METRICS.md](METRICS.md) for assumptions.

## What would make this not viable

- If analysts do not trust the evidence and redo the checks anyway (watch evidence-chip opens and confirmation times in a pilot).
- If the false-positive rate of near-match screening at real scale swamps the queue (needs a real-data eval, not the synthetic one).
- If the bank's policy requires dual control on every approval, the STP saving shrinks and the pitch becomes consistency and auditability rather than cost.
