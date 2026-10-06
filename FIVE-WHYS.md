# Five whys: why is business onboarding slow and hard to defend?

**Symptom:** Northbank takes days to open accounts for businesses that turn out to be perfectly ordinary, and QA still finds decisions it cannot explain.

1. **Why do ordinary businesses wait days?** Because every application goes through the same manual review, whatever its risk.
2. **Why does every application get the same manual review?** Because nobody can tell which ones are low risk until the checks have been done, and the checks are the slow part.
3. **Why are the checks slow?** Because the evidence lives in five places (application form, company register, uploaded documents, ownership chart, screening lists) and the analyst cross-references them by hand: retyping company numbers, tracing percentages through holding companies, reading every name match.
4. **Why is the cross-referencing manual?** Because tools that do automate it tend to output a score or a red/green light without the evidence. Analysts and compliance cannot rely on a number they cannot explain to a regulator, so they redo the work.
5. **Why can't they explain the number?** Because the automation was built to decide, not to show its working. The record of why a decision was made is not a product output.

**Root cause:** the pre-work is not trusted because it is not explainable, so the expensive human path is applied to every case.

**What follows for the product:**
- Show the rule and the source line for every finding. Trust comes from evidence, not accuracy claims.
- Make the tier a published rule over named factors, so a low tier can be checked in seconds.
- Keep the human decision, but make it fast for the clean majority: confirm, write one line, done.
- Treat the audit trail as a first-class output, not a log file.
- Measure the engine in the open (golden set, honest misses) so compliance can decide how far to trust straight-through.
