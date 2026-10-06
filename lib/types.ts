import { z } from "zod";

export const SCHEMA_VERSION = 2 as const;
export const BACK_BURNER_ID = "backburner";

export const ProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.string().datetime({ offset: true }),
  archivedAt: z.string().datetime({ offset: true }).nullable(),
  sourceListId: z.string().nullable(),
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().nullable(),
  status: z.enum([
    "OPEN",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELED",
    "ARCHIVED",
  ]),
  area: z.enum(["WORK", "PERSONAL", "UNCLASSIFIED"]),
  projectId: z.string().nullable(),
  parentTaskId: z.string().nullable(),
  priority: z.number().int().min(1).max(5).nullable(),
  calculatedUrgency: z.number().min(0).max(100).nullable(),
  hardDueDate: z.string().date().nullable(),
  targetDate: z.string().date().nullable(),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).nullable(),
  canceledAt: z.string().datetime({ offset: true }).nullable(),
  source: z.enum(["ANALOG_IMPORT", "APP", "MIGRATED"]),
  sourceListId: z.string().nullable(),
  sourceListTitle: z.string().nullable(),
  sourceOrder: z.number().int().nonnegative().nullable(),
  sourcePriority: z.number().positive().nullable(),
});

export const DailyLedgerSchema = z.object({
  id: z.string().min(1),
  date: z.string().date(),
  status: z.enum(["OPEN", "CLOSED"]),
  createdAt: z.string().datetime({ offset: true }),
  closedAt: z.string().datetime({ offset: true }).nullable(),
});

export const DailyLedgerEntrySchema = z.object({
  id: z.string().min(1),
  ledgerId: z.string().min(1),
  taskId: z.string().min(1),
  section: z.enum(["WORK", "PERSONAL"]),
  sortOrder: z.number().int().nonnegative(),
  outcome: z.enum(["OPEN", "COMPLETED", "MOVED", "DEFERRED", "CANCELED"]),
  createdAt: z.string().datetime({ offset: true }),
});

export const RadarEntrySchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  radar: z.enum(["WEEKLY", "ROLLING_30"]),
  status: z.enum(["ACTIVE", "REMOVED"]),
  source: z.enum(["USER", "RULE", "ASSISTANT"]),
  sortOrder: z.number().int().nonnegative(),
  addedAt: z.string().datetime({ offset: true }),
  removedAt: z.string().datetime({ offset: true }).nullable(),
});

export const StandupItemSchema = z.object({
  id: z.string().min(1),
  ledgerId: z.string().min(1),
  taskId: z.string().nullable(),
  summary: z.string().trim().min(1),
  detail: z.string().nullable(),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.string().datetime({ offset: true }),
});

export const DataStoreSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  projects: z.array(ProjectSchema),
  tasks: z.array(TaskSchema),
  dailyLedgers: z.array(DailyLedgerSchema),
  dailyLedgerEntries: z.array(DailyLedgerEntrySchema),
  radarEntries: z.array(RadarEntrySchema),
  standupItems: z.array(StandupItemSchema),
});

export type Project = z.infer<typeof ProjectSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type DailyLedger = z.infer<typeof DailyLedgerSchema>;
export type DailyLedgerEntry = z.infer<typeof DailyLedgerEntrySchema>;
export type StandupItem = z.infer<typeof StandupItemSchema>;
export type DataStore = z.infer<typeof DataStoreSchema>;

/** A read model for the existing list-shaped UI; tasks remain flat in storage. */
export interface TaskCollection {
  id: string;
  title: string;
  tasks: Task[];
  isSystem: boolean;
}

export type DailySection = "WORK" | "PERSONAL";

export interface DailyTaskView {
  entry: DailyLedgerEntry;
  task: Task;
  projectTitle: string | null;
}

export interface DailyLedgerView {
  ledger: DailyLedger;
  standupItems: StandupItem[];
  work: DailyTaskView[];
  personal: DailyTaskView[];
}

export interface AvailableTaskView {
  task: Task;
  projectTitle: string | null;
}

export type TaskUpdate = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "status"
    | "area"
    | "projectId"
    | "parentTaskId"
    | "priority"
    | "calculatedUrgency"
    | "hardDueDate"
    | "targetDate"
  >
>;
