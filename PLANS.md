# Flow-State Daily Ledger roadmap

## Purpose

This file is the concise source of truth for current project status, ordered
delivery phases, and unresolved decisions. Detailed product behavior remains in
the documents linked below.

## Planning sources

- [Initial build plan](docs/initial-build-planning-doc.md): product vision,
  principles, initial domain, and technical direction.
- [Wrap-up day planning](docs/wrap-up-day-planning.md): active-ledger lifecycle,
  hard-stop wrap-up, rollover, standup draft, recovery, Weekly Radar integration,
  and aged-item review.
- [Stage Two notes](docs/stage-two-notes.md): beta validation, known
  deficiencies, later planning capabilities, assistance, and infrastructure.
- [Starter data review](docs/starter-data-review.md): historical import context
  and unresolved transcription questions.

## Current state — October 19, 2026

The repository contains a local-first Next.js beta with a normalized,
runtime-validated JSON store. Implemented foundations include canonical tasks,
projects and system planning collections, Work and Personal Daily Ledger
placements, standup presentation records, and task-management actions.

The working tree also contains substantial uncommitted application and planning
changes related to wrap-up, rollover, standup controls, navigation, Help, and
weekend presentation behavior. These changes are **in progress** until they are
reviewed, verified, and checkpointed in Git.

Weekly Radar has a schema-level foundation through `radarEntries`, but it does
not yet have a complete read/write data layer, server actions, or user interface.

Local data isolation is now established: `dummy-data.json` is the ignored active
store, `data/example-ledger.json` is the sanitized committed fixture, and the
README owns the JSON beta initialization, backup, and restore procedure.

## Ordered roadmap

### Phase 0 — Reconcile and checkpoint the beta

**Status:** In progress

**Objective:** Establish one trustworthy repository baseline before adding a new
planning surface.

**In scope:**

- Review the existing uncommitted code and planning changes as one coherent beta
  checkpoint.
- Verify wrap-up, rollover, standup, weekend, Today / Plan / Help navigation, and
  local persistence behavior.
- Reconcile implementation claims in the planning documents with observed
  behavior.
- Preserve the established separation between the ignored local ledger and the
  committed sanitized fixture.
- Use the Codex project rooted at this repository for future application work.

**Acceptance criteria:**

- `npm run lint`, `npx tsc --noEmit`, and `git diff --check` pass.
- Integration-sensitive behavior receives a successful build and an appropriate
  manual smoke test.
- Local user data is preserved and its Git policy is explicit.
- Code and owning planning documents agree about the beta behavior.
- The reviewed checkpoint is ready for an explicitly authorized commit and push.

### Phase 1 — Weekly Radar v1

**Status:** Not started

**Objective:** Deliver a manually curated, persistent near-term shortlist without
duplicating tasks.

**In scope:**

- Read active Weekly Radar placements from canonical tasks.
- Add and remove Radar membership without moving, copying, completing, or
  canceling the task.
- Allow Radar tasks to be added to the active ledger as Work or Personal while
  remaining on Radar.
- Display a clear **Today** indicator for Radar tasks already placed on the active
  ledger.
- Remove completed and canceled tasks from the active Radar view while preserving
  history.
- Support deterministic manual ordering.
- Add entry points from Back Burner and project task actions.
- Document behavior in Help and add focused verification coverage.

**Non-goals:**

- Automatic promotion based on age or due dates.
- Assistant recommendations.
- Rolling 30-Day Radar.
- Aged-item review.

**Acceptance criteria:**

- A task has one canonical record regardless of how many views contain it.
- Radar membership and Daily Ledger placement can change independently.
- Add, remove, reorder, Today state, completion, cancellation, refresh, and retry
  behavior are verified without duplicate placements.
- Mobile and desktop layouts remain usable.

### Phase 2 — Daily planning and aged-item review

**Status:** Not started

**Objective:** Make morning and post-wrap-up planning efficient without turning
optional preparation into a closure requirement.

**Candidate scope:**

- Replace the long task dropdown with searchable, project-grouped selection.
- Offer direct placement into Work, Personal, or Weekly Radar.
- Distinguish recent carryover candidates from ordinary Back Burner tasks.
- Add explicit `lastReviewedAt` and `lastActivityAt` semantics.
- Test an optional review of no more than five stale tasks with explicit
  outcomes.

### Phase 3 — History and rollover hardening

**Status:** Not started

**Objective:** Strengthen recovery and historical integrity after beta use
reveals the real workflow.

**Candidate scope:**

- Add a usable closed-ledger history view.
- Define a narrowly governed reopen policy, if one is needed.
- Specify interrupted or partially failed rollover recovery.
- Decide whether rollover targets the next calendar day or next configured
  workday.
- Refine reportable in-progress work and carry-forward placement changes.

### Phase 4 — Later planning and hosted synchronization

**Status:** Deferred until the local workflow is validated

**Candidate scope:**

- Rolling 30-Day Radar and attention-window review.
- Explainable deterministic surfacing and opt-in assistant recommendations.
- Authentication and hosted PostgreSQL persistence.
- Multi-device synchronization and deployment.
- Carefully governed voice and assistant capabilities.

## Decisions already established

- Tasks are canonical records; lists, ledgers, Radar, and history are views or
  placements.
- Weekly Radar v1 is manually curated.
- Daily Ledger placement and Weekly Radar membership are independent.
- A Radar task may remain visible with a **Today** indicator.
- Completing or canceling a task removes it from the active Radar view.
- The first Radar version does not automatically promote aged or due tasks.
- Required daily closure stays separate from optional next-day preparation.
- Weekend ledgers retain Work and Personal while hiding Standup presentation.

## Open decisions

- Confirm whether Weekly Radar appears as a dedicated route within **Plan**, a
  panel embedded elsewhere, or both.
- Confirm whether v1 should show a soft focus/capacity warning.
- Decide how Radar removal history is exposed, if at all, in the beta UI.
- Decide which day offers aged-item review and whether it can be deferred.
- Decide when the beta is stable enough to replace JSON persistence with a hosted
  data store.

## Next approved planning target

Complete Phase 0 before implementing Weekly Radar. Once the beta checkpoint is
verified, resolve the Weekly Radar surface decision and create a focused
implementation plan for Phase 1.
