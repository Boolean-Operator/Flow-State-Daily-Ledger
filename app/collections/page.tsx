import Link from "next/link";
import { getTaskCollections } from "@/lib/data";
import ListManager from "@/components/ListManager";

export default async function CollectionsPage() {
  const collections = await getTaskCollections();

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="flex items-start justify-between gap-4">
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
        <Link
          href="/"
          className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
        >
          Today
        </Link>
      </header>

      <ListManager initialCollections={collections} />
    </main>
  );
}
