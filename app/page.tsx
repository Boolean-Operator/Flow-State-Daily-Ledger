import { connection } from "next/server";
import DailyLedgerPage from "@/components/daily/DailyLedgerPage";
import {
  getAvailableTasksForLedger,
  getOrCreateActiveDailyLedger,
} from "@/lib/data";
import { formatLedgerDate, getTodayDateKey } from "@/lib/dates";

export default async function HomePage() {
  await connection();
  const today = getTodayDateKey();
  const ledger = await getOrCreateActiveDailyLedger(today);
  const availableTasks = await getAvailableTasksForLedger(ledger.ledger.id);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
      <header className="mb-4 px-1 sm:px-2">
        <h1 className="flex items-baseline justify-between gap-4 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          <span>Daily Ledger</span>
          <span className="text-right">{formatLedgerDate(ledger.ledger.date)}</span>
        </h1>
      </header>

      <DailyLedgerPage
        key={ledger.ledger.id}
        ledger={ledger}
        availableTasks={availableTasks}
        todayDate={today}
      />
    </main>
  );
}
