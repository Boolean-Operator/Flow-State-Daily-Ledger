import { getTaskCollections } from "@/lib/data";
import ListManager from "@/components/ListManager";

export default async function CollectionsPage() {
  const collections = await getTaskCollections();

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-6 p-4 sm:p-6">
      <header>
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Flow-State Daily Ledger
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Back Burner & Projects
          </h1>
          <p className="text-sm text-gray-500">
            Organize future work without crowding today.
          </p>
        </div>
      </header>

      <ListManager initialCollections={collections} />
    </main>
  );
}
