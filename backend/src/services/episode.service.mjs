import { prisma } from "../lib/prisma.mjs";
import { AppError, notFound } from "../lib/errors.mjs";
import { MAX_EPISODES } from "../config/limits.mjs";

async function projectEpisodeLimit(tx, projectId) {
  const project = await tx.project.findUnique({ where: { id: projectId }, select: { totalEpisodes: true } });
  return Math.min(project?.totalEpisodes ?? MAX_EPISODES, MAX_EPISODES);
}

async function loadOwnedEpisode(userId, episodeId) {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: { project: { select: { userId: true } } },
  });
  if (!episode || episode.project.userId !== userId) throw notFound("회차를 찾을 수 없습니다.");
  return episode;
}

export async function listEpisodes(projectId) {
  return prisma.episode.findMany({ where: { projectId }, orderBy: { number: "asc" } });
}

export async function createEpisode(projectId, data) {
  return prisma.$transaction(async (tx) => {
    const limit = await projectEpisodeLimit(tx, projectId);
    if (data.number > limit) {
      throw new AppError(`회차 번호는 1화부터 이 프로젝트의 완결 목표인 ${limit}화까지 입력할 수 있습니다.`, 400);
    }
    const duplicate = await tx.episode.findUnique({ where: { projectId_number: { projectId, number: data.number } } });
    if (duplicate) throw new AppError(`${data.number}화는 이미 등록되어 있습니다.`, 409);
    return tx.episode.create({ data: { ...data, projectId } });
  });
}

export async function updateEpisode(userId, episodeId, data) {
  const existing = await loadOwnedEpisode(userId, episodeId);
  return prisma.$transaction(async (tx) => {
    const nextNumber = data.number ?? existing.number;
    const limit = await projectEpisodeLimit(tx, existing.projectId);
    if (nextNumber > limit) {
      throw new AppError(`회차 번호는 1화부터 이 프로젝트의 완결 목표인 ${limit}화까지 입력할 수 있습니다.`, 400);
    }
    if (nextNumber !== existing.number) {
      const duplicate = await tx.episode.findUnique({
        where: { projectId_number: { projectId: existing.projectId, number: nextNumber } },
      });
      if (duplicate) throw new AppError(`${nextNumber}화는 이미 등록되어 있습니다.`, 409);
    }
    return tx.episode.update({ where: { id: episodeId }, data });
  });
}

export async function deleteEpisode(userId, episodeId) {
  await loadOwnedEpisode(userId, episodeId);
  await prisma.episode.delete({ where: { id: episodeId } });
}
