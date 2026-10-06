# PRD: KYB Review Desk

Status: concept · Owner: Ayo Ahmed · Scenario: Northbank, a fictional UK fintech onboarding business customers

## 1. Problem

Northbank's onboarding analysts review every business application by hand. For each one they open the company register, compare it with the application form and the uploaded documents, map the ownership chain to find the real owners, and run every director and owner through sanctions, PEP and adverse-media screening. Three things go wrong:

1. **Slow.** Most of the time goes on gathering and cross-referencing, not judgement. Clean applications wait in the same queue as risky ones, and the customer waits with them.
2. **Inconsistent.** Two analysts reading the same name match or the same ownership chart reach different conclusions, and the reasoning is often only in their heads.
3. **Hard to defend.** When a regulator, auditor or internal QA asks why a business was approved, the answer has to be rebuilt from screenshots and notes.

## 2. Who it is for

| User | Need |
|---|---|
| Onboarding analyst (primary) | Get to the judgement call fast, trust the pre-work, leave a clean record |
| Team lead / QA | See overrides and discounts, spot drift between analysts |
| MLRO / compliance | Policy applied the same way every time, decisions explainable after the fact |
| Regulator or auditor (reader) | Replay any decision from the record alone |

## 3. Goals and non-goals

**Goals**
- Every finding carries the rule that fired and a link to the exact source line.
- Low-risk cases are recommended for straight-through, but a named analyst confirms every approval.
- Risk tiers are explained by a published rule and a list of contributing checks, not a score.
- The audit trail is complete enough that a reader can replay a decision without the analyst.
- The engine is measured against a golden set, and its misses are visible.

**Non-goals for v1** (see [ROADMAP-V2](ROADMAP-V2.md))
- Auto-approval of any tier.
- Live data sources. v1 uses fixed reference files so behaviour is reproducible.
- Ongoing monitoring after onboarding.
- Free-text summarisation of the case. Every sentence on screen comes from a rule.
- Ownership graphs across customers (network analysis).

## 4. User flow

1. **Queue.** The analyst sees open applications with recommended tier, the flagged check IDs, status, SLA clock and owner. Overdue and high-tier cases stand out.
2. **Case file.** Pre-check summary, then flagged checks first, each with its rule text, findings and evidence chips. Passed checks are listed with their evidence too, so a clean case is visibly clean rather than silently clean.
3. **Evidence.** A chip opens a drawer with the whole source (register entry, document, list extract or article) and the cited line highlighted. Opening evidence is logged.
4. **Discount (optional).** An analyst can discount a flagged finding with a 20+ character reason. The tier recalculates. Hard stops (REG-01 dissolved, DOC-02 certificate number mismatch) cannot be discounted.
5. **Tier.** Confirm the recommended tier, or upgrade or downgrade it with a rationale.
6. **Disposition.** Approve, request more information, or escalate to EDD, with a rationale. Approve is blocked for high tier and for any open hard stop.
7. **Audit.** Every step is in the trail, exportable as CSV or JSON.

## 5. Requirements

| ID | Requirement | Acceptance |
|---|---|---|
| R1 | 20 deterministic checks across registry, directors, ownership, screening, documents and sector | Each returns status, severity, summary, rule text and findings with evidence anchors. Unit tested |
| R2 | Every evidence anchor resolves to a source line | Test asserts this for all 14 applications |
| R3 | Name matching explains itself | Strength bands plus "for" and "against" reasons. Test asserts no percentage in reasons |
| R4 | Tier rule is published and monotonic | Adding a flag never lowers the tier (tested) |
| R5 | No auto-approval | Approve requires confirmed tier, rationale, not high tier, no open hard stop (tested) |
| R6 | Audit completeness | Agent rows for every check and the tier; analyst rows for open, evidence view, discount, tier, disposition, export |
| R7 | Export | CSV with RFC 4180 quoting, JSON with engine version and scope |
| R8 | Eval lab | 24 golden cases computed live; catch rate, false positives, tier agreement, escalation precision; at least one miss shown |
| R9 | Responsive | 390, 834 and 1440px with no horizontal page overflow and no console errors |

## 6. Check catalogue

| ID | Check | Fires when | Severity |
|---|---|---|---|
| REG-01 | Registry status | Not active | High, hard stop |
| REG-02 | Dormant accounts vs trading claim | Latest accounts dormant but applicant claims trading (or no accounts yet) | Medium (low) |
| REG-03 | Incorporation age vs trading claim | Claimed years exceed company age by more than 1 | Medium |
| REG-04 | Dormant-then-active | Dormant accounts in 24 months + officer change in 12 months + volume ≥ £100k/month | High |
| DIR-01 | Disqualified director | Possible (flag) or strong (fail) match to the disqualified register | High |
| DIR-02 | Dissolved-company history | 2 (low) or 3+ (medium) other companies dissolved in 36 months | Low / medium |
| DIR-03 | Shared registered address | 20+ companies at the address (low); officer cluster of 5+ (medium) | Low / medium |
| DIR-04 | Declared vs registered directors | Lists differ | Medium |
| OWN-01 | Ownership sums | Holdings at any level do not total 100% | Medium |
| OWN-02 | Layered ownership | 3+ corporate layers, or 2+ with a non-UK layer | Medium |
| OWN-03 | Bearer-share and nominee risk | Bearer shares, nominee holder or bearer-risk jurisdiction in the chain | High |
| OWN-04 | UBO resolution | Effective 25%+ owner not declared, or declared % off by more than 1 point | Medium |
| SCR-01 | Sanctions | Possible match flags, strong match fails | High |
| SCR-02 | PEP | Possible or strong match | Medium |
| SCR-03 | Adverse media | Article on a subject matching the company or an officer, by category | By category |
| DOC-01..03 | Name, number, address consistency | Application, register and documents disagree (number mismatch is a hard stop) | Medium / high / low |
| DOC-04 | Document recency | Statement or proof of address 3+ months old | Low |
| BUS-01 | Sector risk | SIC in the high-risk sector table | Medium |

## 7. Tier rule

High if any high-severity flag, or 3+ medium flags. Medium if any medium flag, or 2+ low flags. Otherwise low. Straight-through is recommended only for low tier with no hard stops. The rule is printed in the tier panel and stored with each decision through the engine version.

## 8. Risks and trade-offs

| Risk | Mitigation in v1 |
|---|---|
| Analysts rubber-stamp STP recommendations | Approval still requires a written rationale; override and discount rates are tracked as guardrails |
| Rules are too blunt (co-working false positive, G-08) | Low severity alone cannot move the tier; allow-list sequenced in v2 |
| Name matching misses transliterations | Variant groups plus edit-distance; G-19 shows the known previous-name gap |
| A deterministic engine cannot read nuance in media | Adverse media is matched on subject and category only, and every hit is shown with its paragraph so the analyst reads it |
| Over-trusting the tier | The tier is a recommendation with factors listed, never a decision |

## 9. Success measures

See [METRICS.md](METRICS.md). North star: median time from application to a defensible decision. Guardrails: catch rate on the golden set, missed high-tier cases, override rate, discount rate.
