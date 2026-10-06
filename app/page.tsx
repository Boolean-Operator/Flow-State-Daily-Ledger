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
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
      <header className="mb-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Daily Ledger
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {formatLedgerDate(date)}
          </h1>
        </div>
      </header>

      <DailyLedgerPage ledger={ledger} availableTasks={availableTasks} />
    </main>
  );
}
