# Vision — Jiminee

> Captured by the Product Planner skill. This file is the source of truth for
> generating product-vision.md, prd.md, and product-roadmap.md. Edit it directly
> and re-run the Product Planner to regenerate downstream documents.

**Created:** 2026-07-12
**Updated:** 2026-07-12

## Founder

- **Name:** Mike Giebelhausen
- **Expertise:** Marketing professor at Clemson University — consumer psychology, services marketing, and brand strategy. Serial ed-tech founder; builds products with AI coding tools (non-technical, Claude Code).
- **Background:** Mike's department shares a small pool of student administrative assistants. Delegating to them costs more than doing the work: instructions must be written so explicitly it's faster to do the task yourself, workers default to their phones, and "not my job" refusals have no resolution path. He realized the bottleneck isn't the workers' time — it's the manager's cost of specifying tasks and verifying follow-through. Jiminee attacks both sides.

## Purpose

- **Who you help:** Managers of low-autonomy hourly workers — faculty and staff supervising student admin assistants, front-desk staff, and similar shared support pools.
- **Problem you solve:** Delegation is uneconomical. Writing novice-proof instructions takes longer than the task, and verifying follow-through requires standing over people. So managers stop delegating, workers sit idle on their phones, and the effective cost per useful action is absurd.
- **Desired transformation:** Before: a manager hoards tasks because delegating costs more than doing. After: the manager types one terse sentence, the AI writes the novice-proof instructions, the system watches for stalls and nudges, and the manager only hears about genuine exceptions. Delegation becomes cheaper than doing.
- **Why you:** Mike lives this pain daily as one of the faculty sharing the assistant pool — the pilot customer is his own department. His marketing-psychology expertise covers the product's hardest non-technical problem: making accountability feel like support rather than surveillance.

## Product

- **Name:** Jiminee (jiminee.work)
- **One-liner:** Jiminee is a Kanban task board where AI writes the instructions and a friendly conscience keeps workers on task.
- **How it works:** A manager posts a one-sentence task card to a shared board. A worker claims it and taps "Tell Me How" — an LLM expands the sentence into numbered, checkable, site-specific steps (grounded in the org's "workplace brief"), with a card-scoped chat for follow-up questions. As the worker checks off steps, activity signals flow to the board; if a claimed task goes quiet, the worker gets a gentle push/SMS nudge ("Still on the mail run? Tap to confirm"). Out-of-scope tasks get flagged with a reason and routed to a neutral Administrator who rules reassign/uphold/dismiss — everything logged.
- **Key capabilities:**
  - Shared real-time Kanban board (Backlog → To Do → Doing → Blocked/Flagged → Done) with multi-manager posting
  - "Tell Me How" AI task coach: one-sentence task → grounded step-by-step checklist + card-scoped follow-up chat + correction flagging
  - Tier 1 accountability: activity-based idle detection with PWA push/SMS nudges (no app-focus spying)
  - Dispute workflow: flag-with-reason → Administrator ruling → permanent paper trail
  - Manager dashboard: time-in-column analytics, nudge/response history, per-worker activity
- **Platform:** web
- **Market differentiation:** Trello/Asana/Monday manage tasks but assume workers who self-direct; employee-monitoring tools (Hubstaff, Time Doctor) surveil without helping anyone do the work. Jiminee is the only tool that lowers the manager's *specification* cost (AI writes the instructions) and *verification* cost (activity-based nudging) at the same time — coaching and accountability in one loop, built for the low-autonomy workers everyone else ignores.
- **Magic moment:** A manager types "restock the printer in Brackett 214." Thirty seconds later, a student who has never done it is following nine site-specific steps — and when they stall, the cricket chirps before the manager ever has to.

## Audience

- **Primary user:** Dr. Reyes, 48, faculty member sharing three student admin assistants with six colleagues. Has a running list of small tasks she never delegates because explaining each one takes longer than doing it. Checks the board twice a day; wants exceptions, not status meetings.
- **Secondary users:**
  - Student workers (19–22, on phones, novices at office tasks) who claim cards, follow AI steps, and answer nudges
  - The staff supervisor (Administrator) who configures the org, rules on disputes, and owns the compliance view
- **Current alternatives:** Email requests that get ignored, paper notes at the front desk, verbal asks, a shared spreadsheet nobody updates, or simply doing the task yourself.
- **Frustrations:** No shared queue (tasks vanish into inboxes), no instruction leverage (every task re-explained from scratch), no follow-through visibility (find out at 5pm it never happened), and no dispute mechanism ("not my job" just ends the conversation).

## Business

- **Revenue model:** subscription
- **90-day goal:** MVP built during the summer sprint, the origin-department pilot run when student workers return in the fall semester, and the Phase 2 gate passed: faculty delegate meaningfully more than their pre-Jiminee baseline AND ≥80% of assigned tasks reach Done without the manager personally chasing.
- **6-month vision:** Gate passed → Phase 2 (desktop monitoring agent + full consent framework) in development, with 2–3 additional campus departments running free/cheap pilots. Revenue still ~$0 by design; the asset is evidence and case-study material.
- **Constraints:** Summer sprint — 25+ hrs/week July–August targeting a fall-semester pilot; less time once the semester starts. Budget $100–300/month for services. Founder is non-technical: all code written with Claude Code, so the architecture must stay simple enough to debug with AI assistance. Pilot is free for the origin department.
- **Go-to-market:** Land-and-expand from the origin department: run the pilot, document the gate metrics as a case study, spread by campus word-of-mouth to adjacent departments and labs. Longer term, .work controversy and awareness funnel into the .me consumer product (the intended revenue engine, Phase 3).

## Brand Voice

- **Personality:** A warm conscience, not a cop — the Jiminy Cricket archetype: encouraging, lightly wry, always on the worker's side, factual and neutral when speaking to managers. Plus one twist: the cricket has moods — an opt-in "Tough Love" roast mode (Triumph the Insult Comic Dog energy) that any user, including workers, can self-select for their own nudges.
- **Tone of voice:** Worker-facing default: supportive and light — "Still on the mail run? Tap to confirm — or drop the card back if something came up." Never accusatory, never passive-aggressive. Manager-facing: factual and neutral — "3 tasks completed, 1 nudge unanswered 40+ min." Tough Love mode (opt-in, off by default, self-selected only, toggleable off anytime; managers never see or set it): "One checkbox in an hour? Riveting pace… for me to POOP on! Tap if you're actually alive." Disclosure and consent copy is always plain, warm, and unambiguous.

> Visual identity (mood, anti-patterns, design tokens) is deliberately not
> captured here — it lives in docs/design.md, generated by the Design System
> skill from image references.

## Tech Stack

- **App type:** web
- **Frontend:** Next.js (TypeScript) — desktop-first (workers do office tasks from laptops; desktop browser push needs no install), PWA-capable for phone use; one codebase for manager/admin/worker views; dnd-kit for the Kanban drag-and-drop, Tailwind for styling; deploys to Vercel.
- **Backend:** Next.js API routes + Supabase — Supabase supplies Realtime for live board sync and Edge Functions where needed; Anthropic Claude API powers Tell Me How and card chat; Telnyx powers SMS nudge fallback (PAYG, cheaper than Twilio). Matches the founder's existing project stack.
- **Database:** Supabase Postgres — row-level security enforces org-scoped multi-tenancy; core tables per the spec (organizations, users, memberships, boards, tasks, task_steps, task_events, disputes, consent_records, monitoring_events).
- **Auth:** Supabase Auth — email/password + magic-link invites; role stored on memberships (manager / administrator / worker).
- **Payments:** None — pilot is free; per-worker-seat subscription (~$10–15/worker/month, managers free) via Stripe when the first paying org arrives, post-gate.
- **Analytics:** PostHog — free tier covers pilot volume; product analytics double as pilot-gate instrumentation.
- **Email:** Resend — invites, dispute notifications, manager digests.
- **Error tracking:** Sentry — a non-technical founder needs production errors surfaced, not discovered by workers.

## Tooling

- **Coding agent:** Claude Code
