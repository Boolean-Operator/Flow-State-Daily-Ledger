import { promises as fs } from "fs";
import path from "path";
import {
  BACK_BURNER_ID,
  DataStore,
  DataStoreSchema,
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
  const backBurner: TaskCollection = {
    id: BACK_BURNER_ID,
    title: "Back Burner",
    tasks: sortTasks(data.tasks.filter((task) => task.projectId === null)),
    isSystem: true,
  };

  const projects = data.projects
    .filter((project) => project.status === "ACTIVE")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((project) => ({
      id: project.id,
      title: project.title,
      tasks: sortTasks(
        data.tasks.filter((task) => task.projectId === project.id),
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
      tasks: sortTasks(data.tasks.filter((task) => task.projectId === null)),
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
    tasks: sortTasks(data.tasks.filter((task) => task.projectId === project.id)),
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
    .filter((task) => taskBelongsToCollection(task, collectionId))
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
  const data = await readData();
  const nextTasks = data.tasks.filter((task) => task.id !== taskId);
  if (nextTasks.length === data.tasks.length) throw new Error("Task not found");

  data.tasks = nextTasks;
  await writeData(data);
}
