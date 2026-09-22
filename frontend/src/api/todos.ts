import { apiClient } from "./client";
import type { Todo } from "../types";

export const todosApi = {
  list: async (projectId: string): Promise<Todo[]> =>
    (await apiClient.get<Todo[]>(`/api/projects/${projectId}/todos`)).data,
  create: async (data: Omit<Todo, "id">): Promise<Todo> =>
    (await apiClient.post<Todo>(`/api/projects/${data.projectId}/todos`, data)).data,
  toggle: async (id: string): Promise<void> => {
    await apiClient.patch(`/api/todos/${id}`);
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/todos/${id}`);
  },
};
