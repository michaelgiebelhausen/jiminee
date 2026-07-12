# Product Vision — Jiminee

## 1. Vision & Mission

### Vision Statement

A world where delegating a task to a novice costs less than doing it yourself — so every hour of low-autonomy labor actually produces work, and every worker gets a patient coach instead of an exasperated boss.

### Mission Statement

Jiminee makes delegation economical by pairing a shared Kanban board with an AI that writes the instructions and a friendly conscience that keeps claimed tasks moving.

### Founder's Why

Mike Giebelhausen is a marketing professor at Clemson whose department shares a small pool of student administrative assistants. The arrangement fails in a way anyone who has supervised student workers will recognize: writing instructions explicit enough for a novice takes longer than doing the task, so faculty stop delegating. The students, under-tasked and unsupervised, default to their phones. When work is assigned, some of it gets refused as "not my job" — and there's no mechanism to resolve that, so it just ends the conversation. The effective cost per useful action is absurd, and everyone involved is vaguely resentful.

Mike's insight is that this isn't a lazy-worker problem — it's a transaction-cost problem. The bottleneck is the manager's cost of specifying tasks and verifying follow-through. Attack both costs and the whole arrangement flips: AI makes specification nearly free, and lightweight activity monitoring makes verification nearly free.

He's unusually well-suited to this. He lives the pain daily and his own department is the pilot customer — the tightest possible feedback loop. And as a consumer-psychology academic, he owns the product's hardest non-technical problem: monitoring software lives or dies on whether it *feels* like support or surveillance. That's a framing and messaging problem before it's an engineering one, and framing is his field.

### Core Values

**The worker's dignity is a feature, not a constraint.** Every nudge, disclosure, and dashboard is written as if the worker will read it — because they will. Monitoring copy never accuses; it asks. If a design decision makes a worker feel policed, it's the wrong design even if it ships faster.

**One sentence in, a checklist out.** The manager's effort ceiling is one terse sentence per task. Any feature that quietly pushes instruction-writing back onto the manager (preview-and-edit gates, mandatory fields, templates to fill) violates the core promise and gets cut.

**Evidence over vibes.** The pilot has a pre-committed pass/fail gate (delegation up vs. baseline, ≥80% tasks done without chasing). Product decisions cite `task_events` data, not anecdotes. If the gate fails, the product changes — it doesn't get a rationalized second chance.

**Consent ships with the feature, not after it.** Any capability that observes a worker ships in the same release as its plain-language disclosure. This was true for Tier 1 in the MVP and stays true through screenshots and webcams. It's both the ethical line and the press-cycle defense.

**Simple enough to debug with AI.** The founder is non-technical and builds with Claude Code. Boring, well-documented architecture (Next.js + Supabase, one codebase) beats clever architecture every time. If a component can't be understood by reading it aloud to an AI assistant, it's too clever.

### Strategic Pillars

**Coach first, cop second.** When coaching (Tell Me How) and accountability (monitoring) compete for attention or scope, coaching wins. The instruction-writing AI is what workers *want* to use; monitoring is what managers *need*. Products workers hate get sabotaged from below.

**.work proves it, .me monetizes it.** The B2B product validates the core loop with a captive pilot and generates the case study and the controversy; the consumer self-accountability product is the intended revenue engine. Don't optimize .work for revenue prematurely — optimize it for evidence.

**Exceptions, not status meetings.** Managers should only hear from Jiminee when something needs them: a dispute, an unanswered nudge, a stuck task. Every notification is a withdrawal from a limited attention account. Default to silence.

**Ship the fall pilot.** The summer sprint has one deadline that matters: student workers return in late August. Every scope debate resolves in favor of whatever gets a working pilot into the department by the start of the semester.

### Success Looks Like

Twelve months from now: the origin-department pilot passed its gate in October — faculty delegation up meaningfully from baseline, 84% of tasks reaching Done without a manager chasing — and the writeup circulates as a one-page case study. Three more Clemson departments run pilots in the spring. Phase 2's desktop monitoring agent and full consent framework are in development, informed by real pilot friction rather than speculation. The Tell Me How button has generated a few thousand checklists, and the correction log is becoming the seed corpus for per-org instruction memory. Revenue is still near zero, on purpose — but the .me waitlist has a few hundred names on it, drawn by exactly the "AI conscience" story .work was designed to generate, and the founder can demo the magic moment in thirty seconds flat on his phone.

## 2. User Research

### Primary Persona

**Dr. Elena Reyes, 48, Associate Professor.** Shares three student admin assistants with six colleagues in her department. Her days are triage: teaching, committee meetings, grant deadlines. She keeps a mental (sometimes Post-it) list of small tasks — restock the printer, courier a signature packet, scan a stack of exams, update a bulletin board — that she almost never delegates, because by the time she's explained where the supplies are and what "done" means, she could have done it twice. She's moderately tech-comfortable: fluent in email, Canvas, and Google Docs; has never used Trello and doesn't want to learn project management software. Her current strategy is doing tasks herself and quietly resenting it. Emotionally, she's not angry at the students — she's frustrated at the *system* that pays for their hours and gets nothing. She'd switch to anything that lets her type one sentence and trust that the task either happens or she finds out why. What she will not do: write instructions, watch dashboards, or attend a training.

### Secondary Personas

**Tyler, 20, student administrative assistant.** Works 10 hours a week at the department front desk, mostly between classes. Has never fixed a printer jam, doesn't know where the mail room is, and would rather ask his phone than a professor who might make him feel dumb. He's not lazy so much as unguided — when a task is clear and checkable, he does it. He works from the front-desk laptop (with his phone always nearby), so Jiminee meets him in the browser first and on his phone as backup.

**Pat, 52, staff supervisor (the Administrator).** Formally responsible for the student workers; practically, the referee everyone escalates to. Pat configures the org, fills out the workplace brief, rules on "not my job" disputes, and owns the compliance view. Pat's buy-in is a pilot prerequisite — a dispute mechanism without a committed neutral referee is a queue where flags rot. Pat's fear: this tool creates more work. Pat's win: a paper trail that makes performance conversations factual instead of he-said-she-said.

**The department chair (economic buyer, later).** Doesn't use the product but approves it and eventually pays for it. Cares about utilization of budgeted student-worker hours, and about not appearing in a headline about surveilling students.

### Jobs To Be Done

**Functional jobs.** When I think of a small task, I want to capture and assign it in under fifteen seconds, so it doesn't die on a Post-it. When a novice claims my task, I want them to get complete site-specific instructions without me writing them. When a task stalls, I want the system to intervene before I have to. When a worker refuses a task, I want a ruling and a record, not a stalemate.

**Emotional jobs.** (Manager) I want to delegate without the low-grade dread that I'll have to check up on it — trust without vigilance. (Worker) I want to do unfamiliar tasks without having to admit ignorance to a professor — competence without embarrassment. The card-scoped chat is a judgment-free place to ask "what's a toner cartridge?"

**Social jobs.** (Manager) I want to be seen as someone who runs a functional operation, not a micromanager standing over students. (Worker) I want my completed-task record to speak for me at reference time. (Supervisor) I want disputes settled by documented rulings, so I'm an arbiter rather than the person everyone lobbies.

### Pain Points

1. **Specification cost exceeds task value** (severe, daily). Writing novice-proof instructions takes longer than the task. Current workaround: don't delegate. Consequence: paid worker-hours produce nothing; this is the pain that created the product.
2. **No follow-through visibility** (severe, every delegation). Once assigned, a task enters a void until the manager discovers at 5pm it never happened. Current workaround: physically checking in, which costs the time delegation was supposed to save.
3. **Idle workers on phones** (moderate-severe, constant). Without a visible queue and a nudge mechanism, the default state of a student worker is Instagram. Workaround: none that isn't awkward.
4. **"Not my job" dead ends** (moderate, weekly). Refusals have no resolution path, so tasks silently die and resentment accumulates. Workaround: the manager gives up or escalates informally, with no record either way.
5. **No instruction reuse** (moderate, recurring). Every printer jam is explained from scratch to each new worker every semester. Workaround: none — institutional knowledge lives in whoever happens to be around. (MVP stores corrections; full instruction memory is Phase 4.)

### Current Alternatives & Competitive Landscape

**Email/verbal requests (the incumbent).** Free, universal, and zero-friction to send — but tasks vanish into inboxes, there's no queue, no status, no instructions, and no record. Switching cost: near zero, which is Jiminee's opening.

**Shared spreadsheet or paper list.** Gives a queue, nothing else. Nobody updates it, nobody is notified, and it can't tell a student how to do anything. Falls apart within weeks.

**Trello/Asana/Monday.** Excellent boards for self-directed knowledge workers. They assume the assignee can decompose a task themselves — exactly what low-autonomy novices can't do. No instruction generation, no nudging, no dispute mechanism. Also enterprise-priced and training-heavy for a use case where workers churn every semester.

**Hubstaff/Time Doctor/ActivTrak (employee monitoring).** Surveil screens and hours but help no one do the work. They answer "was the worker active?" while Jiminee answers "did the task happen, and if not, what intervened?" Monitoring without coaching is exactly the adversarial dynamic Jiminee is designed to avoid.

**Do nothing (do it yourself).** The strongest competitor. It's reliable, immediate, and requires no setup. Jiminee beats it only if posting a card is genuinely faster than the task — which is why the one-sentence ceiling is a core value, not a nice-to-have.

### Key Assumptions to Validate

1. **We assume AI-generated steps grounded in a one-page workplace brief are accurate enough for novices to follow unaided**, because modern LLMs handle procedural decomposition well. To validate: track correction-flag rate per generated checklist during the pilot; >20% flagged means grounding needs more than a brief.
2. **We assume managers will actually post tasks to a board instead of defaulting to email**, because posting is faster than explaining. To validate: count tasks posted per faculty member per week against the pre-pilot baseline interview; this is literally the gate metric.
3. **We assume students will install a PWA and grant push/SMS**, because onboarding is supervised at hire. To validate: measure install and permission-grant completion during onboarding week; below ~90% forces the SMS-only path.
4. **We assume nudges change behavior rather than just annoy**, because a visible, tap-to-confirm prompt makes ignoring work a deliberate act. To validate: compare task-stall duration before/after first nudge; also watch for nudge fatigue (response rate decay week over week).
5. **We assume the supervisor will rule on disputes promptly**, because it reduces their informal-referee burden. To validate: dispute time-to-ruling during pilot; >48h median means the workflow needs escalation or reminders.
6. **We assume Tier 1 signals (no screenshots) are enough accountability for the pilot to pass its gate**, because most idleness is friction and ambiguity, not defiance. To validate: the gate itself — if delegation rises but completion stays low with workers claiming-then-stalling, Tier 2 moves up the roadmap.
7. **We assume a university department can adopt this without a procurement/IRB/HR blockade**, because it's a free pilot of a task tool with disclosed, minimal monitoring. To validate: clear it with the supervisor and department chair before onboarding; this is a Phase-0 checklist item, not a launch-day surprise.
8. **We assume the .work story generates .me demand**, because self-accountability is the socially acceptable face of the same mechanism. To validate: put a .me waitlist link in the .work footer from day one and count signups.

### User Journey Map

**Awareness.** Dr. Reyes hears about Jiminee in a faculty meeting — Mike demos the magic moment live in ninety seconds. Emotion: skeptical amusement ("an AI conscience named after the cricket?") shading into recognition ("wait, it writes the instructions?").

**Consideration.** Her objection isn't features, it's effort: "I don't have time to learn a tool." The answer lands because the manager surface is deliberately tiny: type a sentence, get notified about exceptions. She agrees to try it for one semester because the pilot is free, the supervisor runs onboarding, and quitting costs nothing.

**First use.** She posts "Scan and email me the signed forms in my mailbox" from her laptop in under a minute. Friction point: remembering the board exists instead of reflexively emailing — the habit moat of the incumbent. Mitigation: the manager digest email surfaces her board activity, closing the loop that email never did.

**Magic moment.** Tyler claims her card, taps Tell Me How, and follows six steps that reference the actual mailroom location and the actual scanner (from the workplace brief). He hits a jam, asks the card chat, gets unstuck without contacting her. She sees the card slide to Done with a checked-off list she never wrote. Emotion: the small shock of delegation that *worked*.

**Habit formation.** Within three weeks she's posting tasks from her phone as she thinks of them. The nudge system quietly handles the stalls she used to discover at 5pm. Her Post-it list disappears. Friction to watch: task supply — if faculty run out of delegable tasks, the board goes quiet and workers disengage; the supervisor's standing-task backlog (bulletin boards, supply audits) keeps the queue primed.

**Advocacy.** At the end of the semester she tells the chair the assistants "actually work now," and the gate metrics back her up. Two colleagues in other departments ask for the link. The case study writes itself from `task_events`.

## 3. Product Strategy

### Product Principles

1. **The manager's ceiling is one sentence.** Any workflow requiring more manager input than a terse sentence per task is a regression, whatever it adds.
2. **Never let the worker feel dumb.** Steps are calibrated to someone who has never done the task; the chat answers "obvious" questions without judgment; nudges ask, never accuse.
3. **Activity, not surveillance, at Tier 1.** Idle detection reads task activity (checkoffs, card events, check-in recency) — never app focus, screen contents, or location. The MVP earns trust it will spend in Phase 2.
4. **Every intervention is logged, every log has a reader.** `task_events` is the single source of truth feeding the dashboard, the gate metrics, dispute paper trails, and the case study. If an event isn't worth logging, question the feature.
5. **Silence is the default manager experience.** Notifications are exceptions (disputes, unanswered nudges, stuck tasks) — never routine status.
6. **Boring architecture wins.** One Next.js codebase, Supabase for everything server-side, no microservices, no queues until pain demands them. The founder must be able to debug this with AI assistance.

### Market Differentiation

Task tools and monitoring tools have split the market between them, and both halves fail the low-autonomy workplace. Trello, Asana, and Monday assume the assignee can self-direct — decompose the task, know the context, manage their own follow-through. Student workers and front-desk staff can't, which is why those boards go stale in exactly these settings. Monitoring tools (Hubstaff, Time Doctor, ActivTrak) watch activity but contribute nothing to the work itself; they create an adversarial dynamic where workers optimize for *appearing* busy, and they answer a question ("were they active?") that managers don't actually care about. The manager's real question is "did the task happen, and if not, what intervened?"

Jiminee's differentiation is structural, not incremental: it is the only tool that lowers both transaction costs of delegation simultaneously — specification (AI writes the novice-proof instructions from one sentence) and verification (activity-based nudging escalates only genuine exceptions). Each half makes the other defensible. Monitoring without coaching is spyware; coaching without accountability is a suggestion box. Together they form a loop where the worker is helped before they're checked on, which is why workers tolerate — and with the chat, actually like — a tool that also reports their throughput. The defensibility deepens over time: every correction a manager makes trains per-org instruction memory (Phase 4), an asset that doesn't transfer to a competitor and gets more valuable with every task completed.

### Magic Moment Design

The magic moment: *a manager types "restock the printer in Brackett 214," and thirty seconds later a student who has never done it is following nine site-specific steps — and when they stall, the cricket chirps before the manager ever has to.*

For this to happen reliably, four things must be true in the MVP. First, generation quality is site-specific, which means the workplace brief must exist before the first Tell Me How call — so the brief is a mandatory step of org onboarding, not an optional setting. Second, generation latency stays inside the worker's patience window (streaming the steps as they generate makes even ten seconds feel instant). Third, the steps render as checkable items in the browser — desktop-first, since workers do office tasks from laptops, with the phone PWA as a secondary surface. Fourth, the nudge fires without any human watching — the idle-detection job and push/SMS pipeline are part of the moment, not an accessory.

Shortest path from signup to the moment: org created → brief filled (20 min, supervisor) → workers invited during a supervised onboarding session (PWA install + disclosure + first fake task, ~10 min each) → first real card posted. A new org should be able to reach its first magic moment inside one afternoon. Since the pilot department is the founder's own, the true first-moment path is even shorter — which is exactly why the pilot exists before any external sale.

### MVP Definition

**In scope (buildable July–August by a solo founder with Claude Code):**

1. **Org + roles + auth.** Supabase Auth with email/magic-link invites; memberships carry manager/administrator/worker roles; RLS scopes everything to the org. *Done =* three real roles can sign in and see role-appropriate views of one shared board. Essential: nothing else works without it.
2. **Kanban board with real-time sync.** Five columns (Backlog → To Do → Doing → Blocked/Flagged → Done), dnd-kit drag-and-drop, card fields per the spec, multi-manager posting, Supabase Realtime. *Done =* two browsers see each other's moves live; a card's full lifecycle is logged to `task_events`. Essential: it's the substrate.
3. **Tell Me How.** Button on every card → Claude generates numbered checkable steps grounded in the workplace brief; steps stream in; card-scoped follow-up chat; "these instructions were wrong" flag notifies the manager and stores the correction. *Done =* the magic moment demos on a phone. Essential: it *is* the specification-cost half of the thesis.
4. **Workplace brief.** Guided one-page org setup form (locations, systems, supplies, who-to-ask); injected into every generation prompt. *Done =* generated steps reference real rooms and real equipment. Essential: without grounding, Tell Me How produces confident filler and burns worker trust.
5. **Tier 1 accountability.** Check-in/out timestamps; activity-based idle detection (no checkoffs/activity/check-in for X minutes, X derived from estimated duration); nudges via web push (desktop browser primary, installed phone PWA secondary) with Telnyx SMS fallback; tap-to-confirm counts as activity. *Done =* a claimed-then-abandoned task produces a nudge on a locked phone within the window. Essential: it's the verification-cost half of the thesis.
6. **Dispute workflow (minimal).** Flag-with-required-reason → card to Blocked/Flagged → administrator notified → ruling (reassign/uphold/dismiss) with required note → all logged. *Done =* a full dispute round-trip exists in the paper trail. Essential: "not my job" dead ends are a named origin pain.
7. **Disclosure + consent record.** One plain-language screen at worker onboarding; acknowledgment stored in `consent_records`. *Done =* no worker can use the board without an acknowledgment on file. Essential: the pilot's HR defensibility.
8. **Manager dashboard (basic).** Time-in-column, per-worker completed/stalled counts, nudge response history, dispute log. *Done =* the two gate metrics are computable from the UI without SQL. Essential: the pilot is unmeasurable without it.
9. **Voice settings.** Warm-conscience copy everywhere by default; per-user opt-in Tough Love mode for one's own nudges (self-selected, off by default, toggleable, invisible to managers). *Done =* nudge copy switches per user preference. Cheap to include since nudge copy is templated anyway — and it's the brand.

**Out of MVP but in Phase 1's spirit:** PostHog wiring beyond gate metrics, polished empty states, manager digest email. Include if the sprint runs ahead of schedule, cut without guilt otherwise.

### Explicitly Out of Scope

**Tier 2 screen verification (desktop agent, screenshots, vision classification).** Tempting because it's the headline differentiator and the fundable demo. Deferred because it's legally regulated surveillance requiring a real consent framework, a separate desktop app, and a cost model — and because the pilot must first prove Tier 1 isn't enough. Reconsider: immediately after the pilot gate passes (Phase 2, ~Q4 2026).

**Tier 3 presence verification (webcam, smart glasses).** Same logic as Tier 2, more so. Reconsider: Phase 4, and only with real customer pull.

**The .me product entirely** (AI board population, email/calendar/Obsidian connectors, daily planning ritual). Tempting because it's the revenue engine and the founder wants it. Deferred because it's a different GTM, a large integration surface, and it inherits a validated core loop only if .work actually validates one. Reconsider: Phase 3, after Phase 2 is underway (~early 2027).

**Per-org instruction memory (cross-task retrieval of corrections).** Tempting because it's the long-term moat. Deferred because retrieval quality with near-zero corrections looks broken; the MVP stores corrections so Phase 4 is a retrieval feature, not a migration. Reconsider: when the correction corpus exceeds a few hundred entries.

**Payments/billing.** The pilot is free by design; Stripe integration before there's a payer is pure speculation. Reconsider: first paying org, post-gate.

**Native mobile apps, compliance scorecard with thresholds, SLA/escalation on disputes, multi-board-per-org UI.** Each is real future work; none is needed by a five-worker pilot. The schema supports multiple boards from day one; the UI exposes one.

### Feature Priority (MoSCoW)

- **Must have:** org/auth/roles; Kanban board + realtime; card fields + activity log; Tell Me How (steps + chat + correction flag); workplace brief; activity-based idle detection; push/SMS nudges; dispute flag→ruling flow; disclosure/consent record; gate-metric dashboard.
- **Should have:** Tough Love voice toggle; manager digest email; PostHog event instrumentation; onboarding checklists for supervisor; board filtering/search.
- **Could have:** priority auto-sorting; estimated-duration suggestions from the AI; task templates for recurring standing tasks; CSV export of task_events; .me waitlist footer link.
- **Won't have (this time):** Tier 2/3 monitoring; desktop agent; compliance scoring thresholds; instruction-memory retrieval; .me integrations; payments; native apps; multi-org federation; analytics exports.

### Core User Flows

**Flow 1 — Delegate a task (manager).** Trigger: Dr. Reyes thinks of a task. Steps: open Jiminee (phone or laptop) → New Card → type "Restock the printer in Brackett 214" → optionally set priority/due/duration → post to Backlog or To Do. Outcome: card visible to all workers in real time; creation logged. Success criteria: under 30 seconds from thought to posted card; zero required fields beyond the title sentence.

**Flow 2 — Claim, learn, do, done (worker).** Trigger: Tyler checks the board between classes. Steps: open PWA → claim card into Doing (check-in logged) → tap Tell Me How → steps stream in → follows and checks off steps → hits a snag, asks card chat → completes final step → drags card to Done (check-out logged). Outcome: task done without manager contact; full step-level record. Success criteria: a novice completes an unfamiliar task with zero manager interaction; every checkoff timestamped.

**Flow 3 — Stall → nudge → resolve (system).** Trigger: a Doing card shows no activity for its idle window. Steps: system sends push nudge ("Still on the mail run? Tap to confirm — or drop the card back if something came up") → no response in 15 min → SMS fallback → worker taps confirm (activity logged) or releases the card (returns to To Do) or keeps ignoring → unanswered nudge surfaces on manager dashboard. Outcome: stalls self-resolve or escalate with evidence. Success criteria: nudge lands on a locked phone; every branch logged; manager sees only the unresolved case.

**Flow 4 — Dispute (worker → administrator).** Trigger: Tyler thinks a task isn't his job. Steps: flag with required reason → card to Blocked/Flagged → Pat notified → Pat rules reassign/uphold/dismiss with required note → parties notified, card routed accordingly. Outcome: refusals become rulings with a paper trail. Success criteria: median time-to-ruling under 48h during pilot; zero disputes resolved outside the system.

### Success Metrics

**Primary (the gate):** tasks delegated per manager per week vs. pre-pilot baseline. Good = clearly above baseline and sustained; great = 3× baseline by pilot end. Paired with: **% of assigned tasks reaching Done without manager intervention** (no manual chase recorded). Good = 80% (the gate); great = 90%+.

**Secondary:** Tell Me How usage rate (% of claimed cards where steps are generated — good 60%, great 85%); correction-flag rate (good <20% of generations, great <8%); nudge response rate within 15 minutes (good 60%, great 80%); dispute median time-to-ruling (good <48h, great <12h); weekly active workers / onboarded workers (good 80%, great 100%).

**Leading indicators (first two weeks):** PWA install + permission grant completion at onboarding (target ≥90%); cards posted in week one (target: every participating faculty posts ≥3); time-to-first-magic-moment per worker (target: during onboarding session itself).

### Risks

1. **Managers don't change the email habit** (likelihood: high; impact: fatal to the gate). The board only beats email if it's reflexive. Mitigation: supervised onboarding for faculty too, a standing-task backlog so the board is never empty, and the digest email that makes board activity visible where faculty already live — their inbox.
2. **Tell Me How is confidently wrong about site-specifics** (medium; high — one bad checklist burns novice trust). Mitigation: mandatory workplace brief before first generation, correction flag with manager notification, and pilot-week spot checks of generated steps by the supervisor.
3. **Nudge fatigue → learned deafness** (medium; medium). If nudges fire too often they become noise. Mitigation: idle window derived from estimated duration rather than fixed; nudge cadence capped; response-rate decay monitored weekly as a first-class metric.
4. **University HR/procurement/IRB friction blocks or delays the pilot** (medium; high — the 90-day goal dies). Mitigation: disclosure/consent in MVP, supervisor and chair sign-off as a Phase-0 checklist item before student onboarding, framing as a departmental task tool with disclosed activity signals — no screenshots, no location, no camera.
5. **The supervisor doesn't engage** (low-medium; high for the dispute loop). Mitigation: recruit Pat before the build finishes; make Pat's surface small (rule on disputes, keep the backlog stocked); position the paper trail as Pat's win.
6. **Summer sprint slips past the fall onboarding window** (medium; high — the pilot loses its natural start-of-semester onboarding moment). Mitigation: ruthless MoSCoW discipline, the roadmap's phase gates, and a mid-August scope-cut checkpoint where anything not blocking the magic moment gets deferred.
7. **Sample-size theater** (certain; medium). A 3-worker, 7-faculty pilot proves direction, not statistics. Mitigation: honesty in the case study — report the gate as observed behavior change plus qualitative quotes, and expand to 2–3 departments before claiming generality.
8. **Disney reacts to the name** (low; medium now, higher post-.me-launch). Accepted risk per the decision log: proceed as Jiminee, original cricket iconography only, no Disney trade dress; fallback names documented. Revisit at .me public launch.

## 4. Brand Strategy

### Positioning Statement

For managers of hourly novice workers who can't afford the time to write instructions or chase follow-through, Jiminee is the AI-coached task board that makes delegation cheaper than doing it yourself. Unlike project boards that assume self-directed workers and monitoring tools that watch without helping, Jiminee writes the instructions, keeps the task moving, and only escalates real exceptions.

### Brand Personality

Jiminee is the conscience on your shoulder — if your conscience were genuinely on your side. Picture a small, dapper, slightly wry mentor: patient with beginners, never sarcastic at their expense (unless explicitly invited — see Tough Love), incapable of passive aggression, and quietly precise when talking to authority. In conversation with a worker, it sounds like the good supervisor everyone remembers from their first job: "here's how you do it, ask me anything, I'll check on you later." In conversation with a manager, it drops the warmth for crisp factuality — numbers, timestamps, no editorializing about workers. It would never say "we noticed you've been unproductive." It would say "this card's been quiet for a while — everything okay?" It wears something tidy but approachable — a vest, not a badge. The one thing it never does: pretend it isn't watching. Jiminee is candid about exactly what it observes, because a conscience you can't trust is just a spy.

And the cricket has moods: users who *ask for it* can flip their own nudges to Tough Love — full Triumph the Insult Comic Dog energy. This is always self-selected, always private, always reversible. The roast is a gift you give yourself, never one the boss gives you.

### Voice & Tone Guide

The voice is constant — warm, plain, candid, lightly wry. The tone shifts by audience and stakes: playful with workers in routine moments, sober in consent and dispute contexts, neutral with managers always. Tough Love replaces the worker-nudge tone only, only for users who opted in.

| Context | DO | DON'T |
|---|---|---|
| Worker onboarding | "Hi! I'm Jiminee. I'll show you how to do things and check in if a task goes quiet. Here's exactly what I record — and what I never look at." | "Welcome! Your activity will be monitored in accordance with organizational policy." |
| Nudge (default) | "Still on the mail run? Tap to confirm — or drop the card back if something came up." | "You have been inactive on TASK-42 for 25 minutes. Please respond." |
| Nudge (Tough Love, opt-in) | "One checkbox in an hour? Riveting pace… for me to POOP on! Tap if you're actually alive." | Any roast copy shown to a user who didn't opt in, or any roast referencing the manager, coworkers, or consequences. |
| Error state | "Couldn't generate steps just now — give it another tap. If it keeps failing, the card still works the old-fashioned way." | "Error 500: LLM request failed." |
| Empty state (worker) | "No open tasks right now. Enjoy it — I'll chirp when something lands." | "No data to display." |
| Success / task done | "Done and logged. Six steps, no casualties. Nice work." | "Task status updated successfully." |
| Manager dashboard | "3 tasks completed today. 1 nudge unanswered 40+ min — Tyler, 'Scan signed forms.'" | "Tyler's productivity score has declined." (No scores, no character judgments — events only.) |
| Dispute flow | "Flag sent to Pat with your reason. You'll hear back here — nothing happens without a ruling." | "Your refusal has been reported to your supervisor." |
| Consent screen | "Jiminee records when you claim and finish tasks, and may send reminders. Your manager sees task activity — never your screen, camera, or location." | Burying capture details in a linked policy document. |
| Marketing copy (.work) | "Your workers aren't lazy. Delegating is just too expensive. We fixed the price." | "AI-powered workforce productivity surveillance solution." |

### Messaging Framework

**Tagline:** *Delegation that costs one sentence.*

**Homepage headline:** "Type the task. Jiminee writes the instructions, coaches the worker, and chirps when things stall." Sub: "For teams whose workers need a guide, not another empty board."

**Value propositions:** (1) *Stop writing instructions* — one sentence becomes a novice-proof, site-specific checklist. (2) *Stop chasing follow-through* — activity-based check-ins nudge stalled work before you ever hear about it. (3) *Stop replaying "not my job"* — disputes get a referee, a ruling, and a record.

**Feature descriptions:** Tell Me How ("every task comes with a patient expert attached"); the Nudge ("a friendly chirp, not a compliance alert"); the Paper Trail ("performance conversations built on events, not memory"); the Workplace Brief ("teach Jiminee your building once; every checklist knows it forever").

**Objection handlers:** *"Isn't this surveillance?"* — Tier 1 reads task activity only: claims, checkoffs, completions. No screenshots, no camera, no location, and workers see the same disclosure you do. *"My workers won't use an app."* — They're already on their phones; Jiminee just puts the queue where their thumbs are, and onboarding takes ten supervised minutes. *"AI instructions will be wrong."* — They're grounded in your workplace brief, workers flag anything wrong, and you're notified with one tap to correct. *"I don't have time for another tool."* — Your entire job is typing one sentence. That's the product.

### Elevator Pitches

**5-second:** Jiminee is a task board where AI writes the instructions and a friendly cricket keeps workers on task.

**30-second:** Managers of student workers and front-desk staff stop delegating because explaining a task takes longer than doing it — and then nobody checks whether it happened. Jiminee fixes both: type one sentence, and the AI turns it into a step-by-step checklist a novice can follow; if the task stalls, the worker gets a friendly nudge before you ever have to chase. Tasks either get done or you find out exactly why.

**2-minute:** Every shared office has the same dirty secret: the student workers and front-desk staff we pay by the hour produce almost nothing — not because they're lazy, but because delegation is uneconomical. Writing instructions explicit enough for a novice takes longer than the task, and verifying follow-through means standing over people. So managers do the work themselves, workers sit on their phones, and everyone quietly resents the arrangement. Jiminee attacks both transaction costs at once. A manager types one sentence — "restock the printer in room 214." Our AI, grounded in a one-page brief about your workplace, expands it into numbered steps a first-week student can follow, with a chat for the questions they're too embarrassed to ask a professor. If the claimed task goes quiet, Jiminee nudges the worker on their phone — warmly, like a conscience, not a compliance system — and only escalates to the manager when something genuinely needs them. Refused tasks get a referee and a ruling instead of a dead end. We're piloting in the founder's own university department this fall against a pre-committed gate: delegation volume up, and 80% of tasks done without chasing. Why now: LLMs just made instruction-writing free, and that flips the economics of an entire labor category nobody builds for. The B2B product proves the loop; the consumer self-accountability version — same cricket, pointed at your own goals — is the growth engine behind it. We're raising nothing yet; we're collecting evidence. Watch the gate.

### Competitive Differentiation Narrative

The task-management market and the employee-monitoring market are both enormous, and they don't overlap — because they serve opposite theories of the worker. Trello, Asana, and Monday assume workers who self-direct: give them a board and they'll decompose, prioritize, and follow through. Hubstaff, Time Doctor, and ActivTrak assume workers who must be watched: log their screens and hours, and productivity will follow from fear. Low-autonomy hourly workers — student assistants, front-desk staff, the shared support pools of every campus and clinic — are failed by both. They can't self-direct (so boards go stale), and surveillance without help just teaches them to look busy. Jiminee is built on a third theory: workers do the work when the task explains itself and follow-through is expected — visibly, fairly, and kindly. So we made specification free (one sentence in, a grounded checklist out) and verification gentle (activity-based nudges, exceptions-only escalation, disputes with a referee). Coaching makes the accountability tolerable; accountability makes the coaching consequential. Incumbents can't easily follow: the board companies would have to admit their product assumes a worker their biggest untapped segment doesn't have, and the monitoring companies would have to build a product workers *like* — a brand position they've already burned. And every correction a manager logs trains that org's instruction memory, a compounding, non-transferable asset that makes the thousandth task cheaper than the first.

## 5. Visual Design

Visual design tokens (colors, typography, spacing, components, motion) live in `docs/design.md`. That file does not exist yet — run the Design System skill with image references to generate it before building. Raw references are already in the repo: `design/colors1_work.jpg`, `design/colors2_me.jpg`, and the cricket logo SVGs in `design/logos/` (original cricket iconography only — no Disney trade dress).
