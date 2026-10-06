// components/ListManager.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { TaskCollection } from "@/lib/types";
import {
  archiveProjectAction,
  createProjectAction,
  updateProjectTitleAction,
} from "@/lib/actions";
import { Button } from "./ui/button";

export default function ListManager({
  initialCollections,
}: {
  initialCollections: TaskCollection[];
}) {
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  async function handleCreate() {
    if (!newTitle.trim()) return;
    await createProjectAction(newTitle);
    setNewTitle("");
  }

  async function handleUpdate(id: string) {
    if (!editTitle.trim()) return;
    await updateProjectTitleAction(id, editTitle);
    setEditingId(null);
  }

  return (
    <section className="space-y-6">
      <div className="flex gap-2 pb-6 border-b-2">
        <input
          className="border rounded px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="New project title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Button
          onClick={handleCreate}
          className="border border-blue-600 bg-white hover:bg-blue-700 text-blue-600 hover:text-white"
        >
          Create Project
        </Button>
      </div>

      <ul className="space-y-3">
        {initialCollections.map((collection) => (
          <li
            key={collection.id}
            className="flex items-center justify-between px-4 py-1 border rounded-lg bg-white shadow-sm"
          >
            {editingId === collection.id ? (
              <div className="flex gap-2 flex-1">
                <input
                  className="border rounded px-2 py-1 flex-1"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
                <Button
                  onClick={() => handleUpdate(collection.id)}
                  className="bg-green-600 text-white"
                >
                  Save
                </Button>
                <Button onClick={() => setEditingId(null)} variant="outline">
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <Link
                  href={`/lists/${collection.id}`}
                  className="text-lg font-medium hover:cursor-pointer flex-1"
                >
                  {collection.title}
                  <span className="ml-2 text-sm text-gray-400">
                    ({collection.tasks.length} items)
                  </span>
                </Link>
                {!collection.isSystem && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setEditingId(collection.id);
                        setEditTitle(collection.title);
                      }}
                      variant="ghost"
                      className="text-gray-600 hover:text-blue-600"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => archiveProjectAction(collection.id)}
                      variant="ghost"
                      className="text-gray-400 hover:text-amber-700"
                    >
                      Archive
                    </Button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
