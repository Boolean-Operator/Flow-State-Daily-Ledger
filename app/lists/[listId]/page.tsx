// app/lists/[listId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTaskCollectionById } from "@/lib/data";
import TodoList from "@/components/TodoList";
import { Button } from "@/components/ui/button";

export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const collection = await getTaskCollectionById(listId);
  if (!collection) return notFound();

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <header className="border-b pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{collection.title}</h1>
        <Button
          variant="outline"
          className="border-blue-600 bg-white text-blue-600"
          size="sm"
        >
          <Link href="/">Collections</Link>
        </Button>
      </header>

      <TodoList collection={collection} />
    </main>
  );
}
