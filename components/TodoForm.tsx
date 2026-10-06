// components/TodoForm.tsx
"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { addTaskAction } from "@/lib/actions";

export default function TodoForm({
  collectionId,
}: {
  collectionId: string;
}) {
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<number | undefined>(undefined);

  async function submit() {
    if (!title) return;

    await addTaskAction(collectionId, title, targetDate, priority);

    setTitle("");
    setTargetDate("");
    setPriority(undefined);
  }

  return (
    <div className="flex w-full justify-between">
      <div className="flex w-full border p-2 rounded space-x-2">
        <input
          className="flex-1 px-1"
          placeholder="Add New Item"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex space-x-1">
          <input
            type="date"
            className="border rounded px-1"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
          <input
            type="number"
            className="border w-20 rounded px-1"
            placeholder="Priority"
            value={priority === undefined ? "" : priority}
            min={1}
            max={5}
            onChange={(e) =>
              setPriority(e.target.value ? Number(e.target.value) : undefined)
            }
          />
          {/* </div>
      <div className="flex min-w-full justify-center"> */}
          <Button
            className="px-4 hover:bg-green-700 hover:text-white text-green-700 bg-white"
            variant="outline"
            onClick={submit}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
