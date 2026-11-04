---
version: 1
slug: "app-hub-page-tsx"
primary_target: "app/(hub)/page.tsx"
related_targets: ["app/login/page.tsx","app/(hub)/check/page.tsx","app/(hub)/campaigns/page.tsx","app/(hub)/pipeline/page.tsx","app/(hub)/contacts/page.tsx","app/(hub)/staged/page.tsx"]
---

## Scope

Investor Hub web app, every screen: Login, Overview, Check a list, Campaigns (YAMM), Pipeline, Contacts, Staged. Mode: Operate. Users: Snackible's admin fundraising team, laptop-first, phone for quick checks. Job: hit about 500 new investor contacts a week without mailing anyone twice, and never miss a follow-up. Sample data only until the backend lands; it is labelled as sample data.

## Direction contract

THESIS: The fundraising week is a run chase. 500 to contact, score posted live, required rate against current rate. Refuses the category's grid of same-size KPI cards over a line chart.

OWN-WORLD: Broadcast purple #3B0A78 shell bar; an ink #1A1030 score bug with a magenta #E6007E batting block; cyan #00B3E6 for projections and required rate; yellow #FFD100 for the one primary action plate; lavender-white #F4F2F8 ground with flat white panels and no shadows. Saira Condensed uppercase display, Saira body, tabular figures everywhere.

STORY: Open the hub, read the chase in one line ("Need 188 from 4 days"), see who is due a follow-up and who is overdue, and check a new list in seconds.

FIRST VIEWPORT: Purple nav bar on top. Full-width score bug below it: contacted/target, need-from-days, current rate, required rate, reply rate. Left column: the week's worm chart (actual against the target line, projection dashed in cyan), then the team scorecard of contacts per owner. Right column: follow-ups due, overdue first, then the yellow check-a-list plate.

SIGNATURE: The score bug. It sits on every screen as the chase summary and rolls its figures once when data arrives (snap under reduced motion). Check-a-list results read as a list scorecard: New, Already contacted, Do not contact, Bounced, Already staged.

FORM: IMPECCABLE'S PICK from round 3 (top of my grounded list), chosen by the user. seed:2be7e2a3c783df31

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Final pipeline stage list (draft uses the team's current vocabulary).
- Whether a new contact at an already-contacted firm is warned or blocked (draft: warned).
