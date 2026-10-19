"use client";

import { useState } from "react";
import Link from "next/link";
import { TaskArea, TaskCollection } from "@/lib/types";
import {
  archiveProjectAction,
  createProjectAction,
  updateProjectAreaAction,
  updateProjectTitleAction,
} from "@/lib/actions";
import { Button } from "./ui/button";

const areaLabels: Record<TaskArea, string> = {
  WORK: "Work",
  PERSONAL: "Personal",
  UNCLASSIFIED: "Unclassified",
};

function CollectionLink({ collection }: { collection: TaskCollection }) {
  const openCount = collection.tasks.filter(
    (task) => task.status === "OPEN",
  ).length;

  return (
    <Link
      href={`/lists/${collection.id}`}
      className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-900">
          {collection.title}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">
          {openCount} open item
          {openCount === 1 ? "" : "s"}
        </span>
      </span>
      <span className="text-sm text-slate-400" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export default function ListManager({
  initialCollections,
}: {
  initialCollections: TaskCollection[];
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newArea, setNewArea] = useState<TaskArea>("PERSONAL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const planningLists = initialCollections.filter(
    (collection) => collection.isSystem,
  );
  const projects = initialCollections.filter(
    (collection) => !collection.isSystem,
  );

  async function handleCreate() {
    if (!newTitle.trim()) return;
    await createProjectAction(newTitle, newArea);
    setNewTitle("");
  }

  async function handleUpdate(id: string) {
    if (!editTitle.trim()) return;
    await updateProjectTitleAction(id, editTitle);
    setEditingId(null);
  }

  async function handleAreaChange(
    collection: TaskCollection,
    area: TaskArea,
  ) {
    if (area !== "UNCLASSIFIED") {
      const confirmed = window.confirm(
        `Classify “${collection.title}” as ${areaLabels[area]}? Its tasks will use the same area.`,
      );
      if (!confirmed) return;
    }
    await updateProjectAreaAction(collection.id, area);
  }

  return (
    <section className="space-y-8">
      <section className="space-y-3">
        <div className="px-1">
          <h2 className="font-bold text-slate-950">Planning lists</h2>
          <p className="mt-1 text-sm text-slate-500">
            Standalone tasks are organized by Work, Personal, or Inbox.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {planningLists.map((collection) => (
            <CollectionLink key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="px-1">
          <h2 className="font-bold text-slate-950">Projects</h2>
          <p className="mt-1 text-sm text-slate-500">
            Project classification controls where its tasks appear in planning.
          </p>
        </div>

        <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
          <input
            className="min-w-0 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="New project title"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
          />
          <select
            aria-label="New project area"
            value={newArea}
            onChange={(event) => setNewArea(event.target.value as TaskArea)}
            className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"
          >
            <option value="WORK">Work</option>
            <option value="PERSONAL">Personal</option>
            <option value="UNCLASSIFIED">Unclassified</option>
          </select>
          <Button
            onClick={handleCreate}
            disabled={!newTitle.trim()}
            className="border border-blue-600 bg-white text-blue-600 hover:bg-blue-700 hover:text-white"
          >
            Create project
          </Button>
        </div>

        {(["WORK", "PERSONAL", "UNCLASSIFIED"] as TaskArea[]).map((area) => {
          const areaProjects = projects.filter(
            (collection) => collection.area === area,
          );
          if (areaProjects.length === 0) return null;

          return (
            <section key={area} className="space-y-2">
              <h3 className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {areaLabels[area]} projects
              </h3>
              <ul className="space-y-3">
                {areaProjects.map((collection) => {
                  const openCount = collection.tasks.filter(
                    (task) => task.status === "OPEN",
                  ).length;
                  return (
                    <li
                      key={collection.id}
                      className="rounded-lg border bg-white px-4 py-3 shadow-sm"
                    >
                      {editingId === collection.id ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            className="min-w-0 flex-1 rounded border px-2 py-1"
                            value={editTitle}
                            onChange={(event) =>
                              setEditTitle(event.target.value)
                            }
                            autoFocus
                          />
                          <Button onClick={() => handleUpdate(collection.id)}>
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingId(null)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <Link
                            href={`/lists/${collection.id}`}
                            className="min-w-0 flex-1 font-medium text-slate-900"
                          >
                            <span className="break-words">
                              {collection.title}
                            </span>
                            <span className="ml-2 text-sm text-slate-400">
                              ({openCount} open)
                            </span>
                          </Link>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              aria-label={`Classify ${collection.title}`}
                              value={collection.area}
                              onChange={(event) =>
                                handleAreaChange(
                                  collection,
                                  event.target.value as TaskArea,
                                )
                              }
                              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
                            >
                              <option value="WORK">Work</option>
                              <option value="PERSONAL">Personal</option>
                              <option value="UNCLASSIFIED">Unclassified</option>
                            </select>
                            <Button
                              onClick={() => {
                                setEditingId(collection.id);
                                setEditTitle(collection.title);
                              }}
                              variant="ghost"
                              size="sm"
                            >
                              Rename
                            </Button>
                            <Button
                              onClick={() =>
                                archiveProjectAction(collection.id)
                              }
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:text-amber-700"
                            >
                              Archive
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </section>
    </section>
  );
}
