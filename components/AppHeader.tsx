"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  const todayIsActive = pathname === "/";
  const planIsActive =
    pathname === "/collections" || pathname.startsWith("/lists/");
  const helpIsActive = pathname === "/help";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link
          href="/"
          aria-label="Flow-State Daily Ledger home"
          className="flex min-w-0 items-center gap-2 text-slate-950"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="20 7 65 86"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-7"
            >
              <path d="M 45 75 C 45 85, 30 85, 30 70 L 30 25 C 30 15, 45 15, 60 15 L 65 15 C 75 15, 75 32, 65 32 L 45 32 C 38 32, 38 46, 45 46 L 60 46 C 70 46, 70 63, 60 63 L 45 63" />
            </svg>
          </span>
          <span className="hidden truncate text-sm font-bold tracking-tight sm:inline sm:text-base">
            Flow State Daily Ledger
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-1">
          <Link
            href="/"
            aria-current={todayIsActive ? "page" : undefined}
            className={`rounded-full border px-2.5 py-1.5 text-sm font-semibold transition hover:bg-slate-100 hover:text-slate-950 ${
              todayIsActive
                ? "border-slate-300 bg-slate-50 text-slate-950 shadow-sm"
                : "border-transparent text-slate-600"
            }`}
          >
            Today
          </Link>
          <Link
            href="/collections"
            aria-current={planIsActive ? "page" : undefined}
            className={`rounded-full border px-2.5 py-1.5 text-sm font-semibold transition hover:bg-slate-100 hover:text-slate-950 ${
              planIsActive
                ? "border-slate-300 bg-slate-50 text-slate-950 shadow-sm"
                : "border-transparent text-slate-600"
            }`}
          >
            Plan
          </Link>
          <Link
            href="/help"
            aria-current={helpIsActive ? "page" : undefined}
            className={`rounded-full border px-2.5 py-1.5 text-sm font-semibold transition hover:bg-slate-100 hover:text-slate-950 ${
              helpIsActive
                ? "border-slate-300 bg-slate-50 text-slate-950 shadow-sm"
                : "border-transparent text-slate-600"
            }`}
          >
            Help
          </Link>
        </nav>
      </div>
    </header>
  );
}
