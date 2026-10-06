# Test results

Run on 2026-10-06, Node v22.23.3, Chromium (Playwright). Outputs below are pasted from the actual runs.

## Unit tests: 191 / 191 passing

```
$ npm test
1..191
# tests 191
# suites 0
# pass 191
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 112.740814
```

5 files: normalise, match, registry and director checks, ownership/screening/document checks, system (tiering, guards, audit, export, evals, metrics).

## Eval harness (kyb-rules 1.4.0)

| Measure | Result |
|---|---|
| Catch rate | 95.8% (23 / 24 seeded signals) |
| False-positive flags | 1 (G-08, serviced office) |
| Tier agreement | 23 / 24 |
| Escalation precision | 100% (8 / 8) |
| Escalation recall | 89% (8 / 9) |
| Honest miss | G-19, adverse media under a previous company name. Shown on screen |

## Browser checks: 24 / 24 route x width combinations without horizontal overflow, 0 console errors

```
390px #/queue            scrollWidth=390 clientWidth=390 no-overflow footer=true
390px #/case/NB-24107    scrollWidth=390 clientWidth=390 no-overflow footer=true
390px #/audit            scrollWidth=390 clientWidth=390 no-overflow footer=true
390px #/evals            scrollWidth=390 clientWidth=390 no-overflow footer=true
390px #/metrics          scrollWidth=390 clientWidth=390 no-overflow footer=true
390px #/about            scrollWidth=390 clientWidth=390 no-overflow footer=true
390px #/case/NB-24105    scrollWidth=390 clientWidth=390 no-overflow footer=true
390px #/case/NB-24110    scrollWidth=390 clientWidth=390 no-overflow footer=true
390px console errors/warnings: 0
834px #/queue            scrollWidth=834 clientWidth=834 no-overflow footer=true
834px #/case/NB-24107    scrollWidth=834 clientWidth=834 no-overflow footer=true
834px #/audit            scrollWidth=834 clientWidth=834 no-overflow footer=true
834px #/evals            scrollWidth=834 clientWidth=834 no-overflow footer=true
834px #/metrics          scrollWidth=834 clientWidth=834 no-overflow footer=true
834px #/about            scrollWidth=834 clientWidth=834 no-overflow footer=true
834px #/case/NB-24105    scrollWidth=834 clientWidth=834 no-overflow footer=true
834px #/case/NB-24110    scrollWidth=834 clientWidth=834 no-overflow footer=true
834px console errors/warnings: 0
1440px #/queue            scrollWidth=1440 clientWidth=1440 no-overflow footer=true
1440px #/case/NB-24107    scrollWidth=1440 clientWidth=1440 no-overflow footer=true
1440px #/audit            scrollWidth=1440 clientWidth=1440 no-overflow footer=true
1440px #/evals            scrollWidth=1440 clientWidth=1440 no-overflow footer=true
1440px #/metrics          scrollWidth=1440 clientWidth=1440 no-overflow footer=true
1440px #/about            scrollWidth=1440 clientWidth=1440 no-overflow footer=true
1440px #/case/NB-24105    scrollWidth=1440 clientWidth=1440 no-overflow footer=true
1440px #/case/NB-24110    scrollWidth=1440 clientWidth=1440 no-overflow footer=true
1440px console errors/warnings: 0
NB-24110 REG-01 discount link present: 0
NB-24110 approve disabled: true
NB-24110 approve reason: Approve Cannot approve: REG-01 is a hard stop that cannot be discounted
```

One defect found and fixed during this run: at 390px, `#/case/NB-24105` (four-layer ownership) overflowed by 12px because the case-file grid columns had no `min-width: 0`. Fixed in `assets/styles.css`, re-run above.

## Flow checks

| Flow | Result |
|---|---|
| NB-24107: open SCR-01 sanctions chip | Drawer opened on "Consolidated sanctions list (synthetic extract)" with SL-40217 highlighted |
| NB-24107: confirm HIGH, approve | Approve disabled: "High-tier applications cannot be approved from the desk; escalate to EDD" |
| NB-24107: escalate to EDD with rationale | Recorded; audit rows `tier_confirmed` and `disposition_recorded` written |
| NB-24101: change tier to Medium with no rationale | Blocked: "Upgrading or downgrading the tier needs a rationale of at least 20 characters" |
| Audit: Export CSV | Downloaded `kyb-audit-all-cases-*.csv`, 313 data rows + header, matching the 313-row count shown on screen including analyst rows |
| NB-24110 (dissolved) | REG-01 has no discount option; approve disabled: "REG-01 is a hard stop that cannot be discounted" |

## Screenshots

`docs/screenshots/{390,834,1440}-{queue,case,evals}.png`
