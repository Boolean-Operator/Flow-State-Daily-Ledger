import { promises as fs } from "fs";
import path from "path";
import {
  BACK_BURNER_ID,
  AvailableTaskView,
  DataStore,
  DataStoreSchema,
  DailyLedger,
  DailyLedgerView,
  DailySection,
  Project,
  Task,
  TaskCollection,
  TaskUpdate,
} from "./types";

const DATA_PATH = path.join(process.cwd(), "dummy-data.json");

function taskBelongsToCollection(task: Task, collectionId: string) {
  return collectionId === BACK_BURNER_ID
    ? task.projectId === null
    : task.projectId === collectionId;
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
}

function isVisibleCollectionTask(task: Task) {
  return task.status !== "ARCHIVED";
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
  const openLedgerIds = new Set(
    data.dailyLedgers
      .filter((ledger) => ledger.status === "OPEN")
      .map((ledger) => ledger.id),
  );
  const activeDailyTaskIds = new Set(
    data.dailyLedgerEntries
      .filter((entry) => openLedgerIds.has(entry.ledgerId))
      .map((entry) => entry.taskId),
  );
  const backBurner: TaskCollection = {
    id: BACK_BURNER_ID,
    title: "Back Burner",
    tasks: sortTasks(
      data.tasks.filter(
        (task) =>
          task.projectId === null &&
          isVisibleCollectionTask(task) &&
          !activeDailyTaskIds.has(task.id),
      ),
    ),
    isSystem: true,
  };

  const projects = data.projects
    .filter((project) => project.status === "ACTIVE")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((project) => ({
      id: project.id,
      title: project.title,
      tasks: sortTasks(
        data.tasks.filter(
          (task) =>
            task.projectId === project.id && isVisibleCollectionTask(task),
        ),
      ),
      isSystem: false,
    }));

  return [backBurner, ...projects];
}

export async function getTaskCollectionById(
  id: string,
): Promise<TaskCollection | null> {
  const data = await readData();

  if (id === BACK_BURNER_ID) {
    return {
      id,
      title: "Back Burner",
      tasks: sortTasks(
        data.tasks.filter(
          (task) => task.projectId === null && isVisibleCollectionTask(task),
        ),
      ),
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
    tasks: sortTasks(
      data.tasks.filter(
        (task) => task.projectId === project.id && isVisibleCollectionTask(task),
      ),
    ),
    isSystem: false,
  };
}

export async function createProject(title: string): Promise<Project> {
  const data = await readData();
  const normalizedTitle = title.trim();
  if (!normalizedTitle) throw new Error("Project title is required");

  const project: Project = {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    description: null,
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

  if (
    collectionId !== BACK_BURNER_ID &&
    !data.projects.some(
      (project) => project.id === collectionId && project.status === "ACTIVE",
    )
  ) {
    throw new Error("Project not found");
  }

  const projectId = collectionId === BACK_BURNER_ID ? null : collectionId;
  const sortOrder = data.tasks.filter(
    (task) => task.projectId === projectId,
  ).length;
  const task: Task = {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    description: null,
    status: "OPEN",
    area: "UNCLASSIFIED",
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
  const collectionTaskIds = data.tasks
    .filter(
      (task) =>
        taskBelongsToCollection(task, collectionId) &&
        isVisibleCollectionTask(task),
    )
    .map((task) => task.id);

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
  if (
    destinationCollectionId !== BACK_BURNER_ID &&
    !data.projects.some(
      (project) =>
        project.id === destinationCollectionId && project.status === "ACTIVE",
    )
  ) {
    throw new Error("Destination project not found");
  }

  const destinationProjectId =
    destinationCollectionId === BACK_BURNER_ID
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

  const project: Project = {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    description: null,
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

export async function getOrCreateDailyLedger(
  date: string,
): Promise<DailyLedgerView> {
  const data = await readData();
  const existing = data.dailyLedgers.find((ledger) => ledger.date === date);
  const ledger = existing ?? findOrCreateDailyLedger(data, date);
  if (!existing) await writeData(data);
  return buildDailyLedgerView(data, ledger);
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
) {
  const data = await readData();
  const normalizedTitle = title.trim();
  if (!normalizedTitle) throw new Error("Task title is required");

  const ledger = findOrCreateDailyLedger(data, date);
  if (ledger.status !== "OPEN") throw new Error("Daily ledger is closed");
  const sortOrder = data.dailyLedgerEntries.filter(
    (entry) => entry.ledgerId === ledger.id && entry.section === section,
  ).length;
  const task: Task = {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    description: null,
    status: "OPEN",
    area: section,
    projectId: null,
    parentTaskId: null,
    priority: null,
    calculatedUrgency: null,
    hardDueDate: null,
    targetDate: date,
    sortOrder: data.tasks.filter((candidate) => candidate.projectId === null)
      .length,
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
  const entry = data.dailyLedgerEntries.find(
    (candidate) => candidate.id === entryId,
  );
  if (!entry) throw new Error("Daily ledger entry not found");
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
  const entry = data.dailyLedgerEntries.find(
    (candidate) => candidate.id === entryId,
  );
  if (!entry) throw new Error("Daily ledger entry not found");
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
  const entry = data.dailyLedgerEntries.find(
    (candidate) => candidate.id === entryId,
  );
  if (!entry) throw new Error("Daily ledger entry not found");
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
  if (!normalizedContent) throw new Error("Standup content is required");

  item.summary = normalizedContent;
  item.detail = null;
  await writeData(data);
}

export async function deleteStandupItem(itemId: string) {
  const data = await readData();
  const nextItems = data.standupItems.filter((item) => item.id !== itemId);
  if (nextItems.length === data.standupItems.length) {
    throw new Error("Standup item not found");
  }
  data.standupItems = nextItems;
  await writeData(data);
}
