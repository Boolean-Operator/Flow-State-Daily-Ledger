// components/TodoList.tsx
"use client";

import { TodoList as ListType } from "@/lib/types";
import TodoItem from "./TodoItem";
import TodoForm from "./TodoForm";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { reorderTodosAction } from "@/lib/actions";

export default function TodoList({
  list,
  // onChange,
}: {
  list: ListType;
  // onChange: () => void;
}) {
  const todos = [...list.todos].sort((a, b) => a.order - b.order);

  async function onDragEnd(result: any) {
    if (!result.destination) return;

    const reordered = Array.from(todos);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    await reorderTodosAction(
      list.id,
      reordered.map((t) => t.id),
    );
  }

  return (
    <section className="space-y-2">
      <TodoForm listId={list.id} />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="todos">
          {(p) => (
            <ul ref={p.innerRef} {...p.droppableProps} className="space-y-2">
              {todos.map((todo, i) => (
                <Draggable key={todo.id} draggableId={todo.id} index={i}>
                  {(p) => (
                    <li
                      ref={p.innerRef}
                      {...p.draggableProps}
                      {...p.dragHandleProps}
                    >
                      <TodoItem listId={list.id} todo={todo} />
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
