# Arva brand reference

Captured from the public arva.ai site (home, /about-us, /careers, /careers/head-of-product, /agents/onboarding-ai, /agents/screening-ai, /platform/agentcore) at 1440px and 390px. This sheet was written before any product code so the review desk follows Arva's design language rather than a generic dashboard look.

Arva's logo, name and visual identity belong to Arva AI. They appear here only so the concept reads as an extension of Arva's own product. Independent concept by Ayo Ahmed. Not affiliated with Arva AI.

## Logo

| Asset | Source | Use |
|---|---|---|
| `assets/arva-logo.svg` | Inline SVG symbol `viewBox="0 0 85 18"` in the arva.ai desktop nav (`data-framer-name="arva-logo"`) | Top-left of the app bar, 85x18 at 1x |
| `assets/arva-logo-lg.svg` | Inline SVG symbol `viewBox="0 0 113.33 24"` used in the footer and the AgentCore product panel | Larger lockups |
| `*-white.svg` | Same paths, fill swapped to `#ffffff` | On deep-navy surfaces |

The paths are unchanged from the live site. The only edit is resolving the Framer colour token (`var(--token-9af3..., rgb(1, 21, 28))`) to its literal value `#01151c`.

The mark is the slanted double-stroke "A" followed by a lowercase geometric "arva" wordmark. The site never puts it in a box or adds a tagline next to it.

## Colour tokens

Values come from the Framer `--token-*` declarations in the page CSS, ranked by how often they are used.

| Role | Hex | Where it shows up on arva.ai |
|---|---|---|
| Ink / near-black | `#01151c` | Hero background, body text on light, logo fill |
| Deep navy | `#023547` | Section bands ("AI that continuously learns", product grid), primary dark button |
| Navy alt | `#003649` / `#10313d` | Eyebrow text, dark cards (`#10313d` card fill on navy) |
| Signal green | `#0ae29d` | Announcement bar, "Book a demo" CTA, highlighted headline word ("banks"), metric numbers ("71%"), chart lines, eyebrow dots |
| Teal accent | `#008082` | Secondary accent |
| Slate text | `#48535b` | Body copy on light backgrounds |
| Muted slate | `#536877` / `#708091` | Captions, secondary labels |
| Light blue-grey | `#8fb1be` | Muted text on navy |
| Warm off-white | `#f6f5f3` | Light page background (the site's default "paper" colour) |
| Card stone | `#e3e1de` / `#e1e2da` | Light cards (governance cards, trust badges) |
| Border grey | `#ededed` / `#e9ecef` | Hairlines, nav background tint `#f5f5f5` |
| Warm neutrals | `#99938b`, `#969492`, `#877e71`, `#4d4841`, `#42413e` | Image overlays, footer watermark |
| Error red | `#ef4444` | The only red token, used for warnings |
| White | `#ffffff` | Cards on paper, primary button on dark |

## Typography

| Use | Family | Measured on arva.ai |
|---|---|---|
| Display / headings | **DM Sans** | H1 64px / 300 / -1.92px tracking / 1.2 line-height; H2 54px / 400 / -1.62px; H3 42px / 400 / -0.2px |
| Body | DM Sans | 16-18px / 400, slate `#48535b` on light, white or `#8fb1be` on navy |
| Eyebrow pills | DM Sans | 12-13px / 500, uppercase, ~0.12em letter-spacing, green dot before the label, white pill with a 1px border |
| Nav | Inter (Framer default), 14-16px / 400 | The desk uses DM Sans throughout for consistency. Inter is visually close at nav sizes |
| Data / timestamps | Fragment Mono | Small figures, timestamps and IDs in product panels |

DM Sans and Fragment Mono are open-licence (SIL OFL) fonts, self-hosted from `public/fonts/` so the app makes no third-party font requests.

## UI patterns seen on the site

1. **Announcement bar**: a full-width signal-green strip above the nav with 13px ink text and an arrow.
2. **Nav**: `#f5f5f5` bar, logo on the left, text links in the middle, "Login" text plus a green "Book a demo" button (4px radius, ink text) on the right.
3. **Eyebrow pill**: rounded-full white pill, green 6px dot, small uppercase tracked label ("ONBOARDING AI", "HOW WE KNOW IT'S RIGHT").
4. **Section rhythm**: ink hero, then warm off-white sections, then deep-navy bands, then off-white again. Large light-weight headings with tight negative tracking.
5. **Product panel** (AgentCore, home page): a white surface with a 12-16px radius and a left sidebar (logo, nav items with 16px outline icons: AgentCore, Cases, Agents, Documents, Integrations, API Keys; the active item sits on a light-grey rounded fill). Content leads with a huge green metric ("71%"), a small green-tinted delta pill ("+17 pts") and a muted caption with an info icon.
6. **Chart annotations**: small white cards with a hairline border, a mono date, a title, and a green status line ("Trained · +4%", "Deployed · +8%"), pinned to a dotted grid.
7. **Capability cards**: on navy, `#10313d`-style cards with a circular icon well, a white title and a muted description.
8. **Governance cards**: on paper, stone `#e3e1de` cards (radius about 12px) with a white circular icon well and an ink title.
9. **Buttons**: primary is green `#0ae29d` with ink text on light, or white with ink text on dark. Secondary is a green underlined text link with an arrow. Radius is 4px and nothing is pill-shaped except the eyebrows.
10. **Dot-field texture**: navy/teal dots of varying size on hero and card backgrounds.

## Tone of voice

- Confident, short and specific to the institution: "AI for decisions that banks can trust", "Built to decide, not just to flag.", "Prove it's correct. Then automate it."
- Defensibility and evidence come up again and again: "Every conclusion backed by evidence", "decisions you can defend", "Built for the people who answer to regulators".
- The copy uses domain vocabulary without explaining it (KYB, CDD, EDD, UBO, alerts, straight-through processing).
- Short declarative headlines with a full stop, and one green-highlighted word in hero headlines.
- British spelling ("prioritisation", "organisation").

The desk's own copy is original. It follows this tone but does not reuse Arva's sentences.
