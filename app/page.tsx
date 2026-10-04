// app/page.tsx
import { getLists } from "@/lib/data";
import ListManager from "@/components/ListManager";

export default async function HomePage() {
  // Direct server-side fetch via DAL
  const lists = await getLists();

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Todo Lists</h1>

      {/* Client component for the "New List" form and editing logic */}
      <ListManager initialLists={lists} />
    </main>
  );
}
