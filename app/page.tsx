// app/page.tsx
import { getTaskCollections } from "@/lib/data";
import ListManager from "@/components/ListManager";

export default async function HomePage() {
  const collections = await getTaskCollections();

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">
          Flow-State Daily Ledger
        </h1>
        <p className="text-sm text-gray-500">
          Back Burner and project tasks share one canonical task store.
        </p>
      </header>

      <ListManager initialCollections={collections} />
    </main>
  );
}
