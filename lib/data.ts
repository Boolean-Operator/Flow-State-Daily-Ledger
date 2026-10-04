// lib/data.ts
import { promises as fs } from "fs";
import path from "path";
import { DataStore, TodoList, TodoItem } from "./types";

const DATA_PATH = path.join(process.cwd(), "dummy-data.json");

// --- Core Persistence ---
export async function readData(): Promise<DataStore> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

export async function writeData(data: DataStore): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

// --- List Operations ---
export async function getLists(): Promise<TodoList[]> {
  const data = await readData();
  return data.lists;
}

export async function createList(title: string) {
  const data = await readData();
  const newList = {
    id: crypto.randomUUID(),
    title,
    todos: [],
  };
  data.lists.push(newList);
  await writeData(data);
  return newList;
}

export async function updateListTitle(id: string, title: string) {
  const data = await readData();
  const list = data.lists.find((l) => l.id === id);
  if (list) {
    list.title = title;
    await writeData(data);
  }
}

export async function deleteList(id: string) {
  const data = await readData();
  data.lists = data.lists.filter((l) => l.id !== id);
  await writeData(data);
}

export async function getListById(id: string): Promise<TodoList | null> {
  const data = await readData();
  return data.lists.find((l) => l.id === id) || null;
}

// --- Todo Operations (replaces api/lists/[listid]/todos/route.ts) ---
export async function addTodoToList(
  listId: string,
  todoData: Omit<TodoItem, "id" | "completed" | "order">,
) {
  const data = await readData();
  const list = data.lists.find((l) => l.id === listId);
  if (!list) throw new Error("List not found");

  const newTodo: TodoItem = {
    ...todoData,
    id: crypto.randomUUID(),
    completed: false,
    order: list.todos.length, // Add to end of list
  };

  list.todos.push(newTodo);
  await writeData(data);
  return newTodo;
}

// --- Reorder Operations (replaces api/lists/[listid]/reorder/route.ts) ---
export async function reorderTodos(listId: string, todoIds: string[]) {
  const data = await readData();
  const list = data.lists.find((l) => l.id === listId);
  if (!list) throw new Error("List not found");

  // Re-map todos based on the new order of IDs and update their .order property
  list.todos = todoIds.map((id, index) => {
    const todo = list.todos.find((t) => t.id === id);
    if (!todo) throw new Error(`Todo ${id} not found`);
    return { ...todo, order: index };
  });

  await writeData(data);
  return list.todos;
}

// --- Update Todo (e.g., checking/unchecking) ---
export async function updateTodo(
  listId: string,
  todoId: string,
  updates: Partial<TodoItem>,
) {
  const data = await readData();
  const list = data.lists.find((l) => l.id === listId);
  const todo = list?.todos.find((t) => t.id === todoId);

  if (!todo) throw new Error("Todo not found");

  Object.assign(todo, updates);

  // Handle completedAt timestamp automatically
  if (updates.completed === true) todo.completedAt = new Date().toISOString();
  if (updates.completed === false) todo.completedAt = undefined;

  await writeData(data);
  return todo;
}
