import { apiClient } from "./client";
import { dataUrlToBlob, isDataUrl, uploadImageBlob } from "./imageUpload";
import type { Project } from "../types";

type CreateProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt" | "currentEpisode" | "successRate" | "riskLevel">;

async function uploadCoverIfNeeded(id: string, coverImageUrl: string | undefined, fallback: Project): Promise<Project> {
  if (!isDataUrl(coverImageUrl)) return fallback;
  const blob = await dataUrlToBlob(coverImageUrl);
  return uploadImageBlob<Project>(`/api/projects/${id}/cover-image`, blob);
}

export const projectsApi = {
  list: async (): Promise<Project[]> => (await apiClient.get<Project[]>("/api/projects")).data,

  get: async (id: string): Promise<Project | undefined> => {
    try {
      return (await apiClient.get<Project>(`/api/projects/${id}`)).data;
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return undefined;
      throw error;
    }
  },

  create: async (data: CreateProjectInput): Promise<Project> => {
    const created = (await apiClient.post<Project>("/api/projects", data)).data;
    return uploadCoverIfNeeded(created.id, data.coverImageUrl, created);
  },

  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const updated = (await apiClient.put<Project>(`/api/projects/${id}`, data)).data;
    return uploadCoverIfNeeded(id, data.coverImageUrl, updated);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/projects/${id}`);
  },
};
