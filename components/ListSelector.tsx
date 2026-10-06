// components/ListSelector.tsx
"use client";

import { TaskCollection } from "@/lib/types";
import { useState } from "react";
import { createProjectAction } from "@/lib/actions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ListSelector({
  collections,
  onSelect,
  onChange,
}: {
  collections: TaskCollection[];
  onSelect: (id: string) => void;
  onChange: () => void;
}) {
  const [newTitle, setNewTitle] = useState("");

  async function createList() {
    if (!newTitle.trim()) return;

    await createProjectAction(newTitle);

    setNewTitle("");
    onChange();
  }

  return (
    <section className="space-y-2">
      {/* Create list */}
      <div className="flex gap-2 pb-4 border-b-2">
        <input
          className="border flex-1"
          placeholder="New list title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button onClick={createList}>Create</button>
      </div>
      {/* Select list */}
      <div className="flex">
        <ul>
          {collections.map((item) => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      </div>
        <Select onValueChange={(value) => {
          if (typeof value === "string") onSelect(value);
        }}>
        <SelectTrigger className="w-full max-w-48">
          <SelectValue placeholder="Select a list" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select a list</SelectLabel>
            {collections.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {/* <select
        className="border p-4 w-full"
        onChange={(e) => onSelect(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>
          Select a list
        </option>
        {collections.map((list) => (
          <option key={list.id} value={list.id}>
            {list.title}
          </option>
        ))}
      </select> */}
    </section>
  );
}
