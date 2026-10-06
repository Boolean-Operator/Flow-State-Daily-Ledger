"use client";

import { FormEvent, useState, useTransition } from "react";
import { Archive, FolderPlus, Trash2 } from "lucide-react";
import { TaskCollection } from "@/lib/types";
import {
  archiveTasksAction,
  createProjectFromTasksAction,
  deleteTasksAction,
  moveTasksAction,
  reorderTasksAction,
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [destinationId, setDestinationId] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    if (!result.destination) return;

    const reordered = Array.from(tasks);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    await reorderTasksAction(
      collection.id,
      reordered.map((task) => task.id),
    );
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
    runBulkAction(() => archiveTasksAction(collection.id, selectedTaskIds));
  }

  function deleteSelected() {
    if (selectedTaskIds.length === 0) return;
    const itemLabel = selectedTaskIds.length === 1 ? "item" : "items";
    if (
      !window.confirm(
        `Permanently delete ${selectedTaskIds.length} ${itemLabel}? This also removes their Daily Ledger and Radar placements.`,
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
          onClick={() =>
            selectionMode ? leaveSelectionMode() : setSelectionMode(true)
          }
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
        <Droppable droppableId="todos">
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
                        collectionId={collection.id}
                        task={task}
                        selectionMode={selectionMode}
                        selected={selectedIds.has(task.id)}
                        onSelectedChange={(selected) =>
                          setSelectedIds((current) => {
                            const next = new Set(current);
                            if (selected) next.add(task.id);
                            else next.delete(task.id);
                            return next;
                          })
                        }
                      />
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </section>
  );
}
