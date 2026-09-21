import { prisma } from "../lib/prisma.mjs";
import { AppError, notFound } from "../lib/errors.mjs";
import { MAX_PROJECTS, MAX_EPISODES } from "../config/limits.mjs";
import { deleteImage } from "../lib/supabaseStorage.mjs";

function estimateSchedule({ avgCuts, weeklyHours, colorMode, bgComplexity, hasAssistant, nextDeadline }) {
  const colorFactor = colorMode === "컬러" ? 1.3 : 1;
  const backgroundFactor = bgComplexity === "복잡" ? 1.25 : bgComplexity === "보통" ? 1.1 : 1;
  const assistantFactor = hasAssistant ? 0.8 : 1;
  const requiredHours = avgCuts * 1.5 * colorFactor * backgroundFactor * assistantFactor;
  const daysLeft = Math.max(1, Math.ceil((new Date(nextDeadline).getTime() - Date.now()) / 86400000));
  const availableHours = weeklyHours * (daysLeft / 7);
  const successRate = Math.max(5, Math.min(95, Math.round((availableHours / requiredHours) * 72)));
  const riskLevel = successRate >= 75 ? "낮음" : successRate >= 55 ? "보통" : successRate >= 35 ? "높음" : "위험";
  return { successRate, riskLevel };
}

export async function listProjects(userId) {
  return prisma.project.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
}

export async function getProject(userId, projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== userId) throw notFound("프로젝트를 찾을 수 없습니다.");
  return project;
}

export async function createProject(userId, data) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.project.count({ where: { userId } });
    if (count >= MAX_PROJECTS) throw new AppError(`프로젝트는 최대 ${MAX_PROJECTS}개까지 만들 수 있습니다.`, 400);

    const scheduleEstimate = estimateSchedule(data);
    return tx.project.create({
      data: {
        ...data,
        userId,
        currentEpisode: 0,
        nextDeadline: new Date(data.nextDeadline),
        completionDate: data.completionDate ? new Date(data.completionDate) : null,
        ...scheduleEstimate,
      },
    });
  });
}

export async function updateProject(userId, projectId, data) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== userId) throw notFound("프로젝트를 찾을 수 없습니다.");

    const nextTotal = data.totalEpisodes ?? project.totalEpisodes;
    const nextCurrent = data.currentEpisode ?? project.currentEpisode;
    if (nextCurrent < 0 || nextCurrent > nextTotal) {
      throw new AppError(`현재 회차는 0화부터 완결 목표인 ${nextTotal}화까지 입력할 수 있습니다.`, 400);
    }
    if (nextTotal > MAX_EPISODES) {
      throw new AppError(`완결 목표는 1화부터 ${MAX_EPISODES}화까지 입력할 수 있습니다.`, 400);
    }

    const highestEpisode = await tx.episode.aggregate({
      where: { projectId },
      _max: { number: true },
    });
    if ((highestEpisode._max.number ?? 0) > nextTotal) {
      throw new AppError(`이미 ${highestEpisode._max.number}화까지 등록되어 있어 완결 목표를 ${nextTotal}화로 줄일 수 없습니다.`, 400);
    }

    const highestForeshadowEp = await tx.foreshadow.aggregate({
      where: { projectId },
      _max: { appearEp: true, resolveEp: true },
    });
    const maxForeshadowEp = Math.max(highestForeshadowEp._max.appearEp ?? 0, highestForeshadowEp._max.resolveEp ?? 0);
    if (maxForeshadowEp > nextTotal) {
      throw new AppError(`이미 등록된 복선의 등장·회수화가 ${maxForeshadowEp}화까지 있어 완결 목표를 ${nextTotal}화로 줄일 수 없습니다.`, 400);
    }

    return tx.project.update({
      where: { id: projectId },
      data: {
        ...data,
        currentEpisode: nextCurrent,
        nextDeadline: data.nextDeadline ? new Date(data.nextDeadline) : undefined,
        completionDate: data.completionDate ? new Date(data.completionDate) : undefined,
      },
    });
  });
}

export async function deleteProject(userId, projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== userId) throw notFound("프로젝트를 찾을 수 없습니다.");

  const [characters, worldPlaceRefs] = await Promise.all([
    prisma.character.findMany({ where: { projectId }, select: { storageKey: true } }),
    prisma.worldPlaceReference.findMany({ where: { projectId }, select: { storageKey: true } }),
  ]);

  // DB rows cascade on delete; Storage objects don't, so remove them explicitly.
  await prisma.project.delete({ where: { id: projectId } });

  const storageKeys = [
    project.coverStorageKey,
    ...characters.map((c) => c.storageKey),
    ...worldPlaceRefs.map((r) => r.storageKey),
  ].filter(Boolean);
  await Promise.all(storageKeys.map((key) => deleteImage(key).catch(() => {})));
}

export async function setCoverImage(userId, projectId, { imageUrl, storageKey }) {
  const project = await getProject(userId, projectId);
  if (project.coverStorageKey) await deleteImage(project.coverStorageKey).catch(() => {});
  return prisma.project.update({
    where: { id: projectId },
    data: { coverImageUrl: imageUrl, coverStorageKey: storageKey },
  });
}

export async function removeCoverImage(userId, projectId) {
  const project = await getProject(userId, projectId);
  if (project.coverStorageKey) await deleteImage(project.coverStorageKey).catch(() => {});
  return prisma.project.update({
    where: { id: projectId },
    data: { coverImageUrl: null, coverStorageKey: null },
  });
}
