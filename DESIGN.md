---
name: Investor Hub
description: Snackible's fundraising week told as a broadcast run chase, score bug first.
colors:
  shell: "#3b0a78"
  shell-ink: "#ffffff"
  shell-muted: "#d8c9f2"
  bat: "#e6007e"
  bat-ink: "#ffffff"
  proj: "#00b3e6"
  action: "#ffd100"
  action-ink: "#1a1030"
  ground: "#f4f2f8"
  panel: "#ffffff"
  ink: "#1a1030"
  muted: "#5c5170"
  rule: "#ece8f3"
  field-rule: "#cfc7de"
  chip: "#f1edf8"
  target: "#c9c1da"
  bug: "#1a1030"
  bug-muted: "#b8aecf"
  bug-rule: "#3a2e55"
  bug-behind: "#ff6fae"
  late: "#b4005c"
  ok: "#0c7a4f"
  warn: "#9a5b00"
  ground-dark: "#0e0a18"
  panel-dark: "#181227"
  ink-dark: "#efe9fa"
  muted-dark: "#a99cc4"
  rule-dark: "#2a2140"
  bug-dark: "#241a3c"
  ok-dark: "#3ddc97"
  warn-dark: "#ffb547"
typography:
  score:
    fontFamily: "Saira Condensed, Saira, sans-serif"
    fontSize: "46px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
  display:
    fontFamily: "Saira Condensed, Saira, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Saira Condensed, Saira, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.03em"
  button:
    fontFamily: "Saira Condensed, Saira, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    letterSpacing: "0.04em"
  body:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.05em"
  score-compact:
    fontFamily: "Saira Condensed, Saira, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1
  tally:
    fontFamily: "Saira Condensed, Saira, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.1
  chase-line:
    fontFamily: "Saira Condensed, Saira, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    letterSpacing: "0.02em"
  chase-line-compact:
    fontFamily: "Saira Condensed, Saira, sans-serif"
    fontSize: "17px"
    fontWeight: 700
  chart-label-compact:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
  body-strong:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  caption:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  chart-label:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
rounded:
  none: "0"
  sm: "2px"
  dot: "50%"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  panel: "18px"
  lg: "22px"
  gutter: "28px"
  gutter-mobile: "16px"
components:
  button-action:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "40px"
  button-dark:
    backgroundColor: "{colors.bug}"
    textColor: "{colors.shell-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "40px"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "40px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 11px"
    height: "40px"
  chip:
    backgroundColor: "{colors.chip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "5px 11px"
  chip-selected:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.none}"
    padding: "{spacing.panel}"
  topbar:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-ink}"
    height: "56px"
  score-bug:
    backgroundColor: "{colors.bug}"
    textColor: "{colors.shell-ink}"
    height: "88px"
  score-bug-bat:
    backgroundColor: "{colors.bat}"
    textColor: "{colors.bat-ink}"
    typography: "{typography.score}"
    padding: "10px 26px"
  check-plate:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    padding: "14px 16px"
---

# Design System: Investor Hub

## Overview

**Creative North Star: "The Run Chase"**

The hub reads like an IPL broadcast overlay laid over a working tool. A saturated shell bar sits on top like the channel strip, a dark score bug spans the full width beneath it on every screen, and everything below is flat panels on a pale ground. The bug states the week in one line (contacted this week, today against last week, follow-ups due, reply rate). There is no contact goal, so nothing is framed as a target. Every other surface is a supporting scorecard: tallies, day bars, bars per batter.

Density is operational: 14px body with tabular figures throughout, tight 18px panel padding, tables with ruled rows. Character comes from colour blocks and condensed uppercase numbers, not from depth, curves or ornament. The broadcast palette (shell, batting block, projection, action) is one of four interchangeable kits (purple, blue, green, red), each in light, dark, or system mode, swapped through custom properties on the root; components never name a team colour directly.

The world refuses the category default of same-size KPI cards over a line chart: headline figures live in the bug or a tally strip, never in a grid of floating cards.

**Key Characteristics:**
- Full-bleed shell bar plus full-width score bug on every authenticated screen.
- Flat panels, square corners, hairline rules; one shadow in the whole system, on the floating theme popover.
- Saira Condensed 800 uppercase for every figure, heading and button; Saira for running text; tabular numerals everywhere.
- Colour by role through tokens, so the four team kits and dark mode swap without touching components.

## Colors

A broadcast kit: one deep team colour, one hot batting colour, one cool projection colour and one yellow for the single thing to press, set against neutral lavender-tinted greys. Values below are the default purple kit, light mode.

### Primary
- **Broadcast Purple** (shell): the top bar, selected chips and segmented controls, funnel and first scorecard bars, strong rules under table heads and above totals.
- **Batting Magenta** (bat): the batting block of the score bug, the leading cell of the results tally, the worm's actual-runs line and today's dot. It marks "our score so far".

### Secondary
- **Projection Cyan** (proj): the required rate when on pace and the dashed projection on the worm. It means "where this is heading".

### Tertiary
- **Action Yellow** (action) with **Action Ink**: the one primary action per view (the check-a-list plate, the action button), the "Need N" figure in the bug, the focus ring, text selection and the active-nav underline.

### Neutral
- **Lavender Ground** (ground): page background.
- **Panel White** (panel): panels, fields, popover.
- **Scoreboard Ink** (ink / bug): body text and the score bug and tally strip background in light mode.
- **Dusk Muted** (muted): secondary text, table heads, panel subtitles, chart labels.
- **Hairline Lilac** (rule) and **Field Lilac** (field-rule): row dividers and panel borders; field and outline-button borders.
- **Chip Lilac** (chip): unselected chips, inline code, row hover.
- **Target Grey** (target): the worm's target and par lines, closed-stage funnel bars.
- **Bug Muted / Bug Rule** (bug-muted, bug-rule): stat labels and cell dividers inside the bug and tally.
- **Status inks**: **Late Crimson** (late) for overdue and do-not-contact, **Pitch Green** (ok) for new and target reached, **Amber Warn** (warn) for staged and unsubscribed; **Behind Pink** (bug-behind) for a required rate the team is falling behind, on the bug only.
- **Dark mode** swaps ground, panel, ink, muted, rules, bug, field and status inks (ground-dark, panel-dark, ink-dark, muted-dark, rule-dark, bug-dark, ok-dark, warn-dark; late becomes Behind Pink). Each kit also tints its dark neutrals toward its own hue (see sidecar `themes`).

### Named Rules
**The Kit Swap Rule.** Components reference roles (shell, bat, proj, action, bug), never a hex. A new surface must render correctly in all four kits and both modes without a single kit-specific override.

**The One Plate Rule.** Action Yellow fills at most one control or plate per view. Secondary actions are line or dark buttons.

**The Ink Pairing Rule.** Every role colour travels with its own ink token (shell-ink, bat-ink, action-ink). Blue and red kits use a dark bat-ink on orange; never assume white on bat.

## Typography

**Display Font:** Saira Condensed (with Saira, sans-serif), weights 600-800
**Body Font:** Saira (with system-ui, sans-serif), weights 400, 600, 700

**Character:** Condensed broadcast numerals and headings over a squared, technical sans for reading. The pairing is one family, so the jump is in width and weight, not in voice.

### Hierarchy
- **Score** (800, 46px, line-height 1; 34px under 720px): the contacted-this-week figure in the batting block. Tally and stat figures step down to 32px and 30px (20px on phones).
- **Display** (800, 30px, line-height 1.1, uppercase, 0.02em; 26px on phones): page titles. Login title runs at 34px.
- **Headline** (800, 20px, uppercase, 0.03em): panel titles, brand mark, scorecard and funnel figures.
- **Body** (400, 14px, line-height 1.5, tabular numerals): everything readable; supporting copy capped at 70ch.
- **Label** (600, 12px, uppercase, 0.05-0.06em): table heads, bug stat labels, tally labels. Form labels are 600 13px sentence case.

### Named Rules
**The Tabular Everything Rule.** `font-variant-numeric: tabular-nums` is set on the body; every figure lines up in columns and rolls without jitter.

**The Condensed Figure Rule.** Any number that is the point of its block is Saira Condensed 800. Running text never is.

## Layout

A sticky 56px shell bar, then the full-width score bug, then a centred page (max 1600px, 22px top, 48px bottom, 28px side gutter, 16px under 720px). Overview uses a two-column grid (left up to 560px, right fluid, 22px gap); columns stack below 1100px with the action column moved first. Within a column, panels stack at 16px. Panel heads put the title left and a muted subtitle or count right on a shared baseline.

The bug is a four-cell grid (batting block, today/last-week line, two linked stats: follow-ups due and reply rate). Below 1100px the stats wrap under it; below 720px it becomes a six-track grid: batting block and need line share the first row, three stats share the second. The tally strip runs six across, three below 1100px, two below 720px. On phones the nav drops to its own 42px scrolling row and secondary table columns hide, folding into a sub-line under the first cell.

## Elevation & Depth

Flat. Depth is carried by colour blocks (shell, bug, bat, plate) against a pale ground and by 1px rules, not by shadow. The active nav tab uses an inset 3px Action Yellow bottom bar, which is a rule, not elevation.

### Shadow Vocabulary
- **Popover** (`box-shadow: 0 12px 32px rgba(10, 4, 30, 0.28)`): the theme menu panel only, the one element that floats over content.

### Named Rules
**The Flat Panel Rule.** Panels, bug, tally, plate, buttons and tables carry no shadow. Only a floating layer that overlaps content may take the Popover shadow.

## Shapes

Square by default: panels, buttons, chips, the bug, tally and plate have no radius. Fields and the theme trigger take a barely-there 2px. Round geometry is reserved for marks inside the data: badge dots (7px), the worm's today dot, the swatch in the theme trigger. Borders are 1px hairlines; table heads and totals take a 2px strong rule; selected states fill solid rather than outline.

## Components

### Buttons
Blunt broadcast captions: condensed, uppercase, square.
- **Shape:** square (0), 40px minimum height, 18px horizontal padding; 44px in the phone plate.
- **Action:** Action Yellow fill with Action Ink text.
- **Dark:** Bug fill with white text; inside the check plate it carries Action Yellow text.
- **Line:** transparent with a 1px field-rule border and ink text, for secondary actions such as Sync now and Copy.
- **Hover / Active / Disabled:** brightness(1.06) on hover, 1px press on active, 45% opacity when disabled (the plate's disabled button instead mixes its yellow 45% into the bug colour).

### Chips
- **Style:** Chip Lilac fill, transparent border, 600 13px, 5px 11px.
- **State:** selected (aria-pressed) fills with the shell colour and shell ink. A trailing count sits in 800 weight.

### Cards / Containers
- **Corner Style:** square.
- **Background:** Panel White on Lavender Ground.
- **Shadow Strategy:** none (Flat Panel Rule).
- **Border:** 1px Hairline Lilac.
- **Internal Padding:** 18px; head to body 10px, foot 12px in muted 13px.
- **Notices:** same panel with a 1px shell-strength border (late border for hashmap faults), 12px 16px.

### Inputs / Fields
- **Style:** panel/field fill, 1px Field Lilac border, 2px radius, 9px 11px, 40px min height; textareas 160px, 13.5px.
- **Focus:** the global 3px Action Yellow outline at 2px offset.
- **Error:** Late Crimson 600 text below the form.

### Badges
Outlined status tags in their status ink (1px currentColor border, 600 12px, 2px 8px) led by a 7px dot. Shape doubles the colour cue: New uses a square dot, Do not contact a hollow ring.

### Navigation
Shell bar links in Saira 600, shell-muted at rest, shell-ink on hover; the current page is shell-ink with a 3px Action Yellow inset underline. The theme trigger is a translucent white box (10% fill, 25% border, 2px radius) holding a two-colour swatch. On phones the nav wraps to a full-width horizontally scrolling row.

### Score Bug (signature)
Full-width bug on every hub screen and on login. Batting block in bat with "Week N · contacted" and the 46px score; a condensed uppercase line with today's count in Action Yellow and last week's beside it; two stat cells divided by bug rules, each a 12px uppercase label over a 30px figure and each a link (follow-ups due to the pipeline, with a Behind Pink "N late" suffix; reply rate in Projection Cyan to campaigns). Figures roll from old to new value over 900ms with an exponential ease-out after a sync; reduced motion snaps.

### Results Tally
The list scorecard after a check: a bug-coloured strip of six equal cells, the first (New) in the batting block colour, labels 12px uppercase, figures 32px condensed.

### Day bars
SVG bars of emails contacted per day across the chosen date range, one shared scale, today in bat and other days in shell, labelled with weekdays (up to 8 days) or dates.

### Range picker
Preset chips (This week, Last week, This month, Last 30 days, All time) plus a custom from-to with Apply, kept in the URL. Used on Overview, Campaigns, Pipeline and Staged.

### Clickable rows
Every record row is a link: the first cell carries a row-link whose ::after stretches over the row; the row tints chip on hover and takes the action focus ring.

### Bars (scorecard and funnel)
Flat 16px (scorecard) or 22px (funnel) bars with a name column and a right-aligned condensed figure. Scorecard bars cycle shell, bat, proj, action; funnel bars are shell, closed stages Target Grey; in dark mode shell bars switch to shell-muted.

### Check Plate
Action Yellow strip pairing a one-line reassurance with a dark button carrying yellow text. Stacks vertically on phones.

## Do's and Don'ts

### Do:
- **Do** put the week's headline figures in the score bug or a tally strip, condensed 800 on the bug colour.
- **Do** reference role tokens (shell, bat, proj, action, bug and their inks) so all four kits and both modes work unchanged.
- **Do** keep panels flat and square with a 1px rule; reserve the Popover shadow for layers that float over content.
- **Do** give every status a shape cue as well as a colour (square, hollow ring, round dot, "behind" suffix).
- **Do** use a single Action Yellow plate or button per view for the primary action.

### Don't:
- **Don't** build a grid of same-size KPI cards over a line chart; that is what the bug replaces.
- **Don't** hard-code a kit hex in a component or assume white text on bat.
- **Don't** add shadows, gradients or radii above 2px to panels, buttons or the bug.
- **Don't** set running text in Saira Condensed or uppercase; condensed uppercase is for figures, headings, labels and buttons.
