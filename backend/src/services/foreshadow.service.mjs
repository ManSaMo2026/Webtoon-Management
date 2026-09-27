import { prisma } from "../lib/prisma.mjs";
import { AppError, notFound } from "../lib/errors.mjs";
import { MAX_EPISODES } from "../config/limits.mjs";

async function projectEpisodeLimit(tx, projectId) {
  const project = await tx.project.findUnique({ where: { id: projectId }, select: { totalEpisodes: true } });
  return Math.min(project?.totalEpisodes ?? MAX_EPISODES, MAX_EPISODES);
}

function validateEpisodeRange(appearEp, resolveEp, limit) {
  if (appearEp < 1 || appearEp > limit) {
    throw new AppError(`등장화는 1화부터 이 프로젝트의 완결 목표인 ${limit}화까지 입력할 수 있습니다.`, 400);
  }
  if (resolveEp !== null && resolveEp !== undefined && (resolveEp < appearEp || resolveEp > limit)) {
    throw new AppError(`회수화는 등장화 이후부터 완결 목표인 ${limit}화까지 입력할 수 있습니다.`, 400);
  }
}

async function assertCharactersInProject(tx, projectId, characterIds) {
  if (!characterIds?.length) return;
  const count = await tx.character.count({ where: { projectId, id: { in: characterIds } } });
  if (count !== new Set(characterIds).size) {
    throw new AppError("연결된 캐릭터 중 이 프로젝트에 속하지 않는 캐릭터가 있습니다.", 400);
  }
}

function serialize(foreshadow) {
  return {
    ...foreshadow,
    relatedCharacterIds: foreshadow.characters?.map((c) => c.characterId) ?? [],
    characters: undefined,
  };
}

async function loadOwnedForeshadow(userId, foreshadowId) {
  const foreshadow = await prisma.foreshadow.findUnique({
    where: { id: foreshadowId },
    include: { project: { select: { userId: true } }, characters: true },
  });
  if (!foreshadow || foreshadow.project.userId !== userId) throw notFound("복선을 찾을 수 없습니다.");
  return foreshadow;
}

export async function listForeshadows(projectId) {
  const foreshadows = await prisma.foreshadow.findMany({
    where: { projectId },
    include: { characters: true },
    orderBy: { appearEp: "asc" },
  });
  return foreshadows.map(serialize);
}

export async function createForeshadow(projectId, { relatedCharacterIds = [], ...data }) {
  const created = await prisma.$transaction(async (tx) => {
    const limit = await projectEpisodeLimit(tx, projectId);
    validateEpisodeRange(data.appearEp, data.resolveEp, limit);
    await assertCharactersInProject(tx, projectId, relatedCharacterIds);
    return tx.foreshadow.create({
      data: {
        ...data,
        projectId,
        characters: { create: relatedCharacterIds.map((characterId) => ({ characterId })) },
      },
      include: { characters: true },
    });
  });
  return serialize(created);
}

export async function updateForeshadow(userId, foreshadowId, { relatedCharacterIds, ...data }) {
  const existing = await loadOwnedForeshadow(userId, foreshadowId);
  const updated = await prisma.$transaction(async (tx) => {
    const nextAppearEp = data.appearEp ?? existing.appearEp;
    const nextResolveEp = data.resolveEp !== undefined ? data.resolveEp : existing.resolveEp;
    const limit = await projectEpisodeLimit(tx, existing.projectId);
    validateEpisodeRange(nextAppearEp, nextResolveEp, limit);

    if (relatedCharacterIds !== undefined) {
      await assertCharactersInProject(tx, existing.projectId, relatedCharacterIds);
      await tx.foreshadowCharacter.deleteMany({ where: { foreshadowId } });
    }

    return tx.foreshadow.update({
      where: { id: foreshadowId },
      data: {
        ...data,
        ...(relatedCharacterIds !== undefined
          ? { characters: { create: relatedCharacterIds.map((characterId) => ({ characterId })) } }
          : {}),
      },
      include: { characters: true },
    });
  });
  return serialize(updated);
}

export async function deleteForeshadow(userId, foreshadowId) {
  await loadOwnedForeshadow(userId, foreshadowId);
  await prisma.foreshadow.delete({ where: { id: foreshadowId } });
}
