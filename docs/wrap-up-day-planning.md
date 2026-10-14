# Wrap-Up Day: Planning and Implementation Notes

## Document Status

This is a living planning document for the hard-stop wrap-up and daily-rollover feature. It begins with the broad workflow and data rules already established in the initial build plan. Interaction details and implementation tasks will be refined as the feature is prototyped.

## Purpose

The wrap-up flow should help the user deliberately close the current day without losing unfinished work or turning rollover into list maintenance. It should:

- Review what was completed today.
- Require an explicit decision for every unfinished Daily Ledger task.
- Preserve the current day as an accurate historical record.
- Prepare the next Daily Ledger from those decisions.
- Create an editable Yesterday / Standup draft from completed Work tasks.

The initial version is deterministic application behavior. AI-generated summaries and recommendations are out of scope for this increment.

## Governing Rule: Wrap-Up Defines Sufficient Closure

The required wrap-up checklist is the complete minimum standard for closing the current ledger and creating the next one. If FSDL reports **Wrap-up complete**, the user has done enough to unlock the next ledger. There must not be a second, hidden standard after the guided procedure.

The required standard is historical closure, not perfect future planning:

- Every unfinished task has an explicit disposition.
- Completed task outcomes are recorded.
- The resulting rollover and standup draft have been previewed.
- The user has confirmed the proposed changes.
- The close-and-rollover operation has committed successfully.

The user does not need to perfect the standup draft, completely plan the next day, reorder every task, review Weekly Radar, or review aged tasks before the next ledger can be created.

Assistance may prepare or preselect proposed outcomes, but completing the automated or assisted processing is not enough by itself. The user must confirm the proposal unless a future governance setting explicitly grants FSDL authority to apply a narrow standing rule.

## Active Ledger Lifecycle

FSDL should maintain one active Daily Ledger at a time:

- Crossing midnight does not automatically close the ledger or relocate its tasks.
- Opening the application on a new date does not automatically create another active ledger.
- Unfinished tasks remain visible in their existing Work or Personal sections until wrap-up or recovery planning gives them an explicit disposition.
- The active ledger may therefore be dated earlier than the current calendar date. The UI must clearly identify this state.
- The active ledger must be closed through the required checklist before the next ledger becomes active.

This rule prevents tasks from silently appearing to fall into the Back Burner merely because the date changed and prevents multiple unresolved daily ledgers from accumulating.

## Entry Point and Overall Flow

The current Daily Ledger should provide a clear **Wrap up day** action. Selecting it opens a focused review rather than immediately changing any data.

The required flow has four broad stages:

1. **Review completed work**
   - Show completed Work tasks that will seed the next ledger's Yesterday / Standup section.
   - Keep completed Personal tasks in history, but exclude them from the standup draft.
2. **Resolve unfinished tasks**
   - Present every unfinished Work and Personal task from the current ledger.
   - Require one disposition per task: Mark Complete, Move to Tomorrow, Return to Back Burner, or Cancel.
3. **Preview the result**
   - Show the next ledger that will be created from the selected dispositions.
   - Show the draft Yesterday / Standup items created from completed Work tasks.
4. **Confirm and finish**
   - Summarize the effects of the selected dispositions.
   - Apply the rollover as one operation only after confirmation.

The user must be able to leave the flow before confirmation without partially closing the day.

After required closure, the flow may offer optional preparation without withholding or relocking the new ledger.

## Disposition Rules

### Completed

- The canonical task remains completed.
- The current Daily Ledger entry records a completed outcome.
- An unfinished task may be marked complete during wrap-up when its completion was not recorded earlier in the day.
- Completed Work tasks create draft standup items on the next ledger.
- Completed Personal tasks remain part of the current ledger's history only.

### Move to Tomorrow

- The current ledger entry records that the task was moved.
- The canonical task remains open.
- A new placement for the same canonical task is added to the next ledger.
- The task retains its Work or Personal section unless the user explicitly changes it later.

### Return to Back Burner

- The current ledger entry records that the task was deferred.
- The canonical task remains open and retains its project relationship, if any.
- No placement is created on the next ledger.
- The task remains available from the Back Burner or its project.

### Cancel

- The current ledger entry records a canceled outcome.
- The canonical task becomes canceled and receives a cancellation timestamp.
- No placement is created on the next ledger.

## Daily Rollover

Confirmation should perform the entire rollover atomically from the user's perspective:

1. Validate that the current ledger is still open and every unfinished entry has a disposition.
2. Record final outcomes on the current ledger entries.
3. Update the affected canonical tasks without creating duplicate task records.
4. Create the next active ledger.
5. Add placements for tasks marked Move to Tomorrow.
6. Generate draft standup items from completed Work tasks.
7. Close the current ledger and record its close time.
8. Navigate to the prepared next ledger or show a clear completion state.

Repeating the confirmation request must not duplicate next-day placements or standup items.

During an on-time evening wrap-up, the next ledger will normally be dated for the next calendar day. During morning recovery, it should be dated for the current day rather than creating ledgers for every skipped date. Skipping weekends or choosing the next configured workday remains an explicit product decision rather than an implicit rule.

## Optional Preparation After Closure

Once the required close-and-rollover operation succeeds, the same guided experience may continue into optional preparation. The user may:

- Add tasks from Weekly Radar.
- Search or browse Back Burner and active projects for tasks to pull into the new ledger.
- Add a selected task directly to Work or Personal without navigating away.
- Edit, remove, combine, or reorder standup draft items.
- Reorder the new ledger's Work and Personal tasks.
- Perform the small aged-item review when it is due.
- Continue into more detailed daily planning.

These activities must be clearly labeled optional and skippable. The new ledger already exists and is usable once required closure succeeds.

## Morning Planning and Recovery

Morning planning is always available, but it has two entry paths.

### Normal Morning Planning

When the previous wrap-up was completed, the user opens the prepared current-day ledger and may perform normal pre-planning activities:

- Review carried tasks and the standup draft.
- Add or remove tasks.
- Reorder tasks.
- Change Work or Personal placement.
- Pull tasks from Weekly Radar, Back Burner, or projects.

Wrap-up prepares a draft for the next day; it does not make that plan immutable.

### Recovery Morning Planning

When the previous ledger is still open, the application should open in a clear **Finish previous day** recovery state. The same required wrap-up checklist remains available in the morning and later until it is completed.

The user must finish historical closure before activating the current-day ledger. The rest of the application should remain accessible for viewing projects, Back Burner, and history, and urgent thoughts may be captured outside a Daily Ledger. Normal current-day task activity remains gated until recovery completes.

After recovery creates the current-day ledger, the user continues into the same normal morning-planning activities described above.

The first version should not include a routine **Skip** action. A future explicit emergency bypass should be considered only if real usage demonstrates a need.

## Weekly Radar in Daily Planning

Weekly Radar is a manually curated, persistent shortlist that bridges Back Burner and projects into daily planning. It is a view or placement of canonical tasks, not an independent copy of them.

- A task may be added to Weekly Radar from the Back Burner/project browser.
- A Radar task may be added directly to the Work or Personal section of the active ledger.
- Daily Ledger placement and Weekly Radar membership are separate decisions.
- A task placed on today's ledger may remain visible in Weekly Radar with a **Today** indicator.
- Completing or canceling a task removes it from the active Radar view.
- The first version should not automatically promote aged or due tasks into Weekly Radar.

The Daily Ledger should make task selection easier than a single long dropdown. The initial direction is a searchable, project-grouped browser with direct actions for Work, Personal, and Weekly Radar. Unfinished tasks from the most recently closed or recoverable ledger should be identified as recent carryover rather than presented as anonymous Back Burner items.

## Aged-Item Review

The weekly review should begin surfacing a small batch of tasks that may no longer be relevant. If this becomes burdensome, aged-task review can move to a dedicated Back Burner review performed once or twice per month.

Initial policy:

- A task becomes eligible after 30 days without review or meaningful activity.
- Show no more than the five stalest eligible tasks in one weekly review.
- Rotate through eligible tasks rather than presenting the entire stale backlog.
- Do not automatically add an aged task to Weekly Radar.

Review outcomes should include:

- **Still relevant:** retain the task and record an explicit review.
- **Add to Weekly Radar:** confirm that it deserves near-term attention.
- **Schedule:** assign an appropriate target or due date.
- **Move:** place it in the appropriate project or Back Burner location.
- **Cancel or Archive:** remove work that is no longer actionable or relevant.

Viewing, expanding, or opening a task does not count as explicit review. Explicit review means the user deliberately selected an outcome about whether the task still belongs in the system.

Task age should distinguish:

- `createdAt`: when the canonical task entered FSDL.
- `lastReviewedAt`: the last deliberate relevance decision.
- `lastActivityAt`: the last meaningful edit, scheduling, movement, deferral, or status change.

Staleness should be measured from the most recent applicable timestamp. The exact created date may appear in task details, while compact age labels can progressively surface only when useful.

## Yesterday / Standup Draft

Each completed Work task should initially produce one standup item using the task title as its summary and a reference to the canonical task. The generated result is a draft, not a locked transcript.

On the next Daily Ledger, the user may:

- Edit or reword a generated line.
- Add a manual standup item.
- Remove an item from the standup presentation without changing task history.
- Reorder or combine items as the interaction evolves.

The presentation should encourage roughly three to five primary points without enforcing a hard limit.

## Historical Integrity

Closing a day must freeze its meaning without severing its connection to canonical tasks:

- The original ledger and its entries remain available for later history views.
- Carrying a task forward does not remove it from the closed day.
- Later edits to a canonical task must not make the historical disposition ambiguous.
- Removing a generated standup item must not reopen or delete its source task.

The current schema already separates canonical tasks, daily ledger entries, ledgers, and standup items. The implementation should build on those records rather than introduce copied tasks.

## Initial UI Direction

The wrap-up experience should be mobile-first and optimized for a short end-of-day ritual:

- Use a dedicated focused view, sheet, or full-screen panel rather than embedding all controls in the normal ledger.
- Keep Work and Personal tasks visibly distinct.
- Make each unfinished task's selected disposition obvious.
- Provide sensible bulk actions, such as “Move all to tomorrow,” while keeping individual choices editable.
- Keep the final confirmation disabled until all unfinished tasks are resolved.
- Show exact counts in the confirmation summary.
- Make Cancel visually distinct and harder to select accidentally.
- Clearly distinguish the required closure checklist from optional preparation.
- If the active ledger is from a previous date, show a persistent recovery state rather than silently switching dates.
- Keep quick capture near the top of the normal Daily Ledger, but collapse it to a compact **Add a task…** control when idle.
- Hide Daily Ledger quick capture during the required wrap-up checklist and restore it during optional preparation after closure.

The normal Daily Ledger should clearly indicate when it is closed and should not allow further task mutations without a future, explicit reopen capability.

## Broad Implementation Slices

### Slice 1: Domain Operation

- Define the wrap-up request and result types.
- Add one data-layer operation that validates and commits the close-and-rollover transaction.
- Make the operation idempotent and reject edits to closed ledgers.
- Add targeted tests for every disposition and mixed Work / Personal days.

### Slice 2: Wrap-Up Interface

- Add the Wrap up day entry point.
- Build the completed-task review and unfinished-task disposition UI.
- Add review, confirmation, error, and success states.
- Verify the flow at phone-sized viewports first.

### Slice 3: Next-Day Experience

- Display the generated standup draft on the next ledger.
- Verify carried tasks appear once, in the correct section and order.
- Add or finish standup editing and ordering behaviors needed by the generated draft.
- Add a closed-day read-only presentation.

### Slice 4: Morning Planning and Recovery

- Stop creating a new ledger merely because the calendar date changed.
- Detect an active ledger from a previous date and present the recovery flow.
- Gate activation of the current-day ledger until required closure completes.
- Provide normal morning-preparation controls when wrap-up was already completed.

### Slice 5: Weekly Radar and Task Selection

- Add the Weekly Radar section as a canonical-task view.
- Replace the long task dropdown with searchable, project-grouped selection.
- Support direct placement into Work, Personal, or Weekly Radar.
- Identify recent unfinished tasks as carryover candidates.

### Slice 6: Aging and Review

- Add review/activity timestamps needed for staleness.
- Add the limited weekly aged-item review and explicit relevance outcomes.
- Evaluate whether the review remains useful or belongs in a monthly Back Burner ritual.

### Slice 7: History and Recovery

- Expose a basic way to view a closed ledger.
- Decide whether v0.1 needs a short undo window or an explicit reopen operation.
- Define safe recovery behavior for an interrupted or failed rollover.

## Initial Acceptance Criteria

- A day cannot close while any unfinished Daily Ledger task lacks a disposition.
- Completed Work tasks appear as editable standup draft items on the next ledger.
- Completed Personal tasks do not appear in that draft.
- Moved tasks appear once on the next ledger and still appear with a moved outcome in the closed ledger.
- Deferred tasks remain open in the Back Burner or their project and do not appear tomorrow.
- Canceled tasks are marked canceled and do not appear tomorrow.
- Closing the same ledger twice cannot duplicate data.
- A closed ledger rejects ordinary task, placement, and standup mutations.
- Abandoning the flow before confirmation leaves the current ledger unchanged.
- Completing the required wrap-up checklist always creates and unlocks the next ledger without requiring optional planning steps.
- Crossing midnight leaves the existing ledger and its tasks active until wrap-up or recovery is completed.
- Only one Daily Ledger is active at a time.
- If wrap-up was missed, the same required procedure remains available the next morning.
- If wrap-up was completed, morning planning allows the prepared ledger to be adjusted normally.
- Optional preparation may be skipped without invalidating closure.
- Weekly Radar and Daily Ledger placements reference the same canonical task.
- Merely viewing an aged task does not record it as reviewed.

## Open Decisions

- Should “tomorrow” mean the next calendar day or the next configured workday?
- Should completed Work tasks be selected for the standup draft by default, or should all be included automatically and edited afterward?
- Should Move to Tomorrow preserve the current ordering, and how should carried tasks merge with tasks already on the next ledger?
- Does v0.1 need undo or reopen, and what changes remain safe after a ledger is reopened?
- Should the wrap-up flow allow a task's Work / Personal section to change while it is being carried forward?
- Where should closed-day history live before a fuller history screen exists?
- Which task changes should update `lastActivityAt`, and should any of them also imply explicit review?
- On which day should the weekly review be offered, and how should optional deferral be presented?
