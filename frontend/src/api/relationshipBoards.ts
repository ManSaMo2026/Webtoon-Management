import { apiClient } from "./client";
import type { RelationshipBoard } from "../types";

export const relationshipBoardsApi = {
  get: async (projectId: string): Promise<RelationshipBoard | null> =>
    (await apiClient.get<RelationshipBoard | null>(`/api/projects/${projectId}/relationship-board`)).data,
  save: async (data: RelationshipBoard): Promise<RelationshipBoard> =>
    (await apiClient.put<RelationshipBoard>(`/api/projects/${data.projectId}/relationship-board`, data)).data,
};
