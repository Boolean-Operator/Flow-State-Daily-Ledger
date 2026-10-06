// components/TodoList.tsx
"use client";

import { TaskCollection } from "@/lib/types";
import TodoItem from "./TodoItem";
import TodoForm from "./TodoForm";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { reorderTasksAction } from "@/lib/actions";

export default function TodoList({
  collection,
}: {
  collection: TaskCollection;
}) {
  const tasks = [...collection.tasks].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    const reordered = Array.from(tasks);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    await reorderTasksAction(
      collection.id,
      reordered.map((t) => t.id),
    );
  }

  return (
    <section className="space-y-2">
      <TodoForm collectionId={collection.id} />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="todos">
          {(p) => (
            <ul ref={p.innerRef} {...p.droppableProps} className="space-y-2">
              {tasks.map((task, i) => (
                <Draggable key={task.id} draggableId={task.id} index={i}>
                  {(p) => (
                    <li
                      ref={p.innerRef}
                      {...p.draggableProps}
                      {...p.dragHandleProps}
                    >
                      <TodoItem collectionId={collection.id} task={task} />
                    </li>
                  )}
                </Draggable>
              ))}
              {p.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </section>
  );
}
