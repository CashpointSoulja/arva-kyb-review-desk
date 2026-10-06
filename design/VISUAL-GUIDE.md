# Visual guide: KYB Review Desk

How the captured Arva patterns (see `BRAND.md`) map onto the review desk. The screenshots in `screenshots/` were taken from arva.ai and are the reference for every screen.

## Reference captures

| File | What it shows | What the desk takes from it |
|---|---|---|
| `screenshots/01-home-desktop.jpg` | Announcement bar, nav, ink hero, green highlight word, eyebrow pill | App bar, eyebrow pills, ink header band |
| `screenshots/02-home-mobile.jpg` | 390px nav: logo, Login, green CTA, hamburger | Mobile app bar and collapsing nav |
| `screenshots/03-onboarding-ai-hero.jpg` | Onboarding AI hero: "Complex cases / Online enrichment / Traceable" | The concept extends this agent, and the three-column intro strip |
| `screenshots/04-product-ui-agentcore-panel.jpg` | Arva's own product UI: sidebar plus a large green metric and delta pill | **Primary template** for the app shell, sidebar and metric tiles |
| `screenshots/05-product-ui-chart-annotations.jpg` | White annotation cards with green status lines and dotted grid | Evidence chips, audit entries, eval chart |
| `screenshots/06-capability-cards.jpg` | Navy capability cards with icon wells | Check-engine category cards (Registry, Ownership, Documents, Screening) |
| `screenshots/07-product-cards-dark.jpg` | Dot-field cards on navy | Case-file header texture |
| `screenshots/08-governance-cards-light.jpg` | Stone cards on paper ("Policy-Based Evaluation", "Explainable Decisions") | Risk-tier panel and disposition cards |
| `screenshots/09-careers.jpg`, `10-about-us.jpg` | Company pages | Footer and page rhythm |

## Layout

- **App shell**: paper background `#f6f5f3`; a `#f5f5f5` top bar with the literal Arva logo top-left, the product name "KYB Review Desk" after a hairline divider, and the green announcement strip carrying the synthetic-data notice.
- **Sidebar** (≥ 834px): copies the AgentCore panel, a white column of outline-icon nav items (Queue, Case file, Audit trail, Eval lab, Metrics, Docs) with the active item on a `#f0f0ef` rounded fill. At 390px it becomes a horizontally scrollable tab row under the top bar.
- **Content**: white cards, 12px radius, 1px `#ededed` border, 24px padding; navy bands (`#023547`) only for headline panels such as the tier recommendation and the honest miss.

## Components

| Component | Arva pattern | Spec |
|---|---|---|
| Metric tile | "71% +17 pts / Alert closure rate" | 40px DM Sans 500 green `#0ae29d` on white, or ink on paper; delta pill with green-tint `#0ae29d1f` background; muted caption |
| Eyebrow | Pill with green dot | Section labels: "AGENT CASE FILE", "CHECK ENGINE", "EVAL LAB" |
| Evidence chip | Chart annotation card | Mono source ID (`CH-REG:SC712340#status`) plus a label, 1px border, 6px radius; click scrolls to and highlights the source line |
| Risk tier badge | No direct equivalent. Derived from the palette | Low: green tint with ink text. Medium: amber `#b7791f` tint (the one added colour, chosen to sit between green and the red token). High: `#ef4444` tint |
| Check row | Governance card list | Status icon, check name, the rule in mono, then findings with evidence chips |
| Buttons | Green primary, white on dark, green text-link secondary | 4px radius, 14px DM Sans 500 |
| Tables | Not shown on site. Built from the hairline and type tokens | 13-14px rows, `#ededed` dividers, mono for IDs and timestamps |

## Responsive targets

- 1440px: sidebar, plus queue table or case file in two columns (evidence panel on the right).
- 834px: sidebar collapses to icons and labels. The case file becomes one column.
- 390px: tab row, stacked cards, tables turned into card lists, no horizontal page scroll.

## Footer

"Independent concept by Ayo Ahmed. Not affiliated with Arva AI." plus "All companies, people, registry entries and media are synthetic."
