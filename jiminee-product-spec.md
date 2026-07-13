# Jiminee — Product Specification & Build Guide

**Domains:** jiminee.work (B2B) / jiminee.me (B2C)
**Category:** AI-augmented task management with accountability monitoring
**Format:** This document is structured as guidance for an AI coding platform. Build in phases; MVP scope is defined at the end.

---

## 1. Concept Summary

Jiminee is a Kanban-based task management SaaS with two differentiators:

1. **AI task coaching** — a "Tell Me How" button on every task card that generates step-by-step execution instructions for the worker, eliminating the friction of managers writing detailed instructions.
2. **Accountability monitoring** — configurable productivity verification that compares what a worker is actually doing against the task they've claimed, and prompts them when there's a mismatch.

The name references Jiminy Cricket — the externalized conscience that keeps a distractible puppet on task.

Two product lines share a codebase:

| | **Jiminee.work** | **Jiminee.me** |
|---|---|---|
| Audience | Managers of low-autonomy hourly workers (e.g., student admin assistants, front-desk staff) | Individuals who want self-accountability |
| Board populated by | Managers | AI (from user's email, calendar, notes vault, task-app APIs) |
| Monitoring | Employer-configured, disclosed to workers | Self-configured, opt-in by definition |
| Business model | Marketing/awareness driver | Primary revenue product |

---

## 2. Origin Pain Point (for product framing)

A university department shares a small team of student administrative assistants. In practice:

- Delegating a task requires writing instructions so explicit that it's faster to do the task yourself.
- Workers default to their phones and ignore assigned work.
- Some tasks get refused as "not my job" with no resolution mechanism.
- Utilization is so low that the effective cost per useful action is absurd.

The core insight: **the bottleneck isn't the worker's time — it's the manager's cost of specifying tasks and verifying follow-through.** Jiminee attacks both sides: AI lowers the specification cost, monitoring lowers the verification cost.

---

## 3. Core Features

### 3.1 Kanban Task Board
- Standard columns: **Backlog → To Do → Doing → Blocked/Flagged → Done**
- Managers create/assign cards; workers claim cards into "Doing."
- Card fields: title, description, priority, due date/time, estimated duration, assignee, location (physical tasks), attachments, activity log.
- Multiple managers can post to a shared board (multi-faculty → shared assistant pool is the reference case).
- Real-time sync across clients.

### 3.2 "Tell Me How" (AI Task Coach)
- Every card has a button that calls an LLM to expand the task into numbered, concrete, checkable steps calibrated to a novice worker.
- Steps render as an interactive checklist on the card; worker checks off steps as completed.
- Worker can ask follow-up questions in a card-scoped chat ("the printer says error 502, now what?").
- Manager-side benefit: managers write one terse sentence; the AI does the instruction-writing.
- **Grounding (MVP requirement):** at org setup, the administrator completes a guided one-page "workplace brief" (building/room locations, key systems and where credentials live, supply locations, who-to-ask-for-what). This brief is injected into every Tell Me How prompt so generated steps are site-specific rather than confidently generic. The brief also seeds Phase 4 instruction memory.
- Include a feedback loop: if the AI's instructions were wrong, the worker flags it; the flag notifies the manager and their correction is stored on that task's record. **MVP stores corrections only (schema: per-org, with task context); cross-task retrieval into future prompts is Phase 4 instruction memory** — retrieval needs correction volume a pilot won't have.

### 3.3 Task Dispute / Approval Workflow
- Worker can flag a task as "not in scope" instead of silently ignoring it. **A reason is required to flag.**
- Flagged tasks route to a designated **Administrator role** (e.g., the staff supervisor the students report to) who rules: reassign, uphold, or dismiss. **A note is required to rule.**
- All disputes and rulings are logged to `task_events` — creates a paper trail for performance conversations.
- **MVP flow is minimal:** flag → card moves to Blocked/Flagged → admin notified → ruling → logged. No separate dispute queue UI beyond a filtered view; SLA timers and escalation chains wait for a customer big enough to need them.
- **Pilot prerequisite:** recruit the actual staff supervisor as Administrator before the build completes. A dispute mechanism without a committed neutral referee is a queue where flags rot.

### 3.4 Accountability Monitoring (tiered, configurable)
Build as **pluggable monitoring modules**, each independently toggleable per organization/user:

**Tier 1 — Activity signals (MVP):**
- Task check-in/check-out timestamps; time-in-column analytics.
- **Idle detection is activity-based, not focus-based.** No app-focus heartbeat in MVP: workers are on phones and many tasks are physical, so a locked phone would generate constant false idle signals. "Idle" = task in Doing with no step-checkoffs, no card activity, and no check-in refresh for X minutes, where X derives from the card's estimated duration.
- Nudges ("Still on [task]? Tap to confirm.") are delivered as web push — desktop browser first (workers are laptop-based; no install needed), installed phone PWA second — with SMS (Telnyx, PAYG) as the guaranteed-delivery fallback. A tap is itself an activity signal. Works identically for physical and desk tasks.

**Tier 2 — Screen verification:**
- Desktop agent takes periodic screenshots; an AI vision model classifies whether screen content plausibly relates to the active task.
- Frame-over-frame comparison to detect whether visible progress is occurring (vs. a static decoy window).
- Mismatch → prompt worker to explain or re-check-in; repeated incidents accumulate on a compliance score visible to the manager/administrator.

**Tier 3 — Presence verification:**
- Webcam-based presence/attention detection (is someone at the machine; are they looking at the screen).
- For .me: optional smart-glasses snapshot integration comparing what the user is looking at against their scheduled goal block.

**Compliance scorecard:**
- Rolling incident count per worker; configurable thresholds trigger administrator alerts. Termination decisions stay human — the system surfaces evidence, it doesn't act.

**Consent starts in MVP, not Phase 2:** Tier 1 signals are already employee monitoring. Worker onboarding includes one plain-language disclosure screen ("Jiminee records when you claim/complete tasks and may send reminders; your manager sees task activity, not your device"), with acknowledgment stored in `consent_records`. Phase 2's heavier consent flow then upgrades an existing pattern instead of introducing new architecture — and the pilot is defensible with university HR from day one.

**Build requirement (non-negotiable for .work):** Tier 2/3 monitoring is legally regulated employee surveillance. The product must include a disclosure-and-consent flow at worker onboarding (documented acknowledgment of what is captured, when, and who sees it), org-level policy settings, and data retention limits. Several US states (and most non-US jurisdictions) require notice; some require two-party consent for camera capture. Ship the consent framework in the same phase as the monitoring modules — it's a feature, not a legal afterthought, and it's also the .work product's defense in the inevitable press cycle.

### 3.5 AI Board Population (.me only)
- Integrations: email (Gmail/Outlook), calendar, Obsidian vault (local plugin or sync API), and generic task-app APIs (Todoist, Things, Notion, etc.).
- AI agent scans sources on a schedule, extracts actionable commitments, and drafts cards into the Backlog for user approval (never auto-commits to Doing).
- Daily planning ritual: AI proposes today's To Do column each morning; user approves/edits.

---

## 4. Roles & Permissions

| Role | Capabilities |
|---|---|
| **Manager** | Create/assign tasks, view compliance dashboards for their tasks, use Tell Me How on authoring side |
| **Administrator** | All manager rights + dispute rulings, monitoring configuration, compliance thresholds, worker management |
| **Worker** | Claim tasks, check off steps, use Tell Me How, flag disputes, view own compliance record |
| **Individual (.me)** | All roles collapsed into one; monitoring is self-directed |

---

## 5. Architecture (committed)

- **Stack decision:** Next.js (TypeScript) + Supabase + Vercel. One codebase; Supabase supplies Postgres, auth, row-level security for org tenancy, and Realtime for live board sync. Matches the founder's existing project stack, so patterns and secrets management transfer.
- **Frontend:** React + TypeScript via Next.js, drag-and-drop Kanban (dnd-kit), Tailwind. **Desktop-first** (2026-07 decision: workers do office tasks from laptops); PWA-capable for phones — phone onboarding includes an "Add to Home Screen" step (iOS web push requires it). Telnyx SMS is the nudge fallback channel.
- **Auth/multi-tenancy:** Supabase Auth; org-scoped tenancy via RLS for .work; single-user workspaces for .me.
- **AI layer:** LLM API for Tell Me How and card-scoped chat; vision-capable model for screenshot classification. Abstract behind a provider interface.
- **Monitoring agent:** separate lightweight desktop app (Electron or Tauri) that handles screenshot/webcam capture locally, runs client-side pre-filtering where possible, and uploads only classification events + flagged frames (privacy-by-design also cuts storage/inference cost).
- **Integrations service (.me):** OAuth connectors for email/calendar; queue-based ingestion → AI extraction → draft cards.

### Data model (core tables)
`organizations`, `users`, `memberships(role)`, `boards`, `tasks`, `task_steps`, `task_events` (audit log), `disputes`, `monitoring_configs`, `monitoring_events`, `compliance_scores`, `integrations`, `consent_records`.

---

## 6. Build Phases

**Phase 1 — MVP (.work core):**
Kanban board, roles/permissions, task lifecycle, Tell Me How with step checklists + card-scoped chat + correction flag, org workplace brief (AI grounding), dispute workflow (minimal flow), Tier 1 activity signals (activity-based idle + PWA push/SMS nudges), lightweight disclosure screen + `consent_records`, basic manager dashboard.

**Phase 1 → 2 gate (pre-committed):** run a 4–6 week pilot in the origin department. Greenlight Phase 2 only if (1) faculty delegate meaningfully more tasks than their pre-Jiminee baseline, and (2) ≥80% of assigned tasks reach Done without the manager personally chasing. Both metrics come free from `task_events`.

**Phase 2 — Monitoring:**
Desktop agent, screenshot classification pipeline, compliance scoring, consent/disclosure onboarding flow, retention controls.

**Phase 3 — .me product:**
Single-user mode, email/calendar/Obsidian connectors, AI board population, daily planning ritual, self-directed monitoring settings.

**Phase 4 — Advanced:**
Webcam presence, smart-glasses integration, per-org instruction memory, analytics/reporting exports.

---

## 7. Naming & Legal Contingencies

- "Jiminee" is a phonetic play, not Disney's mark, but Disney is litigious. **Decision (2026-07): accept the risk and proceed as Jiminee without a preemptive trademark search or filing; revisit only if challenged.** Fallback names if challenged: **Talking Cricket** (the character's name in Collodi's original *Pinocchio*, which is public domain), **Conscience Cricket**, or **Cricket Angel**. Avoid any Disney character likeness in branding; original cricket iconography only (no top hat, no umbrella, no Disney trade dress).
- Position .work marketing carefully: even the anticipated backlash is a funnel — controversy around the employer product drives awareness of the self-accountability .me product, which is the intended revenue engine.

---

## 8. Open Questions for the Build

Still open (all Phase 2+; none block the MVP):

1. Screenshot cadence and vision-model cost per worker-hour — needs a cost model before Tier 2 ships.
2. Client-side vs. server-side screenshot classification (privacy, cost, and latency tradeoffs).
3. Obsidian integration path: community plugin vs. Obsidian Sync API vs. local file watcher.
4. Does .me monitoring need the desktop agent at MVP, or is calendar/task-signal accountability enough to start?

Resolved:

5. ~~Pricing~~ → **Working hypothesis: per-worker seat for .work** (~$10–15/worker/month; managers and admins free; free pilot tier of 1 board / 5 workers). The meter matches the value story (each worker seat = recovered utilization) and matches where AI + monitoring costs accrue. .me freemium decision deferred to Phase 3.

---

## 9. Decision Log (grill session, 2026-07-12)

| Decision | Choice |
|---|---|
| Lead product / build order | **.work first** — live pilot in the origin department; .me remains the intended revenue engine but builds on a validated core |
| MVP magic moment | **Both halves** — specification (Tell Me How) and verification (Tier 1 signals) ship together in Phase 1 |
| Tier 1 idle detection | **Activity-based** (checkoffs/card activity/check-in recency), not app-focus heartbeat; nudges via PWA push + SMS fallback |
| Worker platform | **Desktop-first web app** (workers on laptops; updated 2026-07) + PWA for phones + Telnyx SMS fallback; no native app, no app-store review |
| Stack | **Next.js + Supabase + Vercel** (Postgres, Auth, RLS tenancy, Realtime from one service) |
| Tell Me How MVP scope | Steps + card-scoped chat + correction flag; corrections stored per-org now, cross-task retrieval deferred to Phase 4 |
| AI grounding | **Org "workplace brief"** injected into every Tell Me How prompt |
| Consent timing | **Lightweight disclosure screen in MVP** (Tier 1 is monitoring too); full framework in Phase 2 |
| Phase 2 gate | 4–6 week pilot: delegation volume up vs. baseline AND ≥80% tasks Done without manager chasing |
| Disputes | Staff supervisor recruited as Administrator pre-launch; minimal flag→rule→log flow |
| Pricing hypothesis | Per-worker seat, managers free |
| Name risk | **Accepted** — proceed as Jiminee, no preemptive search/filing, fallbacks documented |

---

## 10. Decision Log — .me product (grill session, 2026-07-12)

**Thesis:** *"Every morning I decide what matters, and Jiminee won't let me quietly drop those things."*

| Decision | Choice |
|---|---|
| Wedge | **Scattered-commitments aggregation + vigilance.** Founder is user #1; .me is a **calendar substitute** (founder doesn't keep one), not a calendar consumer. The board is an elaborate to-do list, not a schedule. |
| Architecture | **Not a fork.** Same codebase; a personal workspace IS an organization with `is_personal = true` — all RLS/mutations/audit-log/nudge machinery reuses. Only the task *source* differs (.work: manager assigns; .me: email/AI/self). |
| Primary task source | **Email triage** — a "triage lane" decision surface (inbox → board), not an email client, not silent auto-import. Gmail via test-user OAuth for dogfooding (defers Google security review). |
| Other sources | Obsidian (same extraction engine), **inbound task API** (founder's other apps push cards), calendar as pour-in only. |
| Card taxonomy | One-off to-dos · project tasks · **recurring daily commitments (habits)** with streaks (e.g., "Meditate for 15 minutes"). |
| Core loop | Morning **ritual** (commit to ≤5 picks) → **anti-rot** + **due-date** + **streak-risk** nudges chase them. Focus = self-declared "start" sessions (the schedule-free substitute for calendar blocks). |
| Monitoring | **Same level as .work — central, not optional** (otherwise "it's just a to-do list"). Screen-agent v1 = active-window/presence-scoped watching during focus sessions; v2 = screenshot+vision (shared with .work Phase 2 — .me is the safer place to build it first: willing subject, no consent/legal exposure). |
| Escalation | Warm → firm → tough_love ladder; user sets the **cap**, chasing always starts warm and climbs one rung per ignored nudge. Quiet hours respected. |
| Pricing | **Freemium.** Board + triage + ritual + habits free (the list is a commodity); **the conscience/vigilance layer (screen-agent + escalating nudges) is the paid tier** (~$8–12/mo). |

**Built 2026-07-12 (same session):** migration 0006 (personal workspaces, task taxonomy/recurrence, habit_completions, focus_sessions, me_settings, new audit events) · /today page (ritual + habit strip w/ streaks + focus bar) · /api/me/* (commit, habits/check, focus, focus/checkin) · /api/cron/me-sweep (anti-rot + today-slipping + streak-risk, escalation, quiet hours, push+SMS) · web presence watcher (Page Visibility + check-ins). 48 unit + 8 E2E green incl. the full .me loop. **Deferred to roadmap:** native active-window agent (Tauri), email triage pipeline, inbound task API, Obsidian, .me settings UI, Stripe.
