import { prisma } from "../lib/prisma.mjs";
import { AppError, notFound } from "../lib/errors.mjs";

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
  const item = await loadOwnedItem(userId, itemId);
  const nextStartDate = data.startDate ? new Date(data.startDate) : item.startDate;
  const nextEndDate = data.endDate ? new Date(data.endDate) : item.endDate;
  if (nextStartDate > nextEndDate) {
    throw new AppError("종료일은 시작일 이후여야 합니다.", 400);
  }
  return prisma.timelineItem.update({
    where: { id: itemId },
    data: {
      ...data,
      startDate: nextStartDate,
      endDate: nextEndDate,
    },
  });
}

export async function deleteTimelineItem(userId, itemId) {
  await loadOwnedItem(userId, itemId);
  await prisma.timelineItem.delete({ where: { id: itemId } });
}
