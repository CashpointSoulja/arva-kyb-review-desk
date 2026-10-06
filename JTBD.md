# Jobs to be done

## Onboarding analyst

> When a business application lands in my queue, I want to see what has already been checked and what actually needs my judgement, so I can make a defensible decision without redoing the legwork.

- **Functional:** confirm the company exists and is active, identify the real owners, clear every name match, check the documents agree.
- **Emotional:** not be the person who approved the shell company. Not waste an hour on a bakery.
- **Social:** have my reasoning stand up when QA or a senior reviews it.
- **Desk answer:** flagged checks first, rule shown, one click to the source line, reasons for and against each name match, a one-line rationale to close a clean case.

## Team lead / QA reviewer

> When I sample decisions, I want to see what the analyst overrode or discounted and why, so I can coach the team and catch drift before it becomes a finding.

- **Desk answer:** discounts and tier changes require a rationale and are separate event types in the audit trail; override and discount counts on the Metrics page.

## MLRO / head of compliance

> When I set onboarding policy, I want it applied the same way every time and to know how often the automation misses, so I can decide how much to rely on it.

- **Desk answer:** deterministic rules with versioning (`kyb-rules 1.4.0` on every audit row), hard stops that cannot be discounted, an Eval lab with catch rate, false positives and misses on screen.

## Regulator or external auditor

> When I ask why this business was onboarded, I want a record I can read without the analyst in the room.

- **Desk answer:** CSV/JSON export with timestamp, actor, event, rule ID, plain-English detail, evidence anchors and engine version for every step.

## The applicant business (indirect)

> When I apply for an account, I want a decision quickly, and if something is missing I want to be told exactly what.

- **Desk answer:** straight-through recommendation for clean cases; "request more information" is a first-class disposition tied to specific findings (for example the stale utility bill in NB-24109).
