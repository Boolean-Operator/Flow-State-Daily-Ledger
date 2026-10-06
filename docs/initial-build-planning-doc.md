# Flow-State Daily Ledger: Initial Build Plan

## Document Status

This is a living planning document for the Flow-State Daily Ledger (FSDL). Decisions will be refined as the product is prototyped and tested. Features may be retained, revised, deferred, or removed based on actual use.

## Product Vision

FSDL blends the existing Todo Sync application with the daily operating rhythm of the analog steno-pad ledger. It is not intended to become a generic collection of disconnected to-do lists.

The system should help its user:

- Decide what matters today.
- Prepare for a Scrum standup.
- Maintain focus during the workday.
- Keep work and personal commitments visible but distinct.
- Close the workday deliberately.
- Retain future tasks without allowing them to clutter today's ledger.

## Guiding Principles

### Today Means Today

The Daily Ledger contains only tasks selected for the current day. Projects, someday items, and other "Eventually Do" work belong in the Backburner until they are intentionally surfaced.

### Preserve the Analog Layout

The initial digital layout should preserve the useful mental separation of the steno-pad system:

- Work / Standup tasks
- Personal / Home tasks

These should be visibly distinct sections rather than a single list differentiated only by labels.

### Mobile First

All UI and interaction decisions will begin with a phone-sized viewport. Wider layouts for laptops and desktops will progressively enhance the same core experience.

### Build for Experimentation

The product will be developed iteratively. Sections and features should be modular enough to test, reconsider, revise, or remove without destabilizing the underlying task data.

### One Task, One Record

The analog system accumulates daily pages, weekly Post-it notes, overflow notes, and long Backburner lists. Tasks can consequently be lost, duplicated, or repeatedly rewritten, and maintaining the lists becomes work of its own.

FSDL must maintain one canonical record for each task. Today, Weekly Radar, Backburner, Project, and history screens are views or placements of that record, not separate copies. Moving or surfacing a task changes its state or placement while preserving its history.

The product should reduce list administration rather than reproduce paper accumulation digitally.

### Capture First, Organize Progressively

The photographed analog Backburner demonstrates how a single capture surface naturally accumulates several different kinds of material:

- Standalone actionable tasks
- Multi-step projects and project notes
- Completed or obsolete items
- Hard-dated commitments
- Items merely targeted for attention
- Learning resources and curriculum ideas
- Shopping and parts lists
- Duplicates copied from other pages

FSDL should allow quick, low-friction capture without demanding complete organization up front. It should then help progressively clarify the captured material through short review moments.

The system should:

- Separate canonical tasks, projects, project steps, reference notes, and completed history.
- Suggest likely project groupings and duplicate matches for review.
- Surface stale or ambiguous items without repeatedly interrupting the user.
- Preserve the original captured wording while allowing a clearer actionable title.
- Avoid requiring every task to have a due date, category, project, or urgency score at creation time.
- Keep organizational suggestions reversible and governed by the user.

### Human Approval for External Services

Personal or work-related content must not be sent to an external AI or other outside service automatically. Before any transmission, FSDL must show what information will be sent and require explicit user approval.

### User-Governed Assistance

FSDL is intended to become a user-governed personal assistant, not an autonomous task manager with a fixed authority level. The user should eventually be able to control assistance by capability, including whether FSDL may:

- Observe and analyze particular categories of ledger data.
- Offer recommendations only.
- Prepare changes for review.
- Apply narrowly defined deterministic rules automatically.
- Place suggested items in Weekly Radar or the Daily Ledger.
- Contact or transmit data to an external service.

Governance settings should be understandable, revocable, and conservative by default. FSDL should explain why it made a recommendation or performed an allowed action and retain a history of automated changes.

Governance must not create approval fatigue or another layer of list administration. FSDL should:

- Learn and apply the user's explicit standing rules without repeatedly asking the same question.
- Batch uncertain recommendations into short, intentional review moments.
- Integrate reviews into existing rituals such as morning kickoff, hard-stop wrap-up, and weekly planning.
- Avoid interrupting the user during flow-state work unless an item is genuinely time-critical.
- Make the common path fast while keeping exceptions reversible.
- Measure success by reduced task-administration effort, not by the number of assistant interactions.

## Initial User and Devices

- Initial product user and tester: one person
- Primary development machine: MacBook Pro
- Initial delivery form: browser-based application
- Future target devices:
  - Linux Mint 22 personal desktop
  - macOS work laptop
  - Android phone
- Broader multi-user or packaged cross-platform distribution will be considered only after a solid MVP exists.

## v0.1 Objective

The goal of v0.1 is to validate the core FSDL workflow and mobile-first UI using local development data. It is not yet the hosted, synchronized product.

### Daily Ledger

- Show only today's actionable tasks.
- Provide separate Work / Standup and Personal / Home sections.
- Support creating, editing, completing, ordering, and removing daily tasks.
- Do not include free-form notes or ideas in the first prototype.

#### Initial Daily Page Implementation

The first Daily Ledger page is implemented as the application's home screen. It includes:

- The current date and a reserved Yesterday / Standup area.
- Mobile-first Work / Standup and Personal / Home sections.
- Quick capture directly into either section.
- Completion, title editing, section switching, and manual ordering.
- Removal from today without deleting the canonical task.
- An explicit picker for pulling active Backburner or project tasks into today.

This is the starting interaction model for testing, not a permanent UI commitment. The hard-stop and daily-rollover workflows remain the next major Daily Ledger increment.

### Hard-Stop Wrap-Up

At the end of the day, unfinished Daily Ledger tasks remain part of that day's historical record and require an explicit disposition:

- Move to Tomorrow
- Return to Backburner
- Cancel

Completing the hard-stop flow creates or prepares a fresh Daily Ledger for the next day. Completed work tasks should be available as the source for a copyable end-of-day summary. Automatic AI summarization remains a future feature.

### Daily Rollover and Standup Automation

The analog ledger establishes a two-part daily page:

1. A standup recap at the top containing completed work from the previous workday.
2. The current day's working ledger below it.

FSDL should reproduce this automatically. Closing a day creates the next Daily Ledger according to the actions taken during the hard-stop wrap-up:

- Completed Work tasks are used to generate the next ledger's editable "Yesterday / Standup" recap.
- Tasks marked Move to Tomorrow appear as open tasks in the appropriate Work or Personal section of the next ledger.
- Tasks marked Return to Backburner leave the active daily view and become available in the Backburner.
- Tasks marked Cancel remain in the historical ledger with a canceled disposition and do not appear on the next day.
- Completed Personal tasks remain in the historical record but do not appear in the work standup recap.

This core rollover is deterministic application behavior and does not require an external AI service. A future assistant may help rewrite or summarize the standup recap, but it must show the proposed content and obtain approval before transmitting ledger data outside FSDL.

The system should preserve an audit trail: carrying a task forward must not erase its presence or outcome on the original day.

The generated "Yesterday / Standup" recap is an editable draft. Before standup, the user may reword, combine, add, reorder, or omit recap lines without changing the underlying task history.

The recap should be optimized for approximately three to five primary standup points. This is a presentation guideline, not a hard limit. A larger accomplishment may include supporting subtext beneath its primary point so the recap remains concise without losing useful context.

### Backburner and Projects

- Hold tasks that are intended for eventual action but are not part of today.
- Support priorities.
- Support categorization.
- Explore grouping related tasks into projects.
- Allow a backburner task to be intentionally surfaced in the Daily Ledger.
- Avoid requiring the user to duplicate or rewrite a task when it appears in a different view.
- Preserve the original task and its movement history when it is scheduled, surfaced, deferred, or completed.

#### Priority and Urgency

FSDL will begin with two separate signals:

- **User Priority:** A stable integer from 1 through 5 that represents user-assigned importance.
- **Calculated Urgency:** A temporary score from 0 through 100 derived from signals such as deadlines, task age, deferral history, project state, and eventually a decision model such as Jev.

The calculated urgency score must not be treated as authoritative truth or false precision:

- Hard deadlines and explicit user decisions take precedence.
- The UI may present broad urgency bands such as Critical, High, Medium, and Low while retaining the numeric score for ordering.
- A calculated score should include its reason, calculation time, calculation method or model version, confidence when applicable, and any manual override.
- Scores should be recalculated when relevant state changes rather than retained permanently as an unquestioned ranking.
- The user must be able to override or disregard the calculated urgency.

This model is an initial testing hypothesis. It should be simplified, changed, or removed if maintaining or interpreting it creates more work than value.

### Weekly Radar

The Weekly Radar remains a candidate feature for surfacing Backburner tasks that should receive attention during the current week. It must be a generated view of canonical tasks, not a second list containing duplicated tasks. Its exact placement and interaction model are intentionally undecided and should be tested in the mobile-first prototype.

A task may become eligible for the Weekly Radar through several paths:

1. The user explicitly promotes it to the Weekly Radar.
2. It has a hard due date that falls within the relevant time window.
3. It is the next actionable step in an active project.
4. FSDL recommends it based on signals such as priority, age, previous deferrals, project state, or available context.

Weekly Radar eligibility and Daily Ledger placement are separate decisions. A radar item may be intentionally pulled into today, while a future automation or assistant may propose daily placement.

Deterministic rules and agentic recommendations must remain distinguishable in the UI. The system should show why an item surfaced, for example "Due Thursday," "Next project step," or "Suggested: high priority and waiting 18 days."

### Rolling 30-Day Radar

FSDL should explore an additional generated planning view beyond the Weekly Radar. The Rolling 30-Day Radar surfaces upcoming deadlines, targeted project steps, and assistant recommendations before they become urgent. Its window advances every day rather than resetting at calendar-month boundaries.

Like the Weekly Radar, this must be a view of canonical tasks rather than another independently maintained list. Items should flow toward Weekly Radar and the Daily Ledger through state or scheduling changes, without being copied or rewritten.

Undated tasks may be manually added to the Rolling 30-Day Radar. This creates a renewable attention window, not a fake due date:

- FSDL records when the task entered the Radar and assigns a review date 30 days later.
- The task is not labeled overdue when the attention window expires.
- At expiration, the task enters a short review with four choices: keep for another 30 days, schedule it, return it to Backburner, or cancel it.
- FSDL must not silently renew, remove, or cancel the task.
- Project containers should surface only relevant next actions rather than every project task.

The UI should explain why each item is present, using reasons such as Due, Planned, Project Next Step, Suggested, or Manually Added.

The Radar should use a soft capacity warning rather than a hard item limit. Its purpose is to encourage focus without preventing the user from retaining necessary commitments.

## v0.1 Technical Approach

- Reuse the existing Next.js, React, TypeScript, and Tailwind application as the foundation.
- Use local JSON-file persistence while developing and validating the initial UI/UX.
- Use GitHub as the source of truth for code shared between development machines.
- Keep machine-specific development data out of Git.
- Do not implement offline synchronization in v0.1.

The v0.1 JSON store uses a normalized, SQL-oriented schema rather than nesting task records inside lists. It contains top-level collections for projects, canonical tasks, daily ledgers, daily-ledger placements, radar placements, and standup items. The current project and Back Burner screens are read models built from those canonical records.

Runtime schema validation protects local data reads and writes. Imported fields that do not fit the current domain rules are retained as source metadata rather than silently discarded or forced into a misleading value. This shape is still a prototype, but it is intentionally close to the relational tables anticipated for PostgreSQL.

## Post-v0.1 Hosting Phase

After the workflow produces a viable v0.1:

- Add authentication.
- Replace JSON-file persistence with a hosted PostgreSQL database.
- Evaluate authentication, database, and hosting providers at that time. Clerk and Neon are familiar reference options, not predetermined choices.
- Deploy a hosted browser application.
- Make the same ledger available from the MacBook, Linux desktop, and Android phone.
- Address synchronization behavior before adding offline editing.

### Service Selection Principles

- Keep the application on free service tiers while usage and reliability requirements permit.
- Prefer services with a practical free tier for a single-user application.
- Keep the FSDL domain model and business rules independent of any authentication, database, hosting, or AI vendor.
- Prefer standard, portable technologies such as PostgreSQL and ordinary web authentication protocols where practical.
- Avoid premature infrastructure complexity during the local v0.1 UI/UX phase.
- Reevaluate cost, limits, data export, privacy, and migration difficulty before adopting a hosted service.

## Future Features

The following ideas are explicitly outside the first v0.1 prototype:

- Free-form daily notes and ideas
- Voice-to-text capture
- AI-assisted categorization
- AI-assisted Backburner triage
- AI-generated standup or end-of-day summaries
- Configurable assistant permissions and automation rules
- Explainable recommendations and an assistant-action history
- Offline use and later synchronization
- Notifications and reminders
- Native or packaged mobile/desktop applications
- Multi-user support

Any AI integration must follow the external-service approval principle described above.

## Open Product Questions

- What information and controls must appear on a Daily Ledger task?
- How should Backburner categories and priorities work?
- How should projects and project tasks be represented?
- Where should Backburner and Projects live in the mobile navigation?
- Which deterministic rules may place tasks automatically, and which recommendations require confirmation?
- What is the minimum morning kickoff and hard-stop workflow for v0.1?
