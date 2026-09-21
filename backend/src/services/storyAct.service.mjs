import { prisma } from "../lib/prisma.mjs";

export async function getStoryAct(projectId) {
  return prisma.storyAct.findUnique({ where: { projectId } });
}

export async function upsertStoryAct(projectId, data) {
  return prisma.storyAct.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  });
}
