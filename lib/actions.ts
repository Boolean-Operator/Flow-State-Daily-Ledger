// lib/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import * as dal from "./data";
import { TodoItem } from "./types";

export async function createListAction(title: string) {
  await dal.createList(title);
  revalidatePath("/"); // Refreshes the Home Page list
}

export async function updateListTitleAction(id: string, title: string) {
  await dal.updateListTitle(id, title);
  revalidatePath("/"); // Updates the title in the Home Page list
}

export async function deleteListAction(id: string) {
  await dal.deleteList(id);
  revalidatePath("/");
}

export async function addTodoAction(
  listId: string,
  title: string,
  targetDate: string,
  priority?: number,
) {
  await dal.addTodoToList(listId, { title, targetDate, priority });
  revalidatePath(`/lists/${listId}`);
}

export async function updateTodoAction(
  listId: string,
  todoId: string,
  updates: Partial<TodoItem>,
) {
  await dal.updateTodo(listId, todoId, updates);
  revalidatePath(`/lists/${listId}`);
}

export async function deleteTodoAction(listId: string, todoId: string) {
  const data = await dal.readData();
  const list = data.lists.find((l) => l.id === listId);
  if (list) {
    list.todos = list.todos.filter((t) => t.id !== todoId);
    await dal.writeData(data);
  }
  revalidatePath(`/lists/${listId}`);
}

export async function reorderTodosAction(listId: string, todoIds: string[]) {
  await dal.reorderTodos(listId, todoIds);
  revalidatePath(`/lists/${listId}`);
}
