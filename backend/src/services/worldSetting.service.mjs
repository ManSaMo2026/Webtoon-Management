import { prisma } from "../lib/prisma.mjs";
import { AppError, notFound } from "../lib/errors.mjs";
import { MAX_WORLD_PLACE_IMAGES } from "../config/limits.mjs";
import { deleteImage } from "../lib/supabaseStorage.mjs";

export async function getWorldSetting(projectId) {
  const [setting, placeReferences] = await Promise.all([
    prisma.worldSetting.findUnique({ where: { projectId } }),
    prisma.worldPlaceReference.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!setting) return null;
  return { ...setting, placeReferences };
}

export async function upsertWorldSetting(projectId, data) {
  const setting = await prisma.worldSetting.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  });
  const placeReferences = await prisma.worldPlaceReference.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } });
  return { ...setting, placeReferences };
}

export async function addWorldPlaceImage(projectId, { imageUrl, storageKey, memo = "" }) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.worldPlaceReference.count({ where: { projectId } });
    if (count >= MAX_WORLD_PLACE_IMAGES) {
      await deleteImage(storageKey).catch(() => {});
      throw new AppError(`세계관 장소 이미지는 최대 ${MAX_WORLD_PLACE_IMAGES}장까지 등록할 수 있습니다.`, 400);
    }
    return tx.worldPlaceReference.create({
      data: { projectId, imageUrl, storageKey, memo, sortOrder: count },
    });
  });
}

export async function updateWorldPlaceImageMemo(userId, imageId, memo) {
  const image = await prisma.worldPlaceReference.findUnique({
    where: { id: imageId },
    include: { project: { select: { userId: true } } },
  });
  if (!image || image.project.userId !== userId) throw notFound("이미지를 찾을 수 없습니다.");
  return prisma.worldPlaceReference.update({ where: { id: imageId }, data: { memo } });
}

export async function deleteWorldPlaceImage(userId, imageId) {
  const image = await prisma.worldPlaceReference.findUnique({
    where: { id: imageId },
    include: { project: { select: { userId: true } } },
  });
  if (!image || image.project.userId !== userId) throw notFound("이미지를 찾을 수 없습니다.");
  await prisma.worldPlaceReference.delete({ where: { id: imageId } });
  await deleteImage(image.storageKey).catch(() => {});
}
