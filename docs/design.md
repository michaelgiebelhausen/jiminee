---
version: alpha
name: Jiminee
description: Warm, garden-toned design system for the Jiminee .work task board — a conscience in a vest, not a badge.
colors:
  primary: "#0D6036"
  primary-hover: "#0A4A2A"
  on-primary: "#FFFFFF"
  ink: "#1D2B1D"
  ink-secondary: "#6B6770"
  ink-muted: "#8D8791"
  background: "#FAF6F4"
  surface: "#FFFFFF"
  surface-sunken: "#F3ECE9"
  accent-soft: "#E5D0CC"
  border: "#DFD3D6"
  border-strong: "#BFACB5"
  success: "#0D6036"
  success-soft: "#DEEDE4"
  warning: "#96610F"
  warning-soft: "#F6E8D4"
  error: "#A93B33"
  error-soft: "#F6DEDC"
  info: "#4E6273"
  info-soft: "#E2E9EE"
typography:
  display:
    fontFamily: Nunito
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: -0.01em
  h1:
    fontFamily: Nunito
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
  h2:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.35
  h3:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: Nunito Sans
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
  body-strong:
    fontFamily: Nunito Sans
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.55
  caption:
    fontFamily: Nunito Sans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: Nunito Sans
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.06em
rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  full: 9999px
spacing:
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "5": 24px
  "6": 32px
  "7": 48px
  "8": 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    padding: 10px 20px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    padding: 10px 20px
    height: 40px
  button-primary-disabled:
    backgroundColor: "{colors.border}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    padding: 10px 20px
    height: 40px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    padding: 10px 20px
    height: 40px
  button-secondary-hover:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.primary-hover}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    padding: 10px 20px
    height: 40px
  button-destructive:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    padding: 10px 20px
    height: 40px
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 10px 12px
    height: 40px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.4}"
  chip-status:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 10px
    height: 22px
  chip-priority-high:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 10px
    height: 22px
  badge-dispute:
    backgroundColor: "{colors.error-soft}"
    textColor: "{colors.error}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 10px
    height: 22px
  toast-nudge:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.background}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.4}"
  metric-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.md}"
    padding: "{spacing.5}"
  modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.5}"
    width: 480px
---

# Jiminee Design System

## Overview

Jiminee is a Kanban task board where AI writes the instructions and a friendly conscience keeps hourly workers on task. Its users are faculty managers glancing at exceptions, student workers on phones, and a supervisor who referees disputes. The interface must feel like the brand personality: a warm conscience in a tidy vest — encouraging, candid, never accusatory. The emotional target is "calm garden," not "compliance software." Two anti-patterns govern everything: never look like surveillance software (no reds-and-dashboards menace, no scores on people), and never borrow Disney's cricket (original iconography only — our cricket, our linework). The two brand greens (`primary` #0D6036, `ink` #1D2B1D) are locked; the warm neutrals are an anchor palette that may be tinted for contrast, not replaced.

## Colors

The palette is greens on warm blush — ownable and deliberately un-corporate. `primary` (Dark Emerald) is the single interactive color: buttons, links, active states, progress. `ink` (Evergreen) is near-black text with a green soul; on `background` (#FAF6F4, Almond Silk lightened to a whisper) it reads at ~13:1. `surface` is white for cards so the board reads as paper on a warm desk; `surface-sunken` recesses Kanban columns and empty wells. `accent-soft` (Almond Silk at full strength) marks selected and highlighted moments. Secondary text uses `ink-secondary` (#6B6770, Rosy Granite darkened to pass WCAG AA at 15px). Semantic colors are muted to stay inside the warmth: `success` shares the brand emerald (done is the brand's favorite state), `warning` is a toasted amber for priority and stalls, `error` is a soft brick reserved for disputes and true failures — never for "worker is idle," which is a nudge, not an alarm. Every semantic color has a `-soft` tint for chips and banners; text on soft tints always uses the full-strength partner. All text pairings must hold WCAG AA minimum.

## Typography

Nunito (rounded, generous) carries display and h1 — it echoes the wordmark's soft geometry and keeps big numbers on the dashboard friendly rather than clinical. Nunito Sans handles everything from h2 down: it shares Nunito's warmth but holds up at 13–15px on dense mobile boards. `body` at 15px/1.55 is the workhorse for card titles, steps, and chat. `body-strong` is for emphasis and buttons — emphasis comes from weight, never from color shouting. `label` (11px, bold, +0.06em, uppercase in usage) is for chips, column headers, and field labels only. Never use a serif; never use thin weights (below 400); the brand is sturdy and kind, not fashionable.

## Layout

Spacing runs a 4px base scale (4–64). Density is comfortable: cards breathe with `spacing.4` padding, column gutters are `spacing.3`, page margins `spacing.4` on mobile and `spacing.6` on desktop. The board is a horizontal flex of fixed-width columns (~300px) with horizontal scroll on mobile; all other screens are single-column, max-width 640px for flows and 1080px for the dashboard, centered. Rhythm rule: vertical gaps between unrelated blocks are at least one step larger than gaps within a block. When in doubt, add space — a calm conscience is never cramped.

## Elevation & Depth

Depth is quiet: a 1px `border` plus a soft, warm shadow (`0 1px 3px rgba(29,43,29,0.08)`) for resting cards, deepening to `0 4px 12px rgba(29,43,29,0.12)` on hover/drag and `0 12px 32px rgba(29,43,29,0.16)` for modals and the drag overlay. Shadows are always tinted with Evergreen, never pure black — black shadows go cold on the blush background. Columns and wells use `surface-sunken` with no shadow (recession, not elevation). Nothing floats aggressively; the hierarchy is paper on a desk, one sheet at a time.

## Shapes

Soft but grown-up: `sm` (8px) for buttons and inputs, `md` (12px) for cards and toasts, `lg` (16px) for modals, `full` for chips, badges, avatars, and the steps-progress ring. The roundness matches the cricket's organic linework without tipping into toy-like — this is still the tool that produces a paper trail. Never mix radii within one component class, and never use 0px corners anywhere; sharp corners read as the badge, not the vest.

## Components

Buttons: `button-primary` is emerald with white text for the single most important action per screen (Claim, Tell Me How, Post); `button-secondary` is a bordered white button (1px `border-strong`) for everything else; `button-destructive` appears only in dispute rulings and destructive confirms. Hover states darken (`primary-hover`) or tint (`success-soft`); disabled flattens to `border`/`ink-muted`. Inputs (`input-text`) are white with a 1px `border`, focus ringed in `primary` at 2px — never a browser-default blue. `card` is the task card: title in `body-strong`, meta chips below, a `full`-rounded progress ring when steps exist; hover raises elevation one step. `chip-status` (neutral) labels columns and states; `chip-priority-high` (amber) and `badge-dispute` (brick) are the only loud chips — everything else stays quiet. `toast-nudge` inverts to `ink` background so the cricket's voice stands apart from the page; it carries the nudge copy and two actions ("Still on it" primary, "Drop the card" quiet link). `metric-card` shows one dashboard number in `display` over a `caption` label — numbers are facts, so no color coding of people. `modal` uses `lg` radius, one clear primary action, and always keeps drafted text on dismiss.

## Do's and Don'ts

**Do:**
- Use `primary` emerald as the only interactive color — one green thread through every screen.
- Write UI copy in the brand voice on every surface, including errors and empty states ("No open tasks right now. Enjoy it — I'll chirp when something lands.").
- Keep manager-facing surfaces factual and neutral: events, counts, timestamps — set in type, not traffic lights.
- Tint every shadow with Evergreen and every background with warmth; pure black and pure gray are foreign here.
- Render the cricket in its original linework (emerald body, evergreen face, white details) with clear space around it.
- Hold WCAG AA on every text pairing; when a palette neutral fails, darken the derived token, not the locked brands.

**Don't:**
- Don't use red for idleness, nudges, or anything about a person — `error` belongs to disputes and system failures only.
- Don't add scores, grades, gauges, or red/yellow/green ratings of workers anywhere; the dashboard reports events, not judgments.
- Don't introduce blue as an accent or focus color — it instantly turns the garden into enterprise software.
- Don't use sharp (0px) corners, thin font weights, or serifs; don't shrink body text below 13px.
- Don't dress the cricket in a top hat, umbrella, or any Disney-adjacent costume — original iconography only.
- Don't crowd: if a card or screen needs a divider to separate ideas, it more likely needs space.
