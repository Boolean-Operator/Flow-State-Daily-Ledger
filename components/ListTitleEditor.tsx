// components/ListTitleEditor.tsx
"use client";

import { TodoList } from "@/lib/types";
import { useState } from "react";

export default function ListTitleEditor({
  list,
  onChange,
}: {
  list: TodoList;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  async function save() {
    if (!title.trim()) return;

    await fetch(`/api/lists/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    setEditing(false);
    onChange();
  }

  function cancel() {
    setTitle(list.title);
    setEditing(false);
  }

  async function deleteList() {
    await fetch(`/api/lists/${list.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId: list.id }),
    });
    onChange();
  }

  if (editing) {
    return (
      <div className="flex gap-2">
        <input
          className="border flex-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button onClick={save}>Save</button>
        <button onClick={cancel}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">{list.title}</h2>
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)}>Edit</button>
        <button onClick={deleteList}>Delete</button>
      </div>
    </div>
  );
}
