// components/TodoItem.tsx
"use client";

import { Task } from "@/lib/types";
import { updateTaskAction, deleteTaskAction } from "@/lib/actions";
import { useState } from "react";
import { Button } from "./ui/button";

export default function TodoItem({
  collectionId,
  task,
}: {
  collectionId: string;
  task: Task;
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
    await deleteTaskAction(collectionId, task.id);
  }

  if (editing) {
    return (
      <div className="flex flex-col border p-2 rounded space-y-2">
        <input
          className="border w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex  justify-between">
          <div className="flex gap-4">
            <input
              type="date"
              className="border rounded-md"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <input
              type="number"
              className="text-center border w-20 bg-blue-700 rounded-xl text-white font-bold"
              placeholder="Priority"
              value={priority === undefined ? "" : priority}
              min={1}
              max={5}
              onChange={(e) =>
                setPriority(e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
          <div className="flex gap-2">
            <Button className="bg-green-600" onClick={save}>
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
    <div className="flex justify-between gap-2 border p-2 rounded">
      <div className="flex justify-between w-full ">
        <div className="flex gap-2 items-center">
          <input
            type="checkbox"
            className="accent-green-700"
            checked={task.status === "COMPLETED"}
            onChange={toggleCompleted}
          />
          <span className={task.status === "COMPLETED" ? "line-through" : ""}>
            {task.title}
          </span>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">{task.targetDate}</span>
          {typeof task.priority === "number" && (
            <span className="text-sm text-blue-600">
              Priority: {task.priority}
            </span>
          )}
          <Button
            variant="outline"
            className="hover:bg-blue-600 hover:text-white text-blue-600 bg-white"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            className="hover:bg-red-600 hover:text-white text-red-600 bg-white"
            onClick={remove}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
