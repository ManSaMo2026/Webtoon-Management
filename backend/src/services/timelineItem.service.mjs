import { prisma } from "../lib/prisma.mjs";
import { notFound } from "../lib/errors.mjs";

async function loadOwnedItem(userId, itemId) {
  const item = await prisma.timelineItem.findUnique({
    where: { id: itemId },
    include: { project: { select: { userId: true } } },
  });
  if (!item || item.project.userId !== userId) throw notFound("일정을 찾을 수 없습니다.");
  return item;
}

export async function listTimelineItems(projectId) {
  return prisma.timelineItem.findMany({ where: { projectId }, orderBy: { startDate: "asc" } });
}

export async function createTimelineItem(projectId, data) {
  return prisma.timelineItem.create({
    data: { ...data, projectId, startDate: new Date(data.startDate), endDate: new Date(data.endDate) },
  });
}

export async function updateTimelineItem(userId, itemId, data) {
  await loadOwnedItem(userId, itemId);
  return prisma.timelineItem.update({
    where: { id: itemId },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
}

export async function deleteTimelineItem(userId, itemId) {
  await loadOwnedItem(userId, itemId);
  await prisma.timelineItem.delete({ where: { id: itemId } });
}
