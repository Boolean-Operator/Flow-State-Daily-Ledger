// app/lists/[listId]/page.tsx
import { notFound } from "next/navigation";
import { getTaskCollectionById, getTaskCollections } from "@/lib/data";
import TodoList from "@/components/TodoList";

export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const [collection, collections] = await Promise.all([
    getTaskCollectionById(listId),
    getTaskCollections(),
  ]);
  if (!collection) return notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold">{collection.title}</h1>
      </header>

      <TodoList
        collection={collection}
        destinations={collections.map(({ id, title }) => ({ id, title }))}
      />
    </main>
  );
}
