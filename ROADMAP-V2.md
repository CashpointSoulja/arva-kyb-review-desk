# Roadmap v2

Sequencing principle: earn trust in straight-through on low tier first, then widen what the agent handles. Every rule change goes through the Eval lab before it ships.

## Now (next 6 weeks): fix what v1 is known to get wrong

| Item | Why now | Trade-off |
|---|---|---|
| Screen previous names in SCR-01/03 (fixes G-19) | The one miss that produced a low tier on a fraud case | More false positives on generic old names. Ship with new golden cases for that, weight by how recently the name changed |
| Serviced-office allow-list for DIR-03 (fixes G-08) | Removes a click on every co-working applicant | Allow-list needs an owner and quarterly review |
| Shadow pilot with 3 analysts on real historical cases | Replace modelled times with measured ones | Needs a data-sharing agreement and a sandbox |
| Golden set relabelled by analysts who did not write the rules | The current eval is author-labelled | Slower to build, but it is the only honest number |

## Next (quarter): widen carefully

- **Live data adapters** behind the same evidence model (register API, list vendor, media vendor). Each adapter has to produce source lines the chips can point to, or it does not ship.
- **Request-for-information templates** generated from the specific findings (for example "utility bill dated 2026-05-02 is older than 3 months").
- **Four-eyes option** for medium tier, configurable per bank policy.
- **QA sampling view**: random and risk-weighted samples of decided cases with overrides highlighted.

## Later: once low-tier STP is trusted

- Ongoing monitoring: re-run checks on register filings (new PSC, dissolution notices) for onboarded customers.
- Cross-customer network view: shared directors and addresses across the book.
- Policy simulator: replay last quarter's cases under a proposed rule change and show how tiers would move.

## What I would not build yet

| Not yet | Why |
|---|---|
| Auto-approval of any tier | Trust is earned with measured catch rates on real data, not synthetic ones. One G-19 in production undoes it |
| Generated narrative summaries of the case | Every sentence on the desk is traceable to a rule today. A narrative layer adds a new failure mode (plausible but unsupported text) before the basics are proven |
| A numeric risk score | Scores invite threshold-gaming and are hard to explain to a regulator. Named factors and a published rule are slower to tune but defensible |
| Analyst productivity leaderboards | They reward speed over care, which is the wrong incentive in financial crime |
| Bespoke rule builder UI for banks | Policy changes are rare and high-stakes. Configure with the bank and eval first; self-serve can wait until the eval gate is automated |
