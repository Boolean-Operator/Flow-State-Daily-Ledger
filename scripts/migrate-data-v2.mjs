import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataPath = path.join(process.cwd(), "dummy-data.json");
const legacy = JSON.parse(await readFile(dataPath, "utf8"));

if (legacy.schemaVersion === 2) {
  const needsPriorityUpgrade = legacy.tasks.some(
    (task) => task.sourcePriority === undefined,
  );

  if (!needsPriorityUpgrade) {
    console.log("dummy-data.json is already schema version 2; nothing to migrate.");
    process.exit(0);
  }

  legacy.tasks = legacy.tasks.map((task) => ({
    ...task,
    priority:
      Number.isInteger(task.priority) && task.priority >= 1 && task.priority <= 5
        ? task.priority
        : null,
    sourcePriority: task.priority ?? null,
  }));
  await writeFile(dataPath, `${JSON.stringify(legacy, null, 2)}\n`);
  console.log("Added sourcePriority and normalized working priorities to 1–5.");
  process.exit(0);
}

if (!Array.isArray(legacy.lists)) {
  throw new Error("Expected the legacy data to contain a lists array.");
}

const migratedAt = "2026-10-05T00:00:00-04:00";
const backBurner = legacy.lists.find((list) => list.title === "Back Burner");
const projectLists = legacy.lists.filter((list) => list !== backBurner);

const projects = projectLists.map((list, sortOrder) => ({
  id: list.id,
  title: list.title,
  description: null,
  status: "ACTIVE",
  sortOrder,
  createdAt: migratedAt,
  archivedAt: null,
  sourceListId: list.id,
}));

const tasks = legacy.lists.flatMap((list) =>
  list.todos.map((todo, fallbackOrder) => ({
    id: todo.id,
    title: todo.title,
    description: null,
    status: todo.completed ? "COMPLETED" : "OPEN",
    area: "UNCLASSIFIED",
    projectId: list === backBurner ? null : list.id,
    parentTaskId: null,
    priority:
      Number.isInteger(todo.priority) && todo.priority >= 1 && todo.priority <= 5
        ? todo.priority
        : null,
    calculatedUrgency: null,
    hardDueDate: null,
    targetDate: todo.targetDate || null,
    sortOrder: Number.isInteger(todo.order) ? todo.order : fallbackOrder,
    createdAt: migratedAt,
    completedAt: todo.completedAt || null,
    canceledAt: null,
    source: list === backBurner ? "ANALOG_IMPORT" : "MIGRATED",
    sourceListId: list.id,
    sourceListTitle: list.title,
    sourceOrder: Number.isInteger(todo.order) ? todo.order : fallbackOrder,
    sourcePriority: typeof todo.priority === "number" ? todo.priority : null,
  })),
);

const normalized = {
  schemaVersion: 2,
  projects,
  tasks,
  dailyLedgers: [],
  dailyLedgerEntries: [],
  radarEntries: [],
  standupItems: [],
};

await writeFile(dataPath, `${JSON.stringify(normalized, null, 2)}\n`);
console.log(
  `Migrated ${tasks.length} tasks and ${projects.length} projects to schema version 2.`,
);
