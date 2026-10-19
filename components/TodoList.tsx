"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Archive, ChevronDown, FolderPlus, Trash2 } from "lucide-react";
import { Task, TaskCollection } from "@/lib/types";
import {
  archiveTasksAction,
  createProjectFromTasksAction,
  deleteTasksAction,
  moveTasksAction,
  reorderTasksAction,
  restoreArchivedTasksAction,
} from "@/lib/actions";
import TodoItem from "./TodoItem";
import TodoForm from "./TodoForm";
import { Button } from "./ui/button";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface CollectionDestination {
  id: string;
  title: string;
}

function SortableTaskGroup({
  tasks,
  droppableId,
  collectionId,
  selectionMode,
  selectedIds,
  onSelectedChange,
  onArchived,
}: {
  tasks: Task[];
  droppableId: string;
  collectionId: string;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onSelectedChange: (taskId: string, selected: boolean) => void;
  onArchived: (task: Task) => void;
}) {
  return (
    <Droppable droppableId={droppableId}>
      {(provided) => (
        <ul
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="space-y-2"
        >
          {tasks.map((task, index) => (
            <Draggable
              key={task.id}
              draggableId={task.id}
              index={index}
              isDragDisabled={selectionMode}
            >
              {(draggable) => (
                <li
                  ref={draggable.innerRef}
                  {...draggable.draggableProps}
                  {...draggable.dragHandleProps}
                >
                  <TodoItem
                    collectionId={collectionId}
                    task={task}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(task.id)}
                    onSelectedChange={(selected) =>
                      onSelectedChange(task.id, selected)
                    }
                    onArchived={onArchived}
                  />
                </li>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </ul>
      )}
    </Droppable>
  );
}

export default function TodoList({
  collection,
  destinations,
}: {
  collection: TaskCollection;
  destinations: CollectionDestination[];
}) {
  const tasks = [...collection.tasks].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const openTasks = tasks.filter((task) => task.status === "OPEN");
  const completedTasks = tasks.filter((task) => task.status === "COMPLETED");
  const [selectionMode, setSelectionMode] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [destinationId, setDestinationId] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [archiveNotice, setArchiveNotice] = useState<{
    taskIds: string[];
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!archiveNotice) return;
    const timeoutId = window.setTimeout(() => setArchiveNotice(null), 7000);
    return () => window.clearTimeout(timeoutId);
  }, [archiveNotice]);

  const selectedTaskIds = tasks
    .filter((task) => selectedIds.has(task.id))
    .map((task) => task.id);
  const availableDestinations = destinations.filter(
    (destination) => destination.id !== collection.id,
  );
  const allSelected = tasks.length > 0 && selectedIds.size === tasks.length;

  function leaveSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setDestinationId("");
    setNewProjectTitle("");
    setError(null);
  }

  function runBulkAction(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        leaveSelectionMode();
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "The bulk action could not be completed.",
        );
      }
    });
  }

  async function onDragEnd(result: DropResult) {
    if (
      !result.destination ||
      result.source.droppableId !== result.destination.droppableId
    ) {
      return;
    }

    const reordered = Array.from(
      result.source.droppableId === "completed-tasks"
        ? completedTasks
        : openTasks,
    );
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    const orderedTasks =
      result.source.droppableId === "completed-tasks"
        ? [...openTasks, ...reordered]
        : [...reordered, ...completedTasks];

    await reorderTasksAction(
      collection.id,
      orderedTasks.map((task) => task.id),
    );
  }

  function setTaskSelected(taskId: string, selected: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }

  function moveSelected(event: FormEvent) {
    event.preventDefault();
    if (!destinationId || selectedTaskIds.length === 0) return;
    runBulkAction(() =>
      moveTasksAction(collection.id, selectedTaskIds, destinationId),
    );
  }

  function createProjectFromSelected(event: FormEvent) {
    event.preventDefault();
    if (!newProjectTitle.trim() || selectedTaskIds.length === 0) return;
    runBulkAction(() =>
      createProjectFromTasksAction(
        collection.id,
        newProjectTitle,
        selectedTaskIds,
      ),
    );
  }

  function archiveSelected() {
    if (selectedTaskIds.length === 0) return;
    const archivedTaskIds = [...selectedTaskIds];
    runBulkAction(async () => {
      await archiveTasksAction(collection.id, archivedTaskIds);
      setArchiveNotice({
        taskIds: archivedTaskIds,
        message: `Archived ${archivedTaskIds.length} ${
          archivedTaskIds.length === 1 ? "item" : "items"
        }.`,
      });
    });
  }

  function showTaskArchived(task: Task) {
    setArchiveNotice({
      taskIds: [task.id],
      message: `Archived “${task.title}”.`,
    });
  }

  function undoArchive() {
    if (!archiveNotice) return;
    const taskIds = archiveNotice.taskIds;
    startTransition(async () => {
      await restoreArchivedTasksAction(collection.id, taskIds);
      setArchiveNotice(null);
    });
  }

  function deleteSelected() {
    if (selectedTaskIds.length === 0) return;
    const itemLabel = selectedTaskIds.length === 1 ? "item" : "items";
    if (
      !window.confirm(
        `Permanently delete ${selectedTaskIds.length} ${itemLabel}? This cannot be undone and also removes their Daily Ledger and Radar placements.`,
      )
    ) {
      return;
    }
    runBulkAction(() => deleteTasksAction(collection.id, selectedTaskIds));
  }

  return (
    <section className="space-y-3">
      <TodoForm collectionId={collection.id} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {selectionMode
            ? "Blue checkboxes select items; completion is paused."
            : "Green checkboxes mark complete; drag items to reorder."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (selectionMode) leaveSelectionMode();
            else {
              setSelectionMode(true);
              setCompletedExpanded(true);
            }
          }}
        >
          {selectionMode ? "Done" : "Select items"}
        </Button>
      </div>

      {selectionMode && (
        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                className="size-4 accent-blue-700"
                checked={allSelected}
                onChange={(event) =>
                  setSelectedIds(
                    event.target.checked
                      ? new Set(tasks.map((task) => task.id))
                      : new Set(),
                  )
                }
              />
              Select all
            </label>
            <span className="text-sm font-medium text-blue-800">
              {selectedTaskIds.length} selected
            </span>
          </div>

          <form
            onSubmit={moveSelected}
            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <select
              aria-label="Move selected items to"
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
              className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">Move to…</option>
              {availableDestinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.title}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              disabled={
                isPending || !destinationId || selectedTaskIds.length === 0
              }
            >
              Move selected
            </Button>
          </form>

          <form
            onSubmit={createProjectFromSelected}
            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <input
              value={newProjectTitle}
              onChange={(event) => setNewProjectTitle(event.target.value)}
              placeholder="New project name"
              aria-label="New project name"
              className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={
                isPending ||
                !newProjectTitle.trim() ||
                selectedTaskIds.length === 0
              }
            >
              <FolderPlus />
              Create and move
            </Button>
          </form>

          <div className="flex flex-wrap justify-end gap-2 border-t border-blue-200 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending || selectedTaskIds.length === 0}
              onClick={archiveSelected}
            >
              <Archive />
              Archive
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending || selectedTaskIds.length === 0}
              onClick={deleteSelected}
            >
              <Trash2 />
              Delete
            </Button>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <h2 className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Open items
        </h2>
        <SortableTaskGroup
          tasks={openTasks}
          droppableId="open-tasks"
          collectionId={collection.id}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onSelectedChange={setTaskSelected}
          onArchived={showTaskArchived}
        />

        {openTasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            <p>No open items.</p>
            {tasks.length === 0 && (
              <Link
                href="/collections"
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                Return to Plan
              </Link>
            )}
          </div>
        )}

        {completedTasks.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
            <button
              type="button"
              onClick={() => setCompletedExpanded((value) => !value)}
              aria-expanded={completedExpanded}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <span>Completed history</span>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                {completedTasks.length} items
                <ChevronDown
                  className={`size-4 transition-transform ${
                    completedExpanded ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>
            {completedExpanded && (
              <div className="border-t border-slate-200 p-2">
                <SortableTaskGroup
                  tasks={completedTasks}
                  droppableId="completed-tasks"
                  collectionId={collection.id}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onSelectedChange={setTaskSelected}
                  onArchived={showTaskArchived}
                />
              </div>
            )}
          </section>
        )}
      </DragDropContext>

      {archiveNotice && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-slate-300 bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span className="truncate">{archiveNotice.message}</span>
          <button
            type="button"
            disabled={isPending}
            onClick={undoArchive}
            className="shrink-0 font-bold text-blue-200 hover:text-white disabled:opacity-50"
          >
            Undo
          </button>
        </div>
      )}
    </section>
  );
}
