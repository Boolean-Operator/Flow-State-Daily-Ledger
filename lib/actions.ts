"use server";

import { revalidatePath } from "next/cache";
import * as dal from "./data";
import { TaskUpdate } from "./types";

function revalidateCollection(collectionId?: string) {
  revalidatePath("/");
  if (collectionId) revalidatePath(`/lists/${collectionId}`);
}

export async function createProjectAction(title: string) {
  await dal.createProject(title);
  revalidateCollection();
}

export async function updateProjectTitleAction(id: string, title: string) {
  await dal.updateProjectTitle(id, title);
  revalidateCollection(id);
}

export async function archiveProjectAction(id: string) {
  await dal.archiveProject(id);
  revalidateCollection(id);
}

export async function addTaskAction(
  collectionId: string,
  title: string,
  targetDate: string,
  priority?: number,
) {
  await dal.addTaskToCollection(collectionId, {
    title,
    targetDate: targetDate || null,
    priority: priority ?? null,
  });
  revalidateCollection(collectionId);
}

export async function updateTaskAction(
  collectionId: string,
  taskId: string,
  updates: TaskUpdate,
) {
  await dal.updateTask(taskId, updates);
  revalidateCollection(collectionId);
}

export async function deleteTaskAction(
  collectionId: string,
  taskId: string,
) {
  await dal.deleteTask(taskId);
  revalidateCollection(collectionId);
}

export async function reorderTasksAction(
  collectionId: string,
  taskIds: string[],
) {
  await dal.reorderTasks(collectionId, taskIds);
  revalidateCollection(collectionId);
}
