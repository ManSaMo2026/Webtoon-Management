import { timelineItemStore } from "../mocks/store";
import type { TimelineItem } from "../types";

export const timelineApi = {
  list: (projectId: string) => timelineItemStore.getByProject(projectId),
  create: (data: Omit<TimelineItem, "id" | "createdAt">) => timelineItemStore.create(data),
  update: (id: string, data: Partial<Pick<TimelineItem, "title" | "startDate" | "endDate">>) => timelineItemStore.update(id, data),
  delete: (id: string) => timelineItemStore.delete(id),
};
