import { promises as fs } from "fs";
import path from "path";
import {
  AvailableTaskView,
  DataStore,
  DataStoreSchema,
  DailyLedger,
  DailyLedgerView,
  DailySection,
  INBOX_ID,
  PERSONAL_BACK_BURNER_ID,
  Project,
  StandupItem,
  StandupItemSchema,
  Task,
  TaskArea,
  TaskCollection,
  TaskUpdate,
  WrapUpDecision,
  WrapUpStandupDraftItem,
  WORK_BACKLOG_ID,
} from "./types";
import { getRolloverDateKey } from "./dates";

const DATA_PATH = path.join(process.cwd(), "dummy-data.json");

const systemCollections: Array<{
  id: string;
  title: string;
  area: TaskArea;
}> = [
  { id: INBOX_ID, title: "Inbox", area: "UNCLASSIFIED" },
  { id: WORK_BACKLOG_ID, title: "Work Backlog", area: "WORK" },
  {
    id: PERSONAL_BACK_BURNER_ID,
    title: "Personal Back Burner",
    area: "PERSONAL",
  },
];

function getSystemCollection(collectionId: string) {
  return systemCollections.find((collection) => collection.id === collectionId);
}

function taskBelongsToCollection(task: Task, collectionId: string) {
  const systemCollection = getSystemCollection(collectionId);
  return systemCollection
    ? task.projectId === null && task.area === systemCollection.area
    : task.projectId === collectionId;
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
}

function isVisibleCollectionTask(task: Task) {
  return task.status !== "ARCHIVED";
}

function getActiveDailyTaskIds(data: DataStore) {
  const openLedgerIds = new Set(
    data.dailyLedgers
      .filter((ledger) => ledger.status === "OPEN")
      .map((ledger) => ledger.id),
  );
  return new Set(
    data.dailyLedgerEntries
      .filter((entry) => openLedgerIds.has(entry.ledgerId))
      .map((entry) => entry.taskId),
  );
}

function getCollectionTasks(data: DataStore, collectionId: string) {
  const systemCollection = getSystemCollection(collectionId);
  const activeDailyTaskIds = systemCollection
    ? getActiveDailyTaskIds(data)
    : new Set<string>();

  return data.tasks.filter(
    (task) =>
      taskBelongsToCollection(task, collectionId) &&
      isVisibleCollectionTask(task) &&
      !activeDailyTaskIds.has(task.id),
  );
}

export async function readData(): Promise<DataStore> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const parsed = DataStoreSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error(
      `dummy-data.json failed schema validation:\n${parsed.error.message}`,
    );
  }

  return parsed.data;
}

export async function writeData(data: DataStore): Promise<void> {
  const validated = DataStoreSchema.parse(data);
  const temporaryPath = `${DATA_PATH}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(validated, null, 2)}\n`);
  await fs.rename(temporaryPath, DATA_PATH);
}

export async function getTaskCollections(): Promise<TaskCollection[]> {
  const data = await readData();
  const planningLists = systemCollections.map<TaskCollection>((collection) => ({
    ...collection,
    tasks: sortTasks(getCollectionTasks(data, collection.id)),
    isSystem: true,
  }));

  const projects = data.projects
    .filter((project) => project.status === "ACTIVE")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((project) => ({
      id: project.id,
      title: project.title,
      area: project.area,
      tasks: sortTasks(
        data.tasks.filter(
          (task) =>
            task.projectId === project.id && isVisibleCollectionTask(task),
        ),
      ),
      isSystem: false,
    }));

  return [...planningLists, ...projects];
}

export async function getTaskCollectionById(
  id: string,
): Promise<TaskCollection | null> {
  const data = await readData();

  const systemCollection = getSystemCollection(id);
  if (systemCollection) {
    return {
      ...systemCollection,
      tasks: sortTasks(getCollectionTasks(data, id)),
      isSystem: true,
    };
  }

  const project = data.projects.find(
    (candidate) => candidate.id === id && candidate.status === "ACTIVE",
  );
  if (!project) return null;

  return {
    id: project.id,
    title: project.title,
    area: project.area,
    tasks: sortTasks(
      data.tasks.filter(
        (task) => task.projectId === project.id && isVisibleCollectionTask(task),
      ),
    ),
    isSystem: false,
  };
}

export async function getActiveProjects(): Promise<Project[]> {
  const data = await readData();
  return data.projects
    .filter((project) => project.status === "ACTIVE")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createProject(
  title: string,
  area: TaskArea = "UNCLASSIFIED",
): Promise<Project> {
  const data = await readData();
  const normalizedTitle = title.trim();
  if (!normalizedTitle) throw new Error("Project title is required");

  const project: Project = {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    description: null,
    area,
    status: "ACTIVE",
    sortOrder: data.projects.length,
    createdAt: new Date().toISOString(),
    archivedAt: null,
    sourceListId: null,
  };

  data.projects.push(project);
  await writeData(data);
  return project;
}

export async function updateProjectTitle(id: string, title: string) {
  const data = await readData();
  const project = data.projects.find((candidate) => candidate.id === id);
  const normalizedTitle = title.trim();

  if (!project) throw new Error("Project not found");
  if (!normalizedTitle) throw new Error("Project title is required");

  project.title = normalizedTitle;
  await writeData(data);
}

export async function updateProjectArea(id: string, area: TaskArea) {
  const data = await readData();
  const project = data.projects.find((candidate) => candidate.id === id);
  if (!project) throw new Error("Project not found");

  project.area = area;
  if (area !== "UNCLASSIFIED") {
    for (const task of data.tasks) {
      if (task.projectId === project.id) task.area = area;
    }
  }
  await writeData(data);
}

export async function archiveProject(id: string) {
  const data = await readData();
  const project = data.projects.find((candidate) => candidate.id === id);
  if (!project) throw new Error("Project not found");

  project.status = "ARCHIVED";
  project.archivedAt = new Date().toISOString();

  const nextBackBurnerOrder = data.tasks.filter(
    (task) => task.projectId === null,
  ).length;
  let offset = 0;
  for (const task of data.tasks
    .filter((candidate) => candidate.projectId === id)
    .sort((a, b) => a.sortOrder - b.sortOrder)) {
    task.projectId = null;
    task.sortOrder = nextBackBurnerOrder + offset;
    offset += 1;
  }

  await writeData(data);
}

export async function addTaskToCollection(
  collectionId: string,
  input: { title: string; targetDate: string | null; priority: number | null },
): Promise<Task> {
  const data = await readData();
  const normalizedTitle = input.title.trim();
  if (!normalizedTitle) throw new Error("Task title is required");

  const systemCollection = getSystemCollection(collectionId);
  const project = data.projects.find(
    (candidate) =>
      candidate.id === collectionId && candidate.status === "ACTIVE",
  );
  if (!systemCollection && !project) {
    throw new Error("Project not found");
  }

  const projectId = systemCollection ? null : collectionId;
  const sortOrder = data.tasks.filter(
    (task) => task.projectId === projectId,
  ).length;
  const task: Task = {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    description: null,
    status: "OPEN",
    area: systemCollection?.area ?? project?.area ?? "UNCLASSIFIED",
    projectId,
    parentTaskId: null,
    priority: input.priority,
    calculatedUrgency: null,
    hardDueDate: null,
    targetDate: input.targetDate,
    sortOrder,
    createdAt: new Date().toISOString(),
    completedAt: null,
    canceledAt: null,
    source: "APP",
    sourceListId: null,
    sourceListTitle: null,
    sourceOrder: null,
    sourcePriority: null,
  };

  data.tasks.push(task);
  await writeData(data);
  return task;
}

export async function reorderTasks(collectionId: string, taskIds: string[]) {
  const data = await readData();
  const collectionTaskIds = getCollectionTasks(data, collectionId).map(
    (task) => task.id,
  );

  if (
    taskIds.length !== collectionTaskIds.length ||
    !taskIds.every((id) => collectionTaskIds.includes(id))
  ) {
    throw new Error("Reorder request does not match the collection's tasks");
  }

  taskIds.forEach((id, sortOrder) => {
    const task = data.tasks.find((candidate) => candidate.id === id);
    if (task) task.sortOrder = sortOrder;
  });

  await writeData(data);
}

export async function updateTask(taskId: string, updates: TaskUpdate) {
  const data = await readData();
  const task = data.tasks.find((candidate) => candidate.id === taskId);
  if (!task) throw new Error("Task not found");

  if (updates.title !== undefined) {
    const normalizedTitle = updates.title.trim();
    if (!normalizedTitle) throw new Error("Task title is required");
    updates.title = normalizedTitle;
  }

  const previousStatus = task.status;
  Object.assign(task, updates);

  if (updates.status === "COMPLETED" && previousStatus !== "COMPLETED") {
    task.completedAt = new Date().toISOString();
    task.canceledAt = null;
  } else if (
    updates.status !== undefined &&
    updates.status !== "COMPLETED"
  ) {
    task.completedAt = null;
  }

  if (updates.status === "CANCELED" && previousStatus !== "CANCELED") {
    task.canceledAt = new Date().toISOString();
    task.completedAt = null;
  } else if (
    updates.status !== undefined &&
    updates.status !== "CANCELED"
  ) {
    task.canceledAt = null;
  }

  await writeData(data);
  return task;
}

export async function deleteTask(taskId: string) {
  await deleteTasks([taskId]);
}

function getUniqueTaskIds(taskIds: string[]) {
  const uniqueTaskIds = [...new Set(taskIds)];
  if (uniqueTaskIds.length === 0) throw new Error("Select at least one task");
  return uniqueTaskIds;
}

function assertTasksExist(data: DataStore, taskIds: string[]) {
  const existingTaskIds = new Set(data.tasks.map((task) => task.id));
  if (taskIds.some((id) => !existingTaskIds.has(id))) {
    throw new Error("One or more selected tasks were not found");
  }
}

function moveTasksInData(
  data: DataStore,
  taskIds: string[],
  destinationCollectionId: string,
) {
  const systemCollection = getSystemCollection(destinationCollectionId);
  const destinationProject = data.projects.find(
    (project) =>
      project.id === destinationCollectionId && project.status === "ACTIVE",
  );
  if (!systemCollection && !destinationProject) {
    throw new Error("Destination project not found");
  }

  const destinationProjectId = systemCollection
    ? null
    : destinationCollectionId;
  let nextSortOrder = data.tasks.filter(
    (task) =>
      task.projectId === destinationProjectId && !taskIds.includes(task.id),
  ).length;

  for (const taskId of taskIds) {
    const task = data.tasks.find((candidate) => candidate.id === taskId);
    if (!task) continue;
    task.projectId = destinationProjectId;
    if (systemCollection) task.area = systemCollection.area;
    else if (destinationProject && destinationProject.area !== "UNCLASSIFIED") {
      task.area = destinationProject.area;
    }
    task.sortOrder = nextSortOrder;
    nextSortOrder += 1;
  }
}

export async function moveTasks(
  taskIds: string[],
  destinationCollectionId: string,
) {
  const data = await readData();
  const uniqueTaskIds = getUniqueTaskIds(taskIds);
  assertTasksExist(data, uniqueTaskIds);
  moveTasksInData(data, uniqueTaskIds, destinationCollectionId);
  await writeData(data);
}

export async function createProjectFromTasks(
  title: string,
  taskIds: string[],
): Promise<Project> {
  const data = await readData();
  const normalizedTitle = title.trim();
  const uniqueTaskIds = getUniqueTaskIds(taskIds);
  if (!normalizedTitle) throw new Error("Project title is required");
  assertTasksExist(data, uniqueTaskIds);

  const selectedAreas = new Set(
    data.tasks
      .filter((task) => uniqueTaskIds.includes(task.id))
      .map((task) => task.area),
  );
  const area: TaskArea =
    selectedAreas.size === 1
      ? (selectedAreas.values().next().value ?? "UNCLASSIFIED")
      : "UNCLASSIFIED";
  const project: Project = {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    description: null,
    area,
    status: "ACTIVE",
    sortOrder: data.projects.length,
    createdAt: new Date().toISOString(),
    archivedAt: null,
    sourceListId: null,
  };

  data.projects.push(project);
  moveTasksInData(data, uniqueTaskIds, project.id);
  await writeData(data);
  return project;
}

export async function archiveTasks(taskIds: string[]) {
  const data = await readData();
  const uniqueTaskIds = getUniqueTaskIds(taskIds);
  assertTasksExist(data, uniqueTaskIds);
  const selectedIds = new Set(uniqueTaskIds);

  for (const task of data.tasks) {
    if (selectedIds.has(task.id)) task.status = "ARCHIVED";
  }

  await writeData(data);
}

export async function restoreArchivedTasks(taskIds: string[]) {
  const data = await readData();
  const uniqueTaskIds = getUniqueTaskIds(taskIds);
  assertTasksExist(data, uniqueTaskIds);
  const selectedIds = new Set(uniqueTaskIds);

  for (const task of data.tasks) {
    if (!selectedIds.has(task.id) || task.status !== "ARCHIVED") continue;
    task.status = task.completedAt
      ? "COMPLETED"
      : task.canceledAt
        ? "CANCELED"
        : "OPEN";
  }

  await writeData(data);
}

export async function deleteTasks(taskIds: string[]) {
  const data = await readData();
  const uniqueTaskIds = getUniqueTaskIds(taskIds);
  assertTasksExist(data, uniqueTaskIds);
  const selectedIds = new Set(uniqueTaskIds);

  data.tasks = data.tasks.filter((task) => !selectedIds.has(task.id));
  data.dailyLedgerEntries = data.dailyLedgerEntries.filter(
    (entry) => !selectedIds.has(entry.taskId),
  );
  data.radarEntries = data.radarEntries.filter(
    (entry) => !selectedIds.has(entry.taskId),
  );
  for (const item of data.standupItems) {
    if (item.taskId && selectedIds.has(item.taskId)) item.taskId = null;
  }
  await writeData(data);
}

function findOrCreateDailyLedger(data: DataStore, date: string): DailyLedger {
  const existing = data.dailyLedgers.find((ledger) => ledger.date === date);
  if (existing) return existing;

  const ledger: DailyLedger = {
    id: crypto.randomUUID(),
    date,
    status: "OPEN",
    createdAt: new Date().toISOString(),
    closedAt: null,
  };
  data.dailyLedgers.push(ledger);
  return ledger;
}

function assertActiveLedger(data: DataStore, ledger: DailyLedger) {
  const activeLedger = data.dailyLedgers
    .filter((candidate) => candidate.status === "OPEN")
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    )[0];
  if (activeLedger && activeLedger.id !== ledger.id) {
    throw new Error("Finish the active Daily Ledger before starting another day");
  }
}

function buildDailyLedgerView(
  data: DataStore,
  ledger: DailyLedger,
): DailyLedgerView {
  const projectTitles = new Map(
    data.projects.map((project) => [project.id, project.title]),
  );
  const entries = data.dailyLedgerEntries
    .filter((entry) => entry.ledgerId === ledger.id)
    .map((entry) => {
      const task = data.tasks.find((candidate) => candidate.id === entry.taskId);
      if (!task) {
        throw new Error(`Daily ledger entry ${entry.id} references a missing task`);
      }
      return {
        entry,
        task,
        projectTitle: task.projectId
          ? projectTitles.get(task.projectId) ?? null
          : null,
      };
    });

  return {
    ledger,
    standupItems: data.standupItems
      .filter((item) => item.ledgerId === ledger.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    work: entries
      .filter((item) => item.entry.section === "WORK")
      .sort((a, b) => a.entry.sortOrder - b.entry.sortOrder),
    personal: entries
      .filter((item) => item.entry.section === "PERSONAL")
      .sort((a, b) => a.entry.sortOrder - b.entry.sortOrder),
  };
}

export async function getOrCreateActiveDailyLedger(
  date: string,
): Promise<DailyLedgerView> {
  const data = await readData();
  const activeLedger = data.dailyLedgers
    .filter((ledger) => ledger.status === "OPEN")
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    )[0];
  if (activeLedger) return buildDailyLedgerView(data, activeLedger);

  const existing = data.dailyLedgers.find(
    (ledger) => ledger.date === date && ledger.status === "OPEN",
  );
  const ledger = existing ?? findOrCreateDailyLedger(data, date);
  if (!existing) await writeData(data);
  return buildDailyLedgerView(data, ledger);
}

function assertLedgerOpenForEntry(data: DataStore, entryId: string) {
  const entry = data.dailyLedgerEntries.find(
    (candidate) => candidate.id === entryId,
  );
  if (!entry) throw new Error("Daily ledger entry not found");
  const ledger = data.dailyLedgers.find(
    (candidate) => candidate.id === entry.ledgerId,
  );
  if (!ledger) throw new Error("Daily ledger not found");
  if (ledger.status !== "OPEN") throw new Error("Daily ledger is closed");
  return entry;
}

export async function wrapUpDailyLedger(
  ledgerId: string,
  currentDate: string,
  decisions: WrapUpDecision[],
  standupDraft: WrapUpStandupDraftItem[],
) {
  const data = await readData();
  const ledger = data.dailyLedgers.find((candidate) => candidate.id === ledgerId);
  if (!ledger) throw new Error("Daily ledger not found");
  if (ledger.status === "CLOSED") return;

  const ledgerEntries = data.dailyLedgerEntries.filter(
    (entry) => entry.ledgerId === ledgerId,
  );
  const unfinishedEntries = ledgerEntries.filter(
    (entry) => entry.outcome === "OPEN",
  );
  const decisionsByEntryId = new Map(
    decisions.map((decision) => [decision.entryId, decision.disposition]),
  );
  const decisionDetailsByEntryId = new Map(
    decisions.map((decision) => [decision.entryId, decision]),
  );
  const validDispositions = new Set([
    "COMPLETE",
    "MOVE",
    "DEFER",
    "CANCEL",
  ]);

  if (
    decisionsByEntryId.size !== unfinishedEntries.length ||
    unfinishedEntries.some((entry) => !decisionsByEntryId.has(entry.id)) ||
    decisions.some(
      (decision) =>
        !unfinishedEntries.some((entry) => entry.id === decision.entryId) ||
        !validDispositions.has(decision.disposition),
    )
  ) {
    throw new Error("Every unfinished task requires exactly one disposition");
  }

  for (const entry of unfinishedEntries) {
    const decision = decisionDetailsByEntryId.get(entry.id);
    if (
      entry.section === "WORK" &&
      decision?.disposition === "MOVE" &&
      decision.standupStatus !== "IN_PROGRESS" &&
      decision.standupStatus !== "NEXT" &&
      decision.standupStatus !== "EXCLUDE"
    ) {
      throw new Error(
        "Pending Work requires an In progress, Next, or Do not include Standup choice",
      );
    }
  }

  const nextDate = getRolloverDateKey(ledger.date, currentDate);
  const existingNextLedger = data.dailyLedgers.find(
    (candidate) => candidate.date === nextDate,
  );
  if (existingNextLedger?.status === "CLOSED") {
    throw new Error("The destination Daily Ledger is already closed");
  }
  const nextLedger = existingNextLedger ?? findOrCreateDailyLedger(data, nextDate);
  const now = new Date().toISOString();

  for (const entry of unfinishedEntries) {
    const task = data.tasks.find((candidate) => candidate.id === entry.taskId);
    if (!task) throw new Error(`Task not found for Daily Ledger entry ${entry.id}`);
    const disposition = decisionsByEntryId.get(entry.id);

    if (disposition === "COMPLETE") {
      entry.outcome = "COMPLETED";
      task.status = "COMPLETED";
      task.completedAt = now;
      task.canceledAt = null;
    } else if (disposition === "MOVE") {
      entry.outcome = "MOVED";
      if (task.status !== "IN_PROGRESS") task.status = "OPEN";
      task.completedAt = null;
      task.canceledAt = null;
      task.area = entry.section;
      task.targetDate = nextDate;

      const alreadyPlaced = data.dailyLedgerEntries.some(
        (candidate) =>
          candidate.ledgerId === nextLedger.id && candidate.taskId === task.id,
      );
      if (!alreadyPlaced) {
        const sortOrder = data.dailyLedgerEntries.filter(
          (candidate) =>
            candidate.ledgerId === nextLedger.id &&
            candidate.section === entry.section,
        ).length;
        data.dailyLedgerEntries.push({
          id: crypto.randomUUID(),
          ledgerId: nextLedger.id,
          taskId: task.id,
          section: entry.section,
          sortOrder,
          outcome: "OPEN",
          createdAt: now,
        });
      }
    } else if (disposition === "DEFER") {
      entry.outcome = "DEFERRED";
      task.status = "OPEN";
      task.completedAt = null;
      task.canceledAt = null;
      task.targetDate = null;
    } else if (disposition === "CANCEL") {
      entry.outcome = "CANCELED";
      task.status = "CANCELED";
      task.completedAt = null;
      task.canceledAt = now;
    }
  }

  const existingStandupTaskIds = new Set(
    data.standupItems
      .filter((item) => item.ledgerId === nextLedger.id)
      .flatMap((item) => item.sourceTaskIds ?? (item.taskId ? [item.taskId] : [])),
  );
  let nextStandupOrder = data.standupItems.filter(
    (item) => item.ledgerId === nextLedger.id,
  ).length;

  const standupCandidateTaskIds = ledgerEntries
    .filter(
      (candidate) =>
        candidate.section === "WORK" &&
        (candidate.outcome === "COMPLETED" ||
          (candidate.outcome === "MOVED" &&
            (decisionDetailsByEntryId.get(candidate.id)?.standupStatus ===
              "IN_PROGRESS" ||
              decisionDetailsByEntryId.get(candidate.id)?.standupStatus ===
                "NEXT"))),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((entry) => !existingStandupTaskIds.has(entry.taskId))
    .map((entry) => entry.taskId);
  const submittedSourceTaskIds = standupDraft.flatMap(
    (item) => item.sourceTaskIds,
  );
  const submittedSourceTaskIdSet = new Set(submittedSourceTaskIds);

  if (
    standupDraft.some(
      (item) => !item.summary.trim() || item.sourceTaskIds.length === 0,
    ) ||
    submittedSourceTaskIds.length !== submittedSourceTaskIdSet.size ||
    submittedSourceTaskIdSet.size !== standupCandidateTaskIds.length ||
    standupCandidateTaskIds.some(
      (taskId) => !submittedSourceTaskIdSet.has(taskId),
    )
  ) {
    throw new Error("The standup draft does not match the resolved Work tasks");
  }

  for (const draftItem of standupDraft) {
    data.standupItems.push({
      id: crypto.randomUUID(),
      ledgerId: nextLedger.id,
      taskId:
        draftItem.sourceTaskIds.length === 1
          ? draftItem.sourceTaskIds[0]
          : null,
      sourceTaskIds: draftItem.sourceTaskIds,
      summary: draftItem.summary.trim(),
      detail: draftItem.detail?.trim() || null,
      sortOrder: nextStandupOrder,
      createdAt: now,
    });
    nextStandupOrder += 1;
  }

  ledger.status = "CLOSED";
  ledger.closedAt = now;
  await writeData(data);
}

export async function getAvailableTasksForLedger(
  ledgerId: string,
): Promise<AvailableTaskView[]> {
  const data = await readData();
  const placedTaskIds = new Set(
    data.dailyLedgerEntries
      .filter((entry) => entry.ledgerId === ledgerId)
      .map((entry) => entry.taskId),
  );
  const projectTitles = new Map(
    data.projects.map((project) => [project.id, project.title]),
  );

  return data.tasks
    .filter(
      (task) =>
        !placedTaskIds.has(task.id) &&
        (task.status === "OPEN" || task.status === "IN_PROGRESS"),
    )
    .sort((a, b) => {
      const aDate = a.hardDueDate ?? a.targetDate ?? "9999-12-31";
      const bDate = b.hardDueDate ?? b.targetDate ?? "9999-12-31";
      return (
        aDate.localeCompare(bDate) ||
        (a.priority ?? 99) - (b.priority ?? 99) ||
        a.title.localeCompare(b.title)
      );
    })
    .map((task) => ({
      task,
      projectTitle: task.projectId
        ? projectTitles.get(task.projectId) ?? null
        : null,
    }));
}

export async function createDailyTask(
  date: string,
  section: DailySection,
  title: string,
  projectId: string | null = null,
) {
  const data = await readData();
  const normalizedTitle = title.trim();
  if (!normalizedTitle) throw new Error("Task title is required");

  const ledger = findOrCreateDailyLedger(data, date);
  if (ledger.status !== "OPEN") throw new Error("Daily ledger is closed");
  assertActiveLedger(data, ledger);
  const project = projectId
    ? data.projects.find(
        (candidate) =>
          candidate.id === projectId && candidate.status === "ACTIVE",
      )
    : null;
  if (projectId && !project) throw new Error("Project not found");
  if (project && project.area !== section) {
    throw new Error("Choose a project that matches the Daily Ledger section");
  }
  const sortOrder = data.dailyLedgerEntries.filter(
    (entry) => entry.ledgerId === ledger.id && entry.section === section,
  ).length;
  const task: Task = {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    description: null,
    status: "OPEN",
    area: section,
    projectId,
    parentTaskId: null,
    priority: null,
    calculatedUrgency: null,
    hardDueDate: null,
    targetDate: date,
    sortOrder: data.tasks.filter(
      (candidate) => candidate.projectId === projectId,
    ).length,
    createdAt: new Date().toISOString(),
    completedAt: null,
    canceledAt: null,
    source: "APP",
    sourceListId: null,
    sourceListTitle: null,
    sourceOrder: null,
    sourcePriority: null,
  };

  data.tasks.push(task);
  data.dailyLedgerEntries.push({
    id: crypto.randomUUID(),
    ledgerId: ledger.id,
    taskId: task.id,
    section,
    sortOrder,
    outcome: "OPEN",
    createdAt: new Date().toISOString(),
  });
  await writeData(data);
}

export async function addTaskToDailyLedger(
  date: string,
  taskId: string,
  section: DailySection,
) {
  const data = await readData();
  const ledger = findOrCreateDailyLedger(data, date);
  if (ledger.status !== "OPEN") throw new Error("Daily ledger is closed");
  assertActiveLedger(data, ledger);
  const task = data.tasks.find((candidate) => candidate.id === taskId);
  if (!task) throw new Error("Task not found");
  if (task.status !== "OPEN" && task.status !== "IN_PROGRESS") {
    throw new Error("Only active tasks can be added to today's ledger");
  }
  if (
    data.dailyLedgerEntries.some(
      (entry) => entry.ledgerId === ledger.id && entry.taskId === taskId,
    )
  ) {
    throw new Error("Task is already on this daily ledger");
  }

  const sortOrder = data.dailyLedgerEntries.filter(
    (entry) => entry.ledgerId === ledger.id && entry.section === section,
  ).length;
  task.area = section;
  data.dailyLedgerEntries.push({
    id: crypto.randomUUID(),
    ledgerId: ledger.id,
    taskId,
    section,
    sortOrder,
    outcome: "OPEN",
    createdAt: new Date().toISOString(),
  });
  await writeData(data);
}

export async function setDailyTaskCompleted(
  entryId: string,
  completed: boolean,
) {
  const data = await readData();
  const entry = assertLedgerOpenForEntry(data, entryId);
  const task = data.tasks.find((candidate) => candidate.id === entry.taskId);
  if (!task) throw new Error("Task not found");

  entry.outcome = completed ? "COMPLETED" : "OPEN";
  task.status = completed ? "COMPLETED" : "OPEN";
  task.completedAt = completed ? new Date().toISOString() : null;
  task.canceledAt = null;
  await writeData(data);
}

export async function updateDailyTaskTitle(entryId: string, title: string) {
  const data = await readData();
  const entry = assertLedgerOpenForEntry(data, entryId);
  const task = data.tasks.find((candidate) => candidate.id === entry.taskId);
  const normalizedTitle = title.trim();
  if (!task) throw new Error("Task not found");
  if (!normalizedTitle) throw new Error("Task title is required");
  task.title = normalizedTitle;
  await writeData(data);
}

export async function moveDailyEntry(
  entryId: string,
  section: DailySection,
) {
  const data = await readData();
  const entry = assertLedgerOpenForEntry(data, entryId);
  const task = data.tasks.find((candidate) => candidate.id === entry.taskId);
  if (!task) throw new Error("Task not found");

  entry.section = section;
  entry.sortOrder = data.dailyLedgerEntries.filter(
    (candidate) =>
      candidate.ledgerId === entry.ledgerId && candidate.section === section,
  ).length;
  task.area = section;
  await writeData(data);
}

export async function removeDailyEntry(entryId: string) {
  const data = await readData();
  assertLedgerOpenForEntry(data, entryId);
  const nextEntries = data.dailyLedgerEntries.filter(
    (entry) => entry.id !== entryId,
  );
  if (nextEntries.length === data.dailyLedgerEntries.length) {
    throw new Error("Daily ledger entry not found");
  }
  data.dailyLedgerEntries = nextEntries;
  await writeData(data);
}

export async function reorderDailyEntries(
  ledgerId: string,
  section: DailySection,
  entryIds: string[],
) {
  const data = await readData();
  const ledger = data.dailyLedgers.find((candidate) => candidate.id === ledgerId);
  if (!ledger) throw new Error("Daily ledger not found");
  if (ledger.status !== "OPEN") throw new Error("Daily ledger is closed");
  const sectionEntryIds = data.dailyLedgerEntries
    .filter(
      (entry) => entry.ledgerId === ledgerId && entry.section === section,
    )
    .map((entry) => entry.id);
  if (
    entryIds.length !== sectionEntryIds.length ||
    !entryIds.every((id) => sectionEntryIds.includes(id))
  ) {
    throw new Error("Reorder request does not match the daily section");
  }
  entryIds.forEach((id, sortOrder) => {
    const entry = data.dailyLedgerEntries.find(
      (candidate) => candidate.id === id,
    );
    if (entry) entry.sortOrder = sortOrder;
  });
  await writeData(data);
}

export async function addStandupItem(ledgerId: string, content: string) {
  const data = await readData();
  const ledger = data.dailyLedgers.find((candidate) => candidate.id === ledgerId);
  const normalizedContent = content.trim();
  if (!ledger) throw new Error("Daily ledger not found");
  if (ledger.status !== "OPEN") throw new Error("Daily ledger is closed");
  if (!normalizedContent) throw new Error("Standup content is required");

  data.standupItems.push({
    id: crypto.randomUUID(),
    ledgerId,
    taskId: null,
    summary: normalizedContent,
    detail: null,
    sortOrder: data.standupItems.filter((item) => item.ledgerId === ledgerId)
      .length,
    createdAt: new Date().toISOString(),
  });
  await writeData(data);
}

export async function updateStandupItem(itemId: string, content: string) {
  const data = await readData();
  const item = data.standupItems.find((candidate) => candidate.id === itemId);
  const normalizedContent = content.trim();
  if (!item) throw new Error("Standup item not found");
  const ledger = data.dailyLedgers.find(
    (candidate) => candidate.id === item.ledgerId,
  );
  if (!ledger) throw new Error("Daily ledger not found");
  if (ledger.status !== "OPEN") throw new Error("Daily ledger is closed");
  if (!normalizedContent) throw new Error("Standup content is required");

  item.summary = normalizedContent;
  item.detail = null;
  await writeData(data);
}

export async function reorderStandupItems(
  ledgerId: string,
  itemIds: string[],
) {
  const data = await readData();
  const ledger = data.dailyLedgers.find((candidate) => candidate.id === ledgerId);
  if (!ledger) throw new Error("Daily ledger not found");
  if (ledger.status !== "OPEN") throw new Error("Daily ledger is closed");

  const ledgerItemIds = data.standupItems
    .filter((item) => item.ledgerId === ledgerId)
    .map((item) => item.id);
  const requestedItemIds = new Set(itemIds);
  if (
    itemIds.length !== ledgerItemIds.length ||
    requestedItemIds.size !== itemIds.length ||
    ledgerItemIds.some((id) => !requestedItemIds.has(id))
  ) {
    throw new Error("Reorder request does not match the standup items");
  }

  itemIds.forEach((id, sortOrder) => {
    const item = data.standupItems.find((candidate) => candidate.id === id);
    if (item) item.sortOrder = sortOrder;
  });
  await writeData(data);
}

export async function deleteStandupItem(itemId: string): Promise<StandupItem> {
  const data = await readData();
  const item = data.standupItems.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error("Standup item not found");
  const ledger = data.dailyLedgers.find(
    (candidate) => candidate.id === item.ledgerId,
  );
  if (!ledger) throw new Error("Daily ledger not found");
  if (ledger.status !== "OPEN") throw new Error("Daily ledger is closed");
  const nextItems = data.standupItems.filter((item) => item.id !== itemId);
  if (nextItems.length === data.standupItems.length) {
    throw new Error("Standup item not found");
  }
  data.standupItems = nextItems;
  for (const remainingItem of data.standupItems) {
    if (
      remainingItem.ledgerId === item.ledgerId &&
      remainingItem.sortOrder > item.sortOrder
    ) {
      remainingItem.sortOrder -= 1;
    }
  }
  await writeData(data);
  return item;
}

export async function restoreStandupItem(
  candidate: StandupItem,
): Promise<StandupItem> {
  const data = await readData();
  const item = StandupItemSchema.parse(candidate);
  const existing = data.standupItems.find(
    (standupItem) => standupItem.id === item.id,
  );
  if (existing) return existing;

  const ledger = data.dailyLedgers.find(
    (dailyLedger) => dailyLedger.id === item.ledgerId,
  );
  if (!ledger) throw new Error("Daily ledger not found");
  if (ledger.status !== "OPEN") throw new Error("Daily ledger is closed");
  if (
    item.taskId &&
    !data.tasks.some((task) => task.id === item.taskId)
  ) {
    throw new Error("Linked task not found");
  }

  const ledgerItems = data.standupItems.filter(
    (standupItem) => standupItem.ledgerId === item.ledgerId,
  );
  const restoredSortOrder = Math.min(item.sortOrder, ledgerItems.length);
  for (const existingItem of ledgerItems) {
    if (existingItem.sortOrder >= restoredSortOrder) {
      existingItem.sortOrder += 1;
    }
  }

  const restoredItem = {
    ...item,
    sortOrder: restoredSortOrder,
  };
  data.standupItems.push(restoredItem);
  await writeData(data);
  return restoredItem;
}
