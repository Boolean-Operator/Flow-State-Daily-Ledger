// components/TodoItem.tsx
"use client";

import { TodoItem as Item } from "@/lib/types";
import { updateTodoAction, deleteTodoAction } from "@/lib/actions";
import { useState } from "react";
import { Button } from "./ui/button";

export default function TodoItem({
  listId,
  todo,
  // onChange,
}: {
  listId: string;
  todo: Item;
  // onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [targetDate, setTargetDate] = useState(todo.targetDate);
  const [priority, setPriority] = useState<number | undefined>(todo.priority);

  async function save() {
    await updateTodoAction(listId, todo.id, { title, targetDate, priority });
    setEditing(false);
  }

  async function toggleCompleted() {
    await updateTodoAction(listId, todo.id, { completed: !todo.completed });
  }

  async function remove() {
    await deleteTodoAction(listId, todo.id);
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
            checked={todo.completed}
            onChange={toggleCompleted}
          />
          <span className={todo.completed ? "line-through" : ""}>
            {todo.title}
          </span>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">{todo.targetDate}</span>
          {typeof todo.priority === "number" && (
            <span className="text-sm text-blue-600">
              Priority: {todo.priority}
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
