# Flow-State Daily Ledger: Stage Two Notes

## Document Status

This is the single working backlog for capabilities and design work intentionally deferred until after the first functional Daily Ledger and Wrap-Up Day beta. Items here are candidates for evaluation, not automatic commitments. They may be promoted, revised, combined, or discarded based on beta use.

The [initial build plan](./initial-build-planning-doc.md) remains the source for product vision, governing principles, and v0.1 scope. The [Wrap-Up Day plan](./wrap-up-day-planning.md) remains the source for the current close-and-rollover rules.

## Beta Validation Tracks

Beta validation is divided into two tracks without creating separate applications or abandoning the mobile-first design principle.

### Track 1: Local Desktop Workflow

Use the MacBook browser-based application as the primary daily driver to validate:

- Daily capture, editing, completion, ordering, and removal.
- Standup preparation and presentation.
- End-of-day dispositions, rollover, and missed-day recovery.
- Whether the workflow reduces task administration in actual daily use.
- Data reliability, backup expectations, and recovery from interrupted operations.

Local JSON remains the intentional persistence layer throughout this track. Moving to a database is not required for beta validation.

### Track 2: Mobile Experience

After the desktop workflow is dependable, validate the same application at phone-sized viewports and then on an actual Android device when the application is reachable from that device. This track should evaluate:

- Touch-target size and spacing.
- Control density and discoverability.
- Keyboard, textarea, and selection behavior on a phone.
- Wrap-up completion without excessive scrolling or precision tapping.
- Alternatives to hover-only guidance.
- Readability of Standup, Work, Personal, and recovery states.

Mobile beta does not require offline synchronization or a native mobile application. Cross-device data synchronization remains a later delivery concern.

## Known Beta Deficiencies and Intentional Divergences

### Local Data Isolation

Using JSON during beta is intentional and remains consistent with the initial technical approach.

The initial tracking deficiency was resolved on October 19, 2026:

- `data/example-ledger.json` is the committed, sanitized starting fixture.
- `dummy-data.json` is the Git-ignored active local beta store.
- `local-backups/` is ignored, and the README documents initialization, backup,
  and restore procedures.

This separation prevents routine ledger activity from becoming a source-code
change. Git and GitHub do not back up the active ledger, so important backups
must also be copied outside the repository.

### Historical Integrity

The current model preserves daily placements and final outcomes, but historical meaning can still be weakened because canonical task titles remain editable and hard deletion can remove Daily Ledger entries.

The original rationale for preserving wording and movement history was to:

- Keep a closed ledger understandable even after the canonical task is renamed or reorganized.
- Prevent Carry Forward, Return, completion, or cancellation from erasing what happened on an earlier day.
- Support accurate standup preparation and later reflection on repeated deferrals or blockers.
- Give future recommendations enough context to distinguish neglected work from intentionally deferred work.

A comprehensive event-sourcing or audit system is not required for beta. The minimum beta safeguard should be narrower:

- Continue preserving each Daily Ledger placement and final outcome.
- Do not physically delete tasks or ledger entries that are referenced by closed history; archive them instead.
- Observe whether changing task titles causes real historical confusion before adding title snapshots or a fuller movement log.

### Data Ownership, Archiving, and Deletion

Archiving and deletion represent different user intentions and should remain separate concepts:

- `archivedAt` means **retain this record, but remove it from active work**. Archiving should be the default preservation-oriented action for completed, canceled, or no-longer-relevant tasks that may still have historical value.
- `deletedAt` means **move this record to Trash and exclude it from normal views**. This state remains reversible and also serves as the deletion tombstone needed to prevent an older synchronized device from restoring the record accidentally.

The eventual task lifecycle should make the scope and consequence of each action explicit:

1. **Remove from Today** removes only the current Daily Ledger placement.
2. **Archive Task** retains the canonical task and its history while removing it from active lists.
3. **Move to Trash** sets `deletedAt` and allows the user to restore the task.
4. **Permanently Delete** is available from Trash and requires a clear confirmation describing the affected history.

Trash should not expire automatically during beta. A later synchronized product may offer a user-selected retention policy such as Never, 30 days, or 90 days.

Permanent deletion must be a genuine option under the principle that users own their data. When a deleted task is referenced by a closed ledger, remove the canonical task's private content while retaining only the minimum structural historical fact needed to keep the ledger intelligible, without retaining its title or description. Any delay caused by backup retention must be disclosed, bounded, and included in the product's deletion policy.

The current task model has an `ARCHIVED` status but no `archivedAt` timestamp. Add `archivedAt` and `deletedAt` when lifecycle and synchronization work begins; they are not required for the current JSON beta.

### Verification Coverage

- The mobile-first interface has not yet received systematic real-device validation.
- The rollover and recovery rules do not yet have automated regression tests despite their effect on historical data.
- The current JSON write operation is validated and atomic at the file-replacement level, but beta still needs a documented backup and interrupted-write recovery check.

## Stage Two Goals

- Establish a unified design architecture before adding more one-off interface patterns.
- Use beta observations to refine the daily workflow instead of preserving features only because they have been implemented.
- Improve planning and historical visibility without recreating the list-maintenance burden of the analog system.
- Keep automation explainable, reversible, and governed by the user.

## Unified Design Architecture

### Framework and Foundations

- Evaluate shadcn/ui, Base UI, or another component framework before expanding the shared component layer.
- Define design tokens for color, typography, spacing, borders, radii, elevation, and motion.
- Establish reusable Button, IconButton, input, textarea, select, card, panel, dialog, sheet, and notification primitives.
- Reduce repeated Tailwind class combinations without hiding important interaction behavior behind overly abstract components.
- Preserve mobile-first behavior while progressively enhancing laptop and desktop layouts.

### Interaction States and Accessibility

- Replace native `title` tooltips with responsive, accessible tooltips if beta testing confirms the browser-controlled delay remains distracting.
- Show custom tooltips quickly on pointer hover and immediately on keyboard focus.
- Preserve descriptive `aria-label` text, visible focus states, and predictable keyboard navigation.
- Define touch-friendly alternatives for guidance that cannot depend on hover.
- Standardize loading, pending, disabled, validation, error, empty, success, and confirmation states.
- Apply the selected patterns consistently across Standup, Work, Personal, Projects, Back Burner, and future Radar views.

### Beta Components to Revisit

- Treat standup-item delete with Undo as a beta feature. Retain it while manual standup items remain useful, then decide whether delete, archive, or no removal is the correct long-term behavior.
- Standardize the current Undo notification through the future notification/toast primitive.
- Review icon density and responsive control placement after the Daily Ledger has been used on both phone and desktop viewports.
- Revisit whether arrow-based ordering remains sufficient or whether an accessible drag-and-drop pattern would add meaningful value.

## Daily Ledger and Standup Evolution

### Reportable Progress

- Separate standup reporting from task completion.
- Allow an unfinished Work task to remain open and carry forward while producing a linked standup item describing meaningful progress.
- During wrap-up, offer an explicit **Include progress in standup** choice for carried Work tasks.
- Require an editable progress summary when that choice is selected rather than automatically reporting every carried task.
- Support reportable blockers and work context, such as an all-day planning meeting, without requiring a completed task.
- Keep standup items as presentation records; editing or removing one must not alter the canonical task or historical task outcome.

### Rollover, History, and Recovery

- Decide whether “tomorrow” should support the next configured workday and weekend skipping rather than always using the next calendar day.
- Add a usable closed-ledger history view.
- Decide whether closed ledgers need a narrowly governed reopen capability and which edits remain safe after reopening.
- Define recovery behavior for interrupted or partially failed rollover operations.
- Evaluate whether Carry Forward should allow changing Work / Personal placement during wrap-up.
- Preserve or deliberately merge task ordering when carried tasks join tasks already placed on the destination ledger.

### Morning and Optional Preparation

- Replace the long task dropdown with searchable, project-grouped task selection.
- Support direct placement into Work, Personal, or Weekly Radar from the same planning surface.
- Identify recent unfinished tasks as carryover candidates instead of presenting them as anonymous Back Burner items.
- Keep optional preparation clearly separate from the required close-and-rollover checklist.

### Task, Project, and Back Burner Structure

- Decide which information and controls belong on the compact Daily Ledger task and which belong in expanded task details.
- Refine how Back Burner categories, user priority, calculated urgency, and target dates should work together.
- Define how projects, project steps, and project reference notes are represented without turning every project into another manually maintained list.
- Evaluate the implemented Today / Plan / Help navigation and area-based planning views through mobile and desktop beta use.
- Keep deterministic placement rules visibly distinct from assistant recommendations that require confirmation.

## Planning and Review Capabilities

### Weekly Radar

- Add Weekly Radar as a manually curated view of canonical tasks rather than a duplicated list.
- Allow tasks to remain on Weekly Radar while also appearing on a Daily Ledger, with a clear Today indicator.
- Remove completed and canceled tasks from the active Radar view.
- Explain why deterministic or recommended items surfaced.

### Rolling 30-Day Radar

- Evaluate a rolling planning view for upcoming deadlines, project next steps, and manually selected attention items.
- Treat manual placement as a renewable attention window, not a fake due date.
- Provide an explicit review when an attention window expires rather than silently renewing or removing the task.

### Aged-Item Review

- Add `lastReviewedAt` and `lastActivityAt` semantics before calculating staleness.
- Test a small review batch, initially no more than five stale items.
- Support explicit outcomes such as Still Relevant, Add to Weekly Radar, Schedule, Move, Cancel, or Archive.
- Evaluate whether this belongs in weekly planning or a less frequent Back Burner review.
- Decide which day should offer the review and how optional deferral should be presented.

## Assistance and Automation Candidates

- Free-form daily notes and ideas.
- AI-assisted categorization and Back Burner triage.
- AI-assisted standup and end-of-day summarization with proposal review before use.
- Configurable assistant permissions and narrowly scoped automation rules.
- Explainable recommendations and an assistant-action history.
- Notifications and reminders, including an optional end-of-day wrap-up reminder.

### Voice Capture and Control

Treat voice as a progressive mobile input capability rather than granting an assistant broad control immediately:

1. **Dictation:** allow voice-to-text capture anywhere a task or standup item can be entered. Show the transcript for review before saving.
2. **Confirmed commands:** interpret narrowly scoped requests such as adding a Personal task, placing a Work item in a project, moving an item between planning views, renaming a list or project, or marking a named task complete. Resolve named destinations explicitly and show the proposed action before applying it.
3. **Conversational assistance:** support multi-step planning and organization, such as reviewing a project, editing several items, or preparing a proposed set of moves. Require a preview for ambiguous, multi-item, destructive, or structural changes, then apply the confirmed proposal atomically.

Voice controls must remain optional, touch- and keyboard-equivalent, and reversible. Applied commands should offer Undo and appear in the assistant-action history. FSDL must not continuously listen, silently apply an ambiguous command, or transmit audio, transcripts, or ledger context to an external service without the disclosure and approval required by the user's governance settings. When on-device transcription is available and adequate, prefer it over external transmission. Permanent deletion should require an explicit non-voice confirmation even when initiated conversationally.

Any external AI or service integration must continue to show what data will be transmitted and require the level of approval defined by the user's governance settings.

## Delivery and Infrastructure Candidates

- Move from local JSON persistence to authenticated hosted storage when multi-device use becomes a real requirement.
- Evaluate PostgreSQL, authentication, hosting, data export, privacy, and migration costs at that time.
- Add an account Settings surface with a preferred wrap-up time and timezone. Migrate the beta's 6:00 PM device-local default to that profile preference once accounts exist.
- Keep the in-app wrap-up prompt preference separate from notification delivery and permission settings.
- Support the same ledger across the MacBook, Linux desktop, and Android phone.
- Define synchronization behavior before enabling offline editing.
- Evaluate native or packaged desktop and mobile applications after the browser workflow is stable.
- Consider multi-user support only if the product scope expands beyond the initial single user.

## Promotion Rule

Before a Stage Two item becomes implementation work, record:

- The beta observation or user need it addresses.
- The smallest testable increment.
- Its effect on canonical task and ledger history.
- Accessibility and mobile implications.
- Whether it replaces an existing beta feature.
- The acceptance criteria that determine whether it should be retained.
