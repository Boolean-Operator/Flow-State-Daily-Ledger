<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Flow-State Daily Ledger repository guidance

## Project purpose

Flow-State Daily Ledger (FSDL) is a mobile-first personal planning application
for a daily Work and Personal ledger, scrum-standup preparation, projects,
Back Burner work, and deliberate planning reviews. The application is currently
a local-first beta backed by validated JSON data.

## Sources of truth

- The live repository is the source of truth for implemented behavior.
- `PLANS.md` owns the current roadmap, phase order, status, and unresolved
  product decisions.
- `docs/initial-build-planning-doc.md` owns the durable product vision and domain
  principles.
- `docs/wrap-up-day-planning.md` owns the detailed daily wrap-up, rollover,
  standup, morning-recovery, and related planning behavior.
- `docs/stage-two-notes.md` owns deferred beta improvements and future-stage
  candidates.
- `docs/starter-data-review.md` is historical import and transcription context,
  not the current roadmap.
- Chat history is supporting context, not an authoritative specification. Record
  accepted decisions in the appropriate repository document.

Avoid duplicating detailed requirements between these files. Link to the owning
document and keep summaries short.

## Start every task with a read-only preflight

1. Read this file and `PLANS.md`.
2. Read only the detailed planning documents relevant to the request.
3. Inspect `git status` and preserve all unrelated or user-authored changes.
4. Inspect the relevant implementation and tests before describing current
   behavior or proposing edits.
5. For Next.js work, follow the version-specific documentation requirement at
   the top of this file.

If planning documents and implemented behavior disagree, report the mismatch.
Do not silently treat an aspiration as an implemented capability.

## Domain invariants

- Maintain one canonical record per task. Daily Ledger, Weekly Radar, Rolling
  30-Day Radar, projects, Back Burner, and history are placements or views of
  that record, not copied task lists.
- Daily Ledger placement and Radar membership are independent.
- Standup items are presentation records. Editing or omitting a standup item
  must not rewrite the canonical task or its historical outcome.
- Completing and canceling are distinct outcomes and must remain distinguishable
  in history.
- Rollover operations must be validated, atomic, and idempotent so retries do not
  duplicate ledgers, placements, or standup items.
- Weekend ledgers keep Work and Personal planning but omit the Standup
  presentation unless the product plan is explicitly changed.
- Recommendations and deterministic rules must remain explainable and visibly
  distinct. Do not silently apply assistant recommendations.
- Preserve user control over local data and require explicit approval before
  sending ledger content to an external service.

## Implementation boundaries

- Preserve the normalized, SQL-oriented domain model while JSON persistence is
  used for the beta.
- Validate data at runtime on both reads and mutation boundaries.
- Keep server mutations in the data/action layer rather than embedding
  persistence behavior in presentation components.
- Treat local ledger data as user data. Do not replace, reset, migrate, or commit
  it merely to make development or tests convenient.
- Do not commit, push, deploy, install dependencies, or make external writes
  unless the user explicitly requests that action.
- Keep changes focused. Do not begin the next roadmap phase automatically after
  completing the requested one.

## Planning maintenance

- Update the owning detailed document when an accepted decision changes product
  behavior.
- Update `PLANS.md` when phase status, ordering, acceptance criteria, or an open
  decision materially changes.
- Mark uncertain claims as assumptions or open decisions.
- Mark work complete only after observing the implementation and its required
  verification evidence.

## Verification

Run checks proportional to the change and report the observed results:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build` for integration-sensitive or release-ready changes
- `git diff --check`

Add focused tests when test infrastructure covers the changed behavior. If a
relevant automated or visual check is unavailable, state that limitation and
provide a concrete manual verification path.
