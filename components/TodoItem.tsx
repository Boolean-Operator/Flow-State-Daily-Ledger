// components/TodoItem.tsx
"use client";

import { Task } from "@/lib/types";
import { updateTaskAction, deleteTaskAction } from "@/lib/actions";
import { useState } from "react";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";

export default function TodoItem({
  collectionId,
  task,
  selectionMode = false,
  selected = false,
  onSelectedChange,
}: {
  collectionId: string;
  task: Task;
  selectionMode?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [targetDate, setTargetDate] = useState(task.targetDate ?? "");
  const [priority, setPriority] = useState<number | undefined>(
    task.priority ?? undefined,
  );

  async function save() {
    await updateTaskAction(collectionId, task.id, {
      title,
      targetDate: targetDate || null,
      priority: priority ?? null,
    });
    setEditing(false);
  }

  async function toggleCompleted() {
    await updateTaskAction(collectionId, task.id, {
      status: task.status === "COMPLETED" ? "OPEN" : "COMPLETED",
    });
  }

  async function remove() {
    if (!window.confirm(`Permanently delete “${task.title}”?`)) return;
    await deleteTaskAction(collectionId, task.id);
  }

  if (editing) {
    return (
      <div className="flex flex-col space-y-2 rounded border p-3">
        <input
          className="w-full rounded border px-2 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_6rem] gap-2">
            <input
              type="date"
              aria-label="Target date"
              className="min-w-0 max-w-full rounded-md border px-2 py-2"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <select
              aria-label="Priority"
              className="h-10 min-w-0 rounded-md border bg-white px-2"
              value={priority === undefined ? "" : priority}
              onChange={(e) =>
                setPriority(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">No priority</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  P{value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button className="bg-green-600 text-white" onClick={save}>
              Save
            </Button>
            <Button className="bg-amber-400" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded border p-3 ${
        selected ? "border-blue-400 bg-blue-50/60" : ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {selectionMode ? (
            <input
              type="checkbox"
              aria-label={`Select ${task.title}`}
              className="mt-1 size-5 shrink-0 accent-blue-700"
              checked={selected}
              onChange={(event) => onSelectedChange?.(event.target.checked)}
            />
          ) : (
            <input
              type="checkbox"
              aria-label={`Mark ${task.title} complete`}
              className="mt-1 size-5 shrink-0 accent-green-700"
              checked={task.status === "COMPLETED"}
              onChange={toggleCompleted}
            />
          )}
          <div className="min-w-0 flex-1">
            <span
              className={`block break-words ${
                task.status === "COMPLETED" ? "line-through" : ""
              }`}
            >
              {task.title}
            </span>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {task.targetDate && (
                <span className="text-gray-500">{task.targetDate}</span>
              )}
              {typeof task.priority === "number" && (
                <span className="text-blue-600">Priority: {task.priority}</span>
              )}
            </div>
          </div>
        </div>

        {!selectionMode && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              className="bg-white text-blue-600 hover:bg-blue-600 hover:text-white"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${task.title}`}
              title="Edit item"
            >
              <Pencil />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="bg-white text-red-600 hover:bg-red-600 hover:text-white"
              onClick={remove}
              aria-label={`Delete ${task.title}`}
              title="Delete item"
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
