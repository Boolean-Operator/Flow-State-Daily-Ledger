// components/ListTitleEditor.tsx
"use client";

import { TaskCollection } from "@/lib/types";
import { useState } from "react";
import {
  archiveProjectAction,
  updateProjectTitleAction,
} from "@/lib/actions";

export default function ListTitleEditor({
  collection,
  onChange,
}: {
  collection: TaskCollection;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(collection.title);

  async function save() {
    if (!title.trim()) return;

    await updateProjectTitleAction(collection.id, title);

    setEditing(false);
    onChange();
  }

  function cancel() {
    setTitle(collection.title);
    setEditing(false);
  }

  async function archiveProject() {
    await archiveProjectAction(collection.id);
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
      <h2 className="text-xl font-semibold">{collection.title}</h2>
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)}>Edit</button>
        {!collection.isSystem && (
          <button onClick={archiveProject}>Archive</button>
        )}
      </div>
    </div>
  );
}
