# KYB Review Desk

**Live:** https://cashpointsoulja.github.io/arva-kyb-review-desk/
**Walkthrough video:** [`video/kyb-review-desk-walkthrough.mp4`](video/kyb-review-desk-walkthrough.mp4) (1080x1920)

Independent concept by Ayo Ahmed. Not affiliated with Arva AI. All companies, people, registry entries and media are synthetic.

## Explain it like I'm five

When a business opens a bank account, the bank has to check it is real, find out who really owns it, and make sure nobody involved is a criminal or on a sanctions list. Today a person does every one of those checks by hand, for every business, even the obviously fine ones.

This desk does the checking first and shows its working. Every finding says which rule produced it and links to the exact line it came from. It suggests how risky the business is and why. A person still makes the decision, and everything they do is written down so anyone can check it later.

## The 30-second version

KYB (know your business) review is slow because the work is scattered across a company register, uploaded documents, ownership charts and screening lists, and it is expensive because every case gets the same manual path. Arva's KYB agent already does this pre-work for banks and fintechs. This concept is the analyst's side of that: a review desk where the agent's findings arrive with evidence attached, risk tiers are explained rather than scored, nothing approves itself, and the audit trail is something a regulator could read.

## What is in the build

| Area | What it does | Where |
|---|---|---|
| Review queue | 14 synthetic Northbank applications with recommended tier, flags, status, live SLA clock, analyst | `#/queue` |
| Agent case file | Register entry, officers, ownership tree with effective percentages, documents, and all 20 checks. Every finding has evidence chips that open the exact source line | `#/case/NB-24107` |
| Check engine | 20 deterministic rules in code (`app/engine/checks.js`), each with its rule text shown on screen | `app/engine/` |
| Screening reasoning | Name matches show "why it matched" and "why it might be wrong", banded as strong / possible / weak, never a bare percentage | SCR-01, SCR-02, SCR-03, DIR-01 |
| Risk tiering | Recommended tier with contributing factors and the published tier rule. Analyst confirms, upgrades or downgrades (rationale required to change) | right rail of the case file |
| Review flow | Approve / request information / escalate to EDD. Guards: tier must be confirmed first, high tier cannot be approved, hard stops cannot be discounted | right rail |
| Audit trail | Every check run, tier recommendation, case open, evidence view, discount, override and decision, timestamped with rule ID, evidence anchors and engine version. CSV and JSON export | `#/audit` |
| Eval lab | 24 golden cases. Catch rate 95.8% (23/24), 1 false positive, 1 honest miss left on screen | `#/evals` |
| Metrics | Modelled cost per review, analyst time saved, straight-through rate, escalation precision, plus guardrails | `#/metrics` |

## Run it locally

No build step and no dependencies.

```bash
python3 -m http.server 8080   # then open http://localhost:8080
npm test                      # 191 unit tests (Node 20+)
node scripts/test-report.mjs  # runs tests and refreshes the count shown in the Eval lab
```

## Repo map

```
index.html, assets/          static shell, styles, self-hosted DM Sans + Fragment Mono, Arva logo
app/engine/                  normalise, match, checks, tiering, sources, audit, evals, metrics
app/data/                    synthetic reference lists, 14 applications, 24 golden cases
app/ui/main.js               the desk (hash-routed, state in localStorage)
tests/                       node:test unit tests
design/                      BRAND.md, VISUAL-GUIDE.md, captured screenshots, logo assets
video/                       walkthrough MP4 and SCRIPT.md
docs/screenshots/            390 / 834 / 1440 captures of the shipped UI
```

## Product docs

[PRD](PRD.md) · [Five whys](FIVE-WHYS.md) · [Jobs to be done](JTBD.md) · [Metrics](METRICS.md) · [Evals](EVALS.md) · [Test plan](TEST-PLAN.md) · [Test results](TEST-RESULTS.md) · [Viability](VIABILITY.md) · [Roadmap v2](ROADMAP-V2.md) · [Brand](design/BRAND.md) · [Visual guide](design/VISUAL-GUIDE.md)

## Honest limits

- Everything is synthetic and runs in the browser. There are no live register, sanctions or media lookups, so results are reproducible but say nothing about real-world match quality.
- Cost and time figures are a model with stated assumptions, not measurements.
- The engine misses adverse media filed under a company's previous name (golden case G-19). That miss is shown on screen and the fix is sequenced in the roadmap.
- The Arva name, logo and visual language are used to show the concept in context. The copy is original.
