import { apiClient } from "./client";
import { dataUrlToBlob, isDataUrl, uploadImageBlob } from "./imageUpload";
import type { Character } from "../types";
import { aiApi } from "./ai.api";

async function applyImageChange(id: string, imageUrl: string | undefined, fallback: Character): Promise<Character> {
  if (isDataUrl(imageUrl)) {
    const blob = await dataUrlToBlob(imageUrl);
    return uploadImageBlob<Character>(`/api/characters/${id}/image`, blob);
  }
  if (imageUrl === "") {
    return (await apiClient.delete<Character>(`/api/characters/${id}/image`)).data;
  }
  return fallback;
}

export const charactersApi = {
  list: async (projectId: string): Promise<Character[]> =>
    (await apiClient.get<Character[]>(`/api/projects/${projectId}/characters`)).data,

  create: async (data: Omit<Character, "id">): Promise<Character> => {
    const created = (await apiClient.post<Character>(`/api/projects/${data.projectId}/characters`, data)).data;
    return applyImageChange(created.id, data.imageUrl, created);
  },

  update: async (id: string, data: Partial<Character>): Promise<Character> => {
    const updated = (await apiClient.put<Character>(`/api/characters/${id}`, data)).data;
    return applyImageChange(id, data.imageUrl, updated);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/characters/${id}`);
  },

  checkConflicts: async (projectId: string): Promise<string[]> => {
    const characters = (await apiClient.get<Character[]>(`/api/projects/${projectId}/characters`)).data;
    return aiApi.checkCharacterConflict(characters);
  },
};
