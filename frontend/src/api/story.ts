import { episodeStore, foreshadowStore, actStore, projectStore } from "../mocks/store";
import type { Episode, Foreshadow, Act } from "../types";
import { aiApi } from "./ai.api";

export const storyApi = {
  getEpisodes: (projectId: string) => episodeStore.getByProject(projectId),
  createEpisode: (data: Omit<Episode, "id">) => episodeStore.create(data),
  updateEpisode: (id: string, data: Partial<Episode>) => episodeStore.update(id, data),
  deleteEpisode: (id: string) => episodeStore.delete(id),

  getForeshadows: (projectId: string) => foreshadowStore.getByProject(projectId),
  createForeshadow: (data: Omit<Foreshadow, "id">) => foreshadowStore.create(data),
  updateForeshadow: (id: string, data: Partial<Foreshadow>) => foreshadowStore.update(id, data),
  deleteForeshadow: (id: string) => foreshadowStore.delete(id),

  getActs: (projectId: string): Promise<import("../types").Act | null> => actStore.getByProject(projectId),
  saveActs: (data: Act) => actStore.upsert(data),

  getAiActSuggestion: async (projectId: string): Promise<Act> => {
    const project = await projectStore.getById(projectId);
    const suggestion = await aiApi.suggestStoryStructure({
      projectId,
      logline: project?.logline,
      conflict: project?.conflict,
    });
    return { projectId, ...suggestion };
  },
};
