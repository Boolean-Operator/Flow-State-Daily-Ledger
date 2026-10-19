import { getTaskCollections } from "@/lib/data";
import ListManager from "@/components/ListManager";

export default async function CollectionsPage() {
  const collections = await getTaskCollections();

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="px-1 sm:px-2">
        <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          Plan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Organize standalone tasks, classify projects, and prepare future work.
        </p>
      </header>

      <ListManager initialCollections={collections} />
    </main>
  );
}
