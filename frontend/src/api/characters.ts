import { characterStore } from "../mocks/store";
import type { Character } from "../types";
import { aiApi } from "./ai.api";

export const charactersApi = {
  list: (projectId: string) => characterStore.getByProject(projectId),
  create: (data: Omit<Character, "id">) => characterStore.create(data),
  update: (id: string, data: Partial<Character>) => characterStore.update(id, data),
  delete: (id: string) => characterStore.delete(id),

  checkConflicts: async (projectId: string): Promise<string[]> => {
    const characters = await characterStore.getByProject(projectId);
    return aiApi.checkCharacterConflict(characters);
  },
};
