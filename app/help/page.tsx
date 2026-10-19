import Link from "next/link";

const standupQuestions = [
  {
    question: "What is the Standup section?",
    answer:
      "It is an editable presentation draft for your morning standup, not another task list. Use it to prepare concise talking points about completed Work and other reportable context.",
  },
  {
    question: "How are standup items created?",
    answer:
      "Wrap Up creates an editable Standup preview. Completed Work is included as Complete. For unfinished Work kept pending, choose In progress, Next, or Do not include; the task remains an open to-do on the next Work list regardless of that reporting choice. Matching ticket identifiers can be consolidated. Personal items receive the same outcome review but never enter Standup.",
  },
  {
    question: "Can I edit or reorder the draft?",
    answer:
      "Yes. Reword and reorder items for a clear verbal recap. You can also add a manual item for progress, a blocker, a meeting, or other useful context that is not represented by a completed task.",
  },
  {
    question: "When should I remove an item from standup?",
    answer:
      "Normally, keep generated items and edit them for clarity. If you consolidate several items into one talking point, remove the redundant presentation items afterward. Removing an item does not delete or reopen its original task, and a short Undo opportunity is provided.",
  },
  {
    question: "What makes a useful standup item?",
    answer:
      "One concise primary point is ideal. Add optional supporting detail only when it helps explain the result, progress, or blocker.",
  },
  {
    question: "Why is Standup hidden on weekends?",
    answer:
      "Saturday and Sunday ledgers keep their Work and Personal sections but omit the Standup presentation. Weekend rollover and task history continue to work normally.",
  },
  {
    question: "Is completing standup the same as wrapping up the day?",
    answer:
      "No. Standup is a presentation of prior Work. Wrap Up Day records today’s outcomes, resolves unfinished tasks, and prepares the next ledger.",
  },
];

const planningQuestions = [
  {
    question: "What belongs in Plan?",
    answer:
      "Plan holds canonical tasks that are not limited to today: standalone Work, standalone Personal items, uncategorized Inbox items, and Work or Personal projects.",
  },
  {
    question: "What is the Inbox?",
    answer:
      "Inbox is a temporary home for tasks that have not yet been classified as Work or Personal or assigned to a project.",
  },
  {
    question: "How do I move items between planning lists or projects?",
    answer:
      "Open the source list or project, choose Select items, select the tasks, choose a destination under Move to, and confirm Move selected.",
  },
  {
    question: "What is the difference between Archive and Delete?",
    answer:
      "Archive removes a task from active planning views while retaining its record. Use the archive button on the task for the normal cleanup path; a brief notice offers Undo. Permanent deletion is available only through Select items, followed by Delete and an irreversible-action confirmation.",
  },
  {
    question: "Where does Add a task save new items?",
    answer:
      "Add a task is optimized for fast capture: choose Work or Personal, and the task is saved to Work Backlog or Personal Back Burner while also appearing on Today. During Wrap Up, choose whether unfinished items stay pending tomorrow, return to planning, or are canceled.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "The current beta stores data in the local JSON data file on this machine. The product’s governing principle is that the user retains practical control over access, export, migration, and deletion.",
  },
];

function QuestionGroup({
  title,
  questions,
}: {
  title: string;
  questions: Array<{ question: string; answer: string }>;
}) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-lg font-bold text-slate-950">{title}</h2>
      <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {questions.map((item) => (
          <details key={item.question} className="group px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
              <span>{item.question}</span>
              <span
                aria-hidden="true"
                className="text-slate-400 transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-8 px-4 py-5 sm:px-6 sm:py-6">
      <header className="px-1 sm:px-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Help
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          Flow State Daily Ledger FAQ
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Practical guidance for using Today, Standup, and Plan without creating
          duplicate tasks or losing history.
        </p>
      </header>

      <QuestionGroup title="Standup" questions={standupQuestions} />
      <QuestionGroup title="Planning and projects" questions={planningQuestions} />

      <p className="px-1 text-sm text-slate-500">
        Ready to continue? Return to <Link href="/" className="font-semibold text-blue-700 hover:text-blue-900">Today</Link> or open <Link href="/collections" className="font-semibold text-blue-700 hover:text-blue-900">Plan</Link>.
      </p>
    </main>
  );
}
