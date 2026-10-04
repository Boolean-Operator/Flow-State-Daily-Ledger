export interface TodoItem {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedAt?: string;
  order: number;
  priority?: number; // 1 (highest) to N (lowest), optional for backward compatibility
}

export interface TodoList {
  id: string;
  title: string;
  todos: TodoItem[];
}

export interface DataStore {
  lists: TodoList[];
}
