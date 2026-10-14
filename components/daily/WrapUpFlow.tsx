"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Inbox,
  X,
} from "lucide-react";
import { wrapUpDailyLedgerAction } from "@/lib/actions";
import { formatLedgerDate, getRolloverDateKey } from "@/lib/dates";
import {
  DailyLedgerView,
  DailyTaskView,
  WrapUpDisposition,
} from "@/lib/types";

const dispositionOptions: Array<{
  value: WrapUpDisposition;
  label: string;
  icon: typeof ArrowRight;
  selectedClassName: string;
}> = [
  {
    value: "COMPLETE",
    label: "Complete",
    icon: Check,
    selectedClassName: "border-emerald-500 bg-emerald-50 text-emerald-800",
  },
  {
    value: "MOVE",
    label: "Carry forward",
    icon: ArrowRight,
    selectedClassName: "border-blue-500 bg-blue-50 text-blue-800",
  },
  {
    value: "DEFER",
    label: "Return",
    icon: Inbox,
    selectedClassName: "border-amber-500 bg-amber-50 text-amber-800",
  },
  {
    value: "CANCEL",
    label: "Cancel",
    icon: X,
    selectedClassName: "border-rose-500 bg-rose-50 text-rose-800",
  },
];

function TaskMeta({ item }: { item: DailyTaskView }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-500">
      <span>{item.entry.section === "WORK" ? "Work" : "Personal"}</span>
      {item.projectTitle && <span>{item.projectTitle}</span>}
      {item.task.priority && <span>P{item.task.priority}</span>}
    </div>
  );
}

function CompletedReview({ items }: { items: DailyTaskView[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
      <header className="flex items-center justify-between bg-emerald-50 px-4 py-3 text-emerald-950">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="size-4" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
              Step 1
            </p>
            <h2 className="font-bold">Review completed work</h2>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-700">
          {items.length} for standup
        </span>
      </header>
      {items.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.entry.id} className="px-4 py-3">
              <p className="font-medium text-slate-900">{item.task.title}</p>
              <TaskMeta item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-5 text-sm text-slate-500">
          No completed Work tasks will be added to the standup draft.
        </p>
      )}
    </section>
  );
}

export default function WrapUpFlow({
  ledger,
  todayDate,
  onCancel,
}: {
  ledger: DailyLedgerView;
  todayDate: string;
  onCancel: () => void;
}) {
  const [decisions, setDecisions] = useState<
    Record<string, WrapUpDisposition>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const allItems = useMemo(
    () => [...ledger.work, ...ledger.personal],
    [ledger.personal, ledger.work],
  );
  const completedWork = ledger.work.filter(
    (item) => item.entry.outcome === "COMPLETED",
  );
  const completedPersonal = ledger.personal.filter(
    (item) => item.entry.outcome === "COMPLETED",
  );
  const unfinished = allItems.filter((item) => item.entry.outcome === "OPEN");
  const resolvedCount = unfinished.filter(
    (item) => decisions[item.entry.id],
  ).length;
  const allResolved = resolvedCount === unfinished.length;
  const nextDate = getRolloverDateKey(ledger.ledger.date, todayDate);
  const moved = unfinished.filter(
    (item) => decisions[item.entry.id] === "MOVE",
  );
  const deferred = unfinished.filter(
    (item) => decisions[item.entry.id] === "DEFER",
  );
  const canceled = unfinished.filter(
    (item) => decisions[item.entry.id] === "CANCEL",
  );
  const completedDuringWrapUp = unfinished.filter(
    (item) => decisions[item.entry.id] === "COMPLETE",
  );
  const standupCount =
    completedWork.length +
    completedDuringWrapUp.filter((item) => item.entry.section === "WORK").length;

  function choose(entryId: string, disposition: WrapUpDisposition) {
    setDecisions((current) => {
      if (current[entryId] !== disposition) {
        return { ...current, [entryId]: disposition };
      }

      const next = { ...current };
      delete next[entryId];
      return next;
    });
    setError(null);
  }

  function carryAllForward() {
    setDecisions(
      Object.fromEntries(
        unfinished.map((item) => [item.entry.id, "MOVE" as const]),
      ),
    );
    setError(null);
  }

  function finishWrapUp() {
    if (!allResolved) return;
    startTransition(async () => {
      try {
        setError(null);
        await wrapUpDailyLedgerAction(
          ledger.ledger.id,
          unfinished.map((item) => ({
            entryId: item.entry.id,
            disposition: decisions[item.entry.id],
          })),
        );
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The day could not be wrapped up. Please try again.",
        );
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 px-1 sm:px-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Required checklist
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Wrap up {formatLedgerDate(ledger.ledger.date)}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Complete these steps to prepare {formatLedgerDate(nextDate)}.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="size-4" />
          Ledger
        </button>
      </div>

      <CompletedReview items={completedWork} />

      {completedPersonal.length > 0 && (
        <p className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
          {completedPersonal.length} completed Personal task
          {completedPersonal.length === 1 ? " is" : "s are"} preserved in
          history and excluded from the standup draft.
        </p>
      )}

      <section className="overflow-hidden rounded-xl border border-blue-200 bg-white">
        <header className="flex items-center justify-between gap-3 bg-blue-50 px-4 py-3 text-blue-950">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              2
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Required
              </p>
              <h2 className="font-bold">Resolve unfinished tasks</h2>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-700">
            {resolvedCount}/{unfinished.length} resolved
          </span>
        </header>

        {unfinished.length > 0 ? (
          <>
            <div className="flex justify-end border-b border-slate-100 px-4 py-2">
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                <span className="text-xs text-slate-500">
                  Select again to clear a choice.
                </span>
                <button
                  type="button"
                  onClick={carryAllForward}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900"
                >
                  Carry all forward
                </button>
              </div>
            </div>
            <ul className="divide-y divide-slate-200">
              {unfinished.map((item) => (
                <li key={item.entry.id} className="space-y-3 px-4 py-4">
                  <div>
                    <p className="font-medium leading-snug text-slate-900">
                      {item.task.title}
                    </p>
                    <TaskMeta item={item} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {dispositionOptions.map((option) => {
                      const selected = decisions[item.entry.id] === option.value;
                      const Icon = option.icon;
                      const label =
                        option.value === "DEFER"
                          ? `Return to ${item.projectTitle ?? "Back Burner"}`
                          : option.label;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          title={label}
                          onClick={() => choose(item.entry.id, option.value)}
                          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center text-xs font-semibold transition sm:flex-row ${
                            selected
                              ? option.selectedClassName
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="truncate">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="px-4 py-5 text-sm text-slate-500">
            Every task already has a completed outcome.
          </p>
        )}
      </section>

      <section
        className={`overflow-hidden rounded-xl border bg-white ${
          allResolved ? "border-violet-200" : "border-slate-200 opacity-70"
        }`}
      >
        <header
          className={`flex items-center gap-2 px-4 py-3 ${
            allResolved
              ? "bg-violet-50 text-violet-950"
              : "bg-slate-50 text-slate-600"
          }`}
        >
          <span
            className={`flex size-6 items-center justify-center rounded-full text-xs font-bold text-white ${
              allResolved ? "bg-violet-600" : "bg-slate-400"
            }`}
          >
            3
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
              Preview
            </p>
            <h2 className="font-bold">Review the next ledger</h2>
          </div>
        </header>

        {allResolved ? (
          <div className="space-y-4 p-4 text-sm">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-xl font-bold text-emerald-900">
                  {completedDuringWrapUp.length}
                </p>
                <p className="text-xs text-emerald-700">completed now</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xl font-bold text-blue-900">{moved.length}</p>
                <p className="text-xs text-blue-700">carried forward</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-xl font-bold text-amber-900">
                  {deferred.length}
                </p>
                <p className="text-xs text-amber-700">returned</p>
              </div>
              <div className="rounded-lg bg-rose-50 p-3">
                <p className="text-xl font-bold text-rose-900">
                  {canceled.length}
                </p>
                <p className="text-xs text-rose-700">canceled</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-xl font-bold text-emerald-900">
                  {standupCount}
                </p>
                <p className="text-xs text-emerald-700">standup items</p>
              </div>
            </div>

            {moved.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-800">
                  {formatLedgerDate(nextDate)}
                </h3>
                <ul className="mt-2 space-y-1.5 text-slate-600">
                  {moved.map((item) => (
                    <li key={item.entry.id} className="flex gap-2">
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-blue-600" />
                      <span>{item.task.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-5 text-sm text-slate-500">
            <Clock3 className="size-4" />
            Resolve every unfinished task to unlock the preview.
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div
        className={`rounded-xl border bg-white p-4 shadow-sm transition ${
          allResolved ? "border-emerald-300" : "border-slate-200"
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            4
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Confirm
            </p>
            <h2 className="font-bold text-slate-900">
              {allResolved ? "Ready to finish wrap-up" : "Finish wrap-up"}
            </h2>
          </div>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {allResolved
            ? "All unfinished tasks have an outcome. Confirm to close this ledger and create the next one."
            : "Resolve every unfinished task before confirming. Additional planning can be done afterward."}
        </p>
        <button
          type="button"
          onClick={finishWrapUp}
          disabled={!allResolved || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCircle2 className="size-5" />
          {isPending ? "Finishing…" : "Confirm and create next ledger"}
        </button>
      </div>
    </div>
  );
}
