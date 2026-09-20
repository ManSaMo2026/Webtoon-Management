import { relationshipBoardStore } from "../mocks/store";
import type { RelationshipBoard } from "../types";

export const relationshipBoardsApi = {
  get: (projectId: string) => relationshipBoardStore.getByProject(projectId),
  save: (data: RelationshipBoard) => relationshipBoardStore.upsert(data),
};
