# Walkthrough video script

File: `video/kyb-review-desk-walkthrough.mp4` · 1080x1920 vertical · 30 fps · 69.4 s · no audio track; the lines below are burned in as subtitles and double as the voiceover script.

Recorded live from the running app (mobile layout, 540x960 CSS viewport at 2x) with real clicks and typing. The highlighted pointer, click ripples, zooms and subtitle cards are added in post. Data is synthetic.

| Time | On screen | Subtitle / voiceover |
|---|---|---|
| 0:00.0 - 0:03.6 | Queue overview, pointer settles on the first card | Northbank onboards business customers. Every application is pre-checked before an analyst opens it. |
| 0:03.6 - 0:07.4 | Scroll the queue, pointer moves across tier pills and SLA clocks | The queue shows the recommended tier, the checks that fired, the SLA clock and the owner. |
| 0:07.4 - 0:09.1 | Tap NB-24107 Aster Quay Trading | Aster Quay Trading: high tier, one flag. Open the case file. |
| 0:09.1 - 0:14.3 | Case file header and pre-check summary | The agent ran 20 deterministic checks against the register, documents and screening lists. |
| 0:14.3 - 0:18.9 | Scroll to SCR-01, zoom on the rule text | SCR-01, sanctions screening. The rule that fired is printed above the finding. |
| 0:18.9 - 0:24.3 | Zoom on "Why it matched" and "Why it might be wrong" | No bare percentage: it shows why the name matched, and why the match might be wrong. |
| 0:24.3 - 0:25.8 | Pointer to the SAN/SL-40217 evidence chip, tap | Every finding links to its source. Tap the evidence chip. |
| 0:25.8 - 0:32.3 | Drawer: sanctions extract, highlighted line | The drawer opens the synthetic sanctions extract with the exact line highlighted. |
| 0:32.3 - 0:36.2 | Close drawer, scroll to the risk tier panel | Now the risk tier. The recommendation lists its contributing factors and the published tier rule. |
| 0:36.2 - 0:39.2 | Tap "Record tier" (confirm HIGH) | Nothing auto-approves. The analyst confirms the tier. |
| 0:39.2 - 0:45.3 | Approve is disabled; select Escalate to EDD, type rationale, record decision | High tier cannot be approved from the desk. Escalate to enhanced due diligence, with a rationale. |
| 0:45.3 - 0:47.5 | Audit trail view | Every check, view, override and decision lands in the audit trail. |
| 0:47.5 - 0:53.0 | Zoom on Export CSV, tap, toast confirms export | Timestamped, with rule IDs, evidence anchors and engine version. Export to CSV or JSON. |
| 0:53.0 - 0:56.6 | Eval lab headline tiles | Finally, the eval lab: 24 golden applications scored live against the same engine. |
| 0:56.6 - 1:02.2 | Scroll to the honest-miss panel (G-19), zoom | 95.8% of seeded signals caught. And one honest miss, left on screen on purpose. |
| 1:02.2 - 1:06.6 | Hold on the miss and the roadmap note | Adverse media under a previous company name. The fix is sequenced in the roadmap, not tuned away. |
| 1:06.6 - 1:09.4 | Zoom out, footer line | KYB Review Desk. Independent concept by Ayo Ahmed. Not affiliated with Arva AI. |

## How it was produced

1. Serve the repo (`python3 -m http.server 8080`) with a cleared demo state.
2. A Playwright script drives the UI: real taps on the queue card, evidence chip, tier and disposition controls, typed rationale, CSV export, route changes, and frame-by-frame scrolling. Each state change is captured as a 1080x1920 frame.
3. A compositor adds the pointer, ripples, zoom and subtitles, then encodes H.264.
