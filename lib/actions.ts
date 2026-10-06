"use server";

import { revalidatePath } from "next/cache";
import * as dal from "./data";
import { DailySection, TaskUpdate } from "./types";

function revalidateCollection(collectionId?: string) {
  revalidatePath("/");
  revalidatePath("/collections");
  if (collectionId) revalidatePath(`/lists/${collectionId}`);
}

function revalidateDailyLedger() {
  revalidatePath("/");
  revalidatePath("/collections");
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

export async function createDailyTaskAction(
  date: string,
  section: DailySection,
  title: string,
) {
  await dal.createDailyTask(date, section, title);
  revalidateDailyLedger();
}

export async function addTaskToDailyLedgerAction(
  date: string,
  taskId: string,
  section: DailySection,
) {
  await dal.addTaskToDailyLedger(date, taskId, section);
  revalidateDailyLedger();
}

export async function setDailyTaskCompletedAction(
  entryId: string,
  completed: boolean,
) {
  await dal.setDailyTaskCompleted(entryId, completed);
  revalidateDailyLedger();
}

export async function updateDailyTaskTitleAction(
  entryId: string,
  title: string,
) {
  await dal.updateDailyTaskTitle(entryId, title);
  revalidateDailyLedger();
}

export async function moveDailyEntryAction(
  entryId: string,
  section: DailySection,
) {
  await dal.moveDailyEntry(entryId, section);
  revalidateDailyLedger();
}

export async function removeDailyEntryAction(entryId: string) {
  await dal.removeDailyEntry(entryId);
  revalidateDailyLedger();
}

export async function reorderDailyEntriesAction(
  ledgerId: string,
  section: DailySection,
  entryIds: string[],
) {
  await dal.reorderDailyEntries(ledgerId, section, entryIds);
  revalidateDailyLedger();
}

export async function addStandupItemAction(
  ledgerId: string,
  content: string,
) {
  await dal.addStandupItem(ledgerId, content);
  revalidateDailyLedger();
}

export async function updateStandupItemAction(
  itemId: string,
  content: string,
) {
  await dal.updateStandupItem(itemId, content);
  revalidateDailyLedger();
}

export async function deleteStandupItemAction(itemId: string) {
  await dal.deleteStandupItem(itemId);
  revalidateDailyLedger();
}
