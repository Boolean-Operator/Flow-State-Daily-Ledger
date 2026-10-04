// app/lists/[listId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getListById } from "@/lib/data"; // Direct access to your DAL
import TodoList from "@/components/TodoList"; // Reuse your existing component
import { Button } from "@/components/ui/button";

export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  // 1. Unwrap the dynamic route parameters
  const { listId } = await params;

  // 2. Call the DAL directly (no fetch, no absolute URLs)
  const list = await getListById(listId);

  // 3. Handle missing data
  if (!list) return notFound();

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <header className="border-b pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{list.title}</h1>
        <Button
          variant="outline"
          className="border-blue-600 bg-white text-blue-600"
          size="sm"
        >
          <Link href={`/`}>Lists</Link>
        </Button>
      </header>

      <TodoList list={list} />

      {/* <ul className="divide-y divide-gray-200">
        {list.todos && list.todos.length > 0 ? (
          list.todos.map((todo) => (
            <li
              key={todo.id}
              className="py-3 flex items-center justify-between"
            >
              <span
                className={todo.completed ? "line-through text-gray-400" : ""}
              >
                {todo.title}
              </span>
              {todo.priority && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  P{todo.priority}
                </span>
              )}
            </li>
          ))
        ) : (
          <li className="py-8 text-center text-gray-500 italic">
            No todos yet. Time to get organized!
          </li>
        )}
      </ul> */}
    </main>
  );
}
