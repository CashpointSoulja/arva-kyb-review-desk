# Test plan

## 1. Unit tests (`npm test`, node:test, no dependencies)

| File | Covers |
|---|---|
| `tests/normalise.test.js` | Diacritics, punctuation, honorifics, company suffixes, company number padding, postcodes, address keys, month and year arithmetic |
| `tests/match.test.js` | Edit distance, variant groups, person match strength bands, surname-first lists, common-surname penalty, missing DOB, no percentages in reasons, company name matching |
| `tests/checks-registry-directors.test.js` | REG-01..04 and DIR-01..04 pass and fire conditions, severities, thresholds, resigned-officer handling, evidence anchors |
| `tests/checks-ownership-screening-docs.test.js` | OWN-01..04 including nested percentages and bearer/nominee flags; SCR-01..03 including weak matches shown but not flagged, UBO screening, article paragraph citation, the previous-name gap; DOC-01..04; BUS-01 |
| `tests/system.test.js` | 20 unique checks with rules; 14 apps and 24 golden cases; every evidence anchor resolves for every app; every flag has evidence; determinism; no mutation; tier rule cases and monotonicity; tier, disposition and discount guards; audit rows, ordering, CSV quoting, JSON round-trip; eval harness (miss and false positive present); cost model and STP counting |

Target: 100+ tests. Actual: see [TEST-RESULTS.md](TEST-RESULTS.md).

## 2. Browser checks (Playwright, Chromium)

For each width 390, 834 and 1440 and each route (`#/queue`, `#/case/NB-24107`, `#/audit`, `#/evals`, `#/metrics`, `#/about`):

- `document.documentElement.scrollWidth <= clientWidth` (no horizontal page overflow)
- No console errors or warnings and no page errors
- Screenshot captured and inspected

## 3. Flow checks

1. Open NB-24107, open the SCR-01 sanctions chip: drawer shows the list entry highlighted.
2. Confirm tier HIGH, choose Approve: blocked with "High-tier applications cannot be approved from the desk".
3. Escalate to EDD with rationale: disposition recorded, status updates in the queue.
4. On NB-24101 select Medium without rationale: blocked with the rationale message.
5. Audit trail: export CSV, file downloads, row count equals the on-screen count, analyst rows present.
6. NB-24110 (dissolved): REG-01 shows no discount option; approve blocked.

## 4. Content checks

- Footer text present on every route.
- Literal term grep across the repo, including git history (see TEST-RESULTS).
