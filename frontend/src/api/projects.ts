import { projectStore } from "../mocks/store";
import type { Project } from "../types";

// Replace these with apiClient calls when backend is ready:
// e.g. apiClient.get("/projects").then(r => r.data)

export const projectsApi = {
  list: () => projectStore.getAll(),
  get: (id: string) => projectStore.getById(id),
  create: (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "currentEpisode" | "successRate" | "riskLevel">) =>
    projectStore.create(data),
  update: (id: string, data: Partial<Project>) => projectStore.update(id, data),
  delete: (id: string) => projectStore.delete(id),
};
