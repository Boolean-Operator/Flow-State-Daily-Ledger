import Link from "next/link";
import { connection } from "next/server";
import DailyLedgerPage from "@/components/daily/DailyLedgerPage";
import {
  getAvailableTasksForLedger,
  getOrCreateDailyLedger,
} from "@/lib/data";
import { formatLedgerDate, getTodayDateKey } from "@/lib/dates";

export default async function HomePage() {
  await connection();
  const date = getTodayDateKey();
  const ledger = await getOrCreateDailyLedger(date);
  const availableTasks = await getAvailableTasksForLedger(ledger.ledger.id);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Daily Ledger
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {formatLedgerDate(date)}
          </h1>
        </div>
        <Link
          href="/collections"
          className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-950"
        >
          Back Burner
        </Link>
      </header>

      <DailyLedgerPage ledger={ledger} availableTasks={availableTasks} />
    </main>
  );
}
