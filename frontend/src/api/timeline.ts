import { apiClient } from "./client";
import type { TimelineItem } from "../types";

export const timelineApi = {
  list: async (projectId: string): Promise<TimelineItem[]> =>
    (await apiClient.get<TimelineItem[]>(`/api/projects/${projectId}/timeline-items`)).data,
  create: async (data: Omit<TimelineItem, "id" | "createdAt">): Promise<TimelineItem> =>
    (await apiClient.post<TimelineItem>(`/api/projects/${data.projectId}/timeline-items`, data)).data,
  update: async (
    id: string,
    data: Partial<Pick<TimelineItem, "title" | "startDate" | "endDate">>
  ): Promise<TimelineItem> => (await apiClient.put<TimelineItem>(`/api/timeline-items/${id}`, data)).data,
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/timeline-items/${id}`);
  },
};
