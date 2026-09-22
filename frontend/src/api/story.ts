import { apiClient } from "./client";
import { projectsApi } from "./projects";
import type { Episode, Foreshadow, Act } from "../types";
import { aiApi } from "./ai.api";

export const storyApi = {
  getEpisodes: async (projectId: string): Promise<Episode[]> =>
    (await apiClient.get<Episode[]>(`/api/projects/${projectId}/episodes`)).data,
  createEpisode: async (data: Omit<Episode, "id">): Promise<Episode> =>
    (await apiClient.post<Episode>(`/api/projects/${data.projectId}/episodes`, data)).data,
  updateEpisode: async (id: string, data: Partial<Episode>): Promise<Episode> =>
    (await apiClient.put<Episode>(`/api/episodes/${id}`, data)).data,
  deleteEpisode: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/episodes/${id}`);
  },

  getForeshadows: async (projectId: string): Promise<Foreshadow[]> =>
    (await apiClient.get<Foreshadow[]>(`/api/projects/${projectId}/foreshadows`)).data,
  createForeshadow: async (data: Omit<Foreshadow, "id">): Promise<Foreshadow> =>
    (await apiClient.post<Foreshadow>(`/api/projects/${data.projectId}/foreshadows`, data)).data,
  updateForeshadow: async (id: string, data: Partial<Foreshadow>): Promise<Foreshadow> =>
    (await apiClient.put<Foreshadow>(`/api/foreshadows/${id}`, data)).data,
  deleteForeshadow: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/foreshadows/${id}`);
  },

  getActs: async (projectId: string): Promise<Act | null> =>
    (await apiClient.get<Act | null>(`/api/projects/${projectId}/story-acts`)).data,
  saveActs: async (data: Act): Promise<Act> =>
    (await apiClient.put<Act>(`/api/projects/${data.projectId}/story-acts`, data)).data,

  getAiActSuggestion: async (projectId: string): Promise<Act> => {
    const project = await projectsApi.get(projectId);
    const suggestion = await aiApi.suggestStoryStructure({
      projectId,
      logline: project?.logline,
      conflict: project?.conflict,
    });
    return { projectId, ...suggestion };
  },
};
