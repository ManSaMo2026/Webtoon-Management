import { todoStore } from "../mocks/store";
import type { Todo } from "../types";

export const todosApi = {
  list: (projectId: string) => todoStore.getByProject(projectId),
  create: (data: Omit<Todo, "id">) => todoStore.create(data),
  toggle: (id: string) => todoStore.toggle(id),
  delete: (id: string) => todoStore.delete(id),
};
