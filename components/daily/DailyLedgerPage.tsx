"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Inbox,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import {
  addStandupItemAction,
  addTaskToDailyLedgerAction,
  createDailyTaskAction,
  deleteStandupItemAction,
  moveDailyEntryAction,
  removeDailyEntryAction,
  reorderDailyEntriesAction,
  setDailyTaskCompletedAction,
  updateDailyTaskTitleAction,
  updateStandupItemAction,
} from "@/lib/actions";
import {
  AvailableTaskView,
  DailyLedgerView,
  DailySection,
  DailyTaskView,
  StandupItem,
} from "@/lib/types";

const sectionStyles = {
  WORK: {
    label: "Work / Standup",
    shortLabel: "Work",
    border: "border-blue-200",
    header: "bg-blue-50 text-blue-950",
    accent: "bg-blue-600",
  },
  PERSONAL: {
    label: "Personal / Home",
    shortLabel: "Personal",
    border: "border-emerald-200",
    header: "bg-emerald-50 text-emerald-950",
    accent: "bg-emerald-600",
  },
} as const;

function DailyTaskRow({
  item,
  section,
  index,
  sectionItems,
  ledgerId,
}: {
  item: DailyTaskView;
  section: DailySection;
  index: number;
  sectionItems: DailyTaskView[];
  ledgerId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.task.title);
  const [isPending, startTransition] = useTransition();
  const completed = item.entry.outcome === "COMPLETED";

  function reorder(direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= sectionItems.length) return;
    const ids = sectionItems.map((candidate) => candidate.entry.id);
    [ids[index], ids[destination]] = [ids[destination], ids[index]];
    startTransition(async () => {
      await reorderDailyEntriesAction(ledgerId, section, ids);
    });
  }

  function saveTitle(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await updateDailyTaskTitleAction(item.entry.id, title);
      setEditing(false);
    });
  }

  return (
    <li
      className={`border-b border-slate-200 px-3 py-3 last:border-b-0 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <input
          type="checkbox"
          aria-label={`Mark ${item.task.title} complete`}
          checked={completed}
          disabled={isPending}
          onChange={(event) => {
            const checked = event.target.checked;
            startTransition(async () => {
              await setDailyTaskCompletedAction(item.entry.id, checked);
            });
          }}
          className="mt-1 size-5 shrink-0 cursor-pointer accent-slate-800"
        />

        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={saveTitle} className="flex gap-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                autoFocus
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-base"
              />
              <button className="text-sm font-semibold text-blue-700">Save</button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={`text-left text-base font-medium leading-snug ${
                completed ? "text-slate-400 line-through" : "text-slate-900"
              }`}
            >
              {item.task.title}
            </button>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            {item.projectTitle && <span>{item.projectTitle}</span>}
            {item.task.targetDate && <span>Target {item.task.targetDate}</span>}
            {item.task.priority && <span>P{item.task.priority}</span>}
          </div>
        </div>

        <div className="col-start-2 flex items-center justify-end gap-0.5 sm:col-start-3 sm:row-start-1">
          <button
            type="button"
            aria-label="Edit task"
            title="Edit task"
            onClick={() => setEditing((value) => !value)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Move task up"
            title="Move up"
            disabled={index === 0 || isPending}
            onClick={() => reorder(-1)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Move task down"
            title="Move down"
            disabled={index === sectionItems.length - 1 || isPending}
            onClick={() => reorder(1)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Move to ${section === "WORK" ? "Personal" : "Work"}`}
            title={`Move to ${section === "WORK" ? "Personal" : "Work"}`}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await moveDailyEntryAction(
                  item.entry.id,
                  section === "WORK" ? "PERSONAL" : "WORK",
                );
              })
            }
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Remove from today"
            title="Remove from today"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await removeDailyEntryAction(item.entry.id);
              })
            }
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

function DailySectionCard({
  section,
  items,
  ledgerId,
}: {
  section: DailySection;
  items: DailyTaskView[];
  ledgerId: string;
}) {
  const styles = sectionStyles[section];
  const completeCount = items.filter(
    (item) => item.entry.outcome === "COMPLETED",
  ).length;

  return (
    <section className={`overflow-hidden rounded-xl border bg-white ${styles.border}`}>
      <header className={`flex items-center justify-between px-4 py-3 ${styles.header}`}>
        <div className="flex items-center gap-2">
          <span className={`h-5 w-1 rounded-full ${styles.accent}`} />
          <h2 className="font-bold">{styles.label}</h2>
        </div>
        <span className="text-xs font-semibold opacity-70">
          {completeCount}/{items.length} done
        </span>
      </header>

      {items.length ? (
        <ul>
          {items.map((item, index) => (
            <DailyTaskRow
              key={item.entry.id}
              item={item}
              section={section}
              index={index}
              sectionItems={items}
              ledgerId={ledgerId}
            />
          ))}
        </ul>
      ) : (
        <div className="px-4 py-7 text-center text-sm text-slate-400">
          Nothing planned here yet.
        </div>
      )}
    </section>
  );
}

function StandupItemRow({ item }: { item: StandupItem }) {
  const initialContent = item.detail
    ? `${item.summary}\n${item.detail}`
    : item.summary;
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  function save(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    startTransition(async () => {
      await updateStandupItemAction(item.id, content);
      setEditing(false);
    });
  }

  return (
    <li className={`flex items-start gap-2 ${isPending ? "opacity-60" : ""}`}>
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-600" />
      {editing ? (
        <form onSubmit={save} className="min-w-0 flex-1 space-y-2">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={Math.max(2, content.split("\n").length)}
            autoFocus
            className="w-full resize-y rounded-md border border-amber-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          />
          <div className="flex items-center gap-3">
            <button className="text-xs font-bold text-amber-800">Save</button>
            <button
              type="button"
              onClick={() => {
                setContent(initialContent);
                setEditing(false);
              }}
              className="text-xs text-slate-500"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-w-0 flex-1 whitespace-pre-wrap text-left text-sm font-medium leading-6 text-slate-800"
        >
          {initialContent}
        </button>
      )}
      {!editing && (
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit standup item"
            className="rounded p-1.5 text-amber-700/50 hover:bg-amber-100 hover:text-amber-800"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await deleteStandupItemAction(item.id);
              })
            }
            aria-label="Delete standup item"
            className="rounded p-1.5 text-amber-700/50 hover:bg-red-50 hover:text-red-600"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </li>
  );
}

function StandupSection({
  ledgerId,
  items,
}: {
  ledgerId: string;
  items: StandupItem[];
}) {
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [isPending, startTransition] = useTransition();

  function addItem(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    startTransition(async () => {
      await addStandupItemAction(ledgerId, content);
      setContent("");
    });
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
            Yesterday Review / Standup Items
          </p>

        </div>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
            {items.length} items
          </span>
          <ChevronDown
            className={`size-4 text-amber-700 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {expanded && (
        <>
          {items.length > 0 && (
            <ul className="mt-3 space-y-2 border-t border-amber-200 pt-3">
              {items.map((item) => (
                <StandupItemRow key={item.id} item={item} />
              ))}
            </ul>
          )}
          <div className="mt-3 border-t border-amber-200 pt-3">
            <p className="mb-2 text-xs text-amber-800/70">
              One concise line is ideal; use extra lines or typed bullets when
              useful.
            </p>
            <form onSubmit={addItem} className="flex items-end gap-2">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={2}
                placeholder={"Add a standup item…\n• Optional supporting point"}
                className="min-w-0 flex-1 resize-y rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-500"
              />
              <button
                disabled={isPending || !content.trim()}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-700 text-white disabled:opacity-40"
                aria-label="Add standup item"
              >
                <Plus className="size-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </section>
  );
}

export default function DailyLedgerPage({
  ledger,
  availableTasks,
}: {
  ledger: DailyLedgerView;
  availableTasks: AvailableTaskView[];
}) {
  const [title, setTitle] = useState("");
  const [captureSection, setCaptureSection] = useState<DailySection>("WORK");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [pullSection, setPullSection] = useState<DailySection>("WORK");
  const [isPending, startTransition] = useTransition();

  function addNewTask(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createDailyTaskAction(ledger.ledger.date, captureSection, title);
      setTitle("");
    });
  }

  function pullExistingTask(event: FormEvent) {
    event.preventDefault();
    if (!selectedTaskId) return;
    startTransition(async () => {
      await addTaskToDailyLedgerAction(
        ledger.ledger.date,
        selectedTaskId,
        pullSection,
      );
      setSelectedTaskId("");
    });
  }

  return (
    <div className="space-y-5">
      <StandupSection
        ledgerId={ledger.ledger.id}
        items={ledger.standupItems}
      />

      <form
        onSubmit={addNewTask}
        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div className="mb-3 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          {(["WORK", "PERSONAL"] as DailySection[]).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setCaptureSection(section)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                captureSection === section
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {sectionStyles[section].shortLabel}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={`Add a ${sectionStyles[captureSection].shortLabel.toLowerCase()} task…`}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-slate-500"
          />
          <button
            disabled={isPending || !title.trim()}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white disabled:opacity-40"
            aria-label="Add task"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </form>

      <DailySectionCard
        section="WORK"
        items={ledger.work}
        ledgerId={ledger.ledger.id}
      />
      <DailySectionCard
        section="PERSONAL"
        items={ledger.personal}
        ledgerId={ledger.ledger.id}
      />

      <details className="group rounded-xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-slate-800">
          <span className="flex items-center gap-2">
            <Inbox className="size-4 text-slate-500" />
            Pull into today
          </span>
          <span className="text-xs font-normal text-slate-500">
            {availableTasks.length} available
          </span>
        </summary>
        <form onSubmit={pullExistingTask} className="space-y-3 border-t p-4">
          <select
            value={selectedTaskId}
            onChange={(event) => setSelectedTaskId(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Choose a Back Burner or project task…</option>
            {availableTasks.map(({ task, projectTitle }) => (
              <option key={task.id} value={task.id}>
                {projectTitle ? `[${projectTitle}] ` : "[Back Burner] "}
                {task.title}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={pullSection}
              onChange={(event) =>
                setPullSection(event.target.value as DailySection)
              }
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="WORK">Work / Standup</option>
              <option value="PERSONAL">Personal / Home</option>
            </select>
            <button
              disabled={isPending || !selectedTaskId}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Add to today
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
