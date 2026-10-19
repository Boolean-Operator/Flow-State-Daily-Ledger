export interface StandupDraftCandidate {
  taskId: string;
  title: string;
  status: "COMPLETE" | "IN_PROGRESS" | "NEXT";
  sortOrder: number;
}

export interface StandupDraftItem {
  summary: string;
  detail: string | null;
  sourceTaskIds: string[];
}

const TICKET_PATTERN = /\b([A-Z][A-Z0-9]+)\s*-\s*(\d+)\b/i;

export function getTicketKey(title: string) {
  const match = title.match(TICKET_PATTERN);
  return match ? `${match[1].toUpperCase()}-${match[2]}` : null;
}

function removeTicketFromTitle(title: string) {
  const withoutTicket = title.replace(TICKET_PATTERN, "").trim();
  return withoutTicket.replace(/^[-–—:\s]+/, "").trim() || title;
}

function statusLabel(status: StandupDraftCandidate["status"]) {
  if (status === "COMPLETE") return "Complete";
  if (status === "NEXT") return "Next";
  return "In progress";
}

export function buildStandupDraft(
  candidates: StandupDraftCandidate[],
  consolidateMatchingTickets: boolean,
): StandupDraftItem[] {
  const ordered = [...candidates].sort((a, b) => a.sortOrder - b.sortOrder);
  const ticketCounts = new Map<string, number>();

  for (const candidate of ordered) {
    const ticketKey = getTicketKey(candidate.title);
    if (ticketKey) {
      ticketCounts.set(ticketKey, (ticketCounts.get(ticketKey) ?? 0) + 1);
    }
  }

  const emittedTickets = new Set<string>();
  const draft: StandupDraftItem[] = [];

  for (const candidate of ordered) {
    const ticketKey = getTicketKey(candidate.title);
    const shouldGroup =
      consolidateMatchingTickets &&
      ticketKey !== null &&
      (ticketCounts.get(ticketKey) ?? 0) > 1;

    if (!shouldGroup) {
      draft.push({
        summary: `${candidate.title} — ${statusLabel(candidate.status)}`,
        detail: null,
        sourceTaskIds: [candidate.taskId],
      });
      continue;
    }

    if (emittedTickets.has(ticketKey)) continue;
    emittedTickets.add(ticketKey);

    const groupedCandidates = ordered.filter(
      (item) => getTicketKey(item.title) === ticketKey,
    );
    const overallStatus = groupedCandidates.some(
      (item) => item.status === "IN_PROGRESS",
    )
      ? "In progress"
      : groupedCandidates.some((item) => item.status === "NEXT")
        ? "Next"
        : "Complete";

    draft.push({
      summary: `${ticketKey} — ${overallStatus}`,
      detail: groupedCandidates
        .map(
          (item) =>
            `${statusLabel(item.status)} — ${removeTicketFromTitle(item.title)}`,
        )
        .join("\n"),
      sourceTaskIds: groupedCandidates.map((item) => item.taskId),
    });
  }

  return draft;
}
