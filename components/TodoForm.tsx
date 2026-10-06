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
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="w-full rounded-lg border p-3"
    >
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-md border px-2 py-2 outline-none focus:border-blue-500"
          placeholder="Add New Item"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_5rem_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_auto]">
          <input
            type="date"
            aria-label="Target date"
            className="min-w-0 max-w-full rounded-md border px-2 py-2 text-sm sm:text-base"
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
            <option value="">Priority</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                P{value}
              </option>
            ))}
          </select>
          <Button
            className="h-10 bg-white px-4 text-green-700 hover:bg-green-700 hover:text-white"
            variant="outline"
            type="submit"
          >
            Add
          </Button>
        </div>
      </div>
    </form>
  );
}
