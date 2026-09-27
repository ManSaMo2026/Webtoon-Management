import { prisma } from "../lib/prisma.mjs";
import { AppError, notFound } from "../lib/errors.mjs";
import { MAX_CHARACTERS_PER_PROJECT } from "../config/limits.mjs";
import { deleteImage, uploadImage } from "../lib/supabaseStorage.mjs";

async function loadOwnedCharacter(userId, characterId) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { project: { select: { userId: true } } },
  });
  if (!character || character.project.userId !== userId) throw notFound("캐릭터를 찾을 수 없습니다.");
  return character;
}

export async function listCharacters(projectId) {
  return prisma.character.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
}

export async function createCharacter(projectId, data) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.character.count({ where: { projectId } });
    if (count >= MAX_CHARACTERS_PER_PROJECT) {
      throw new AppError(`프로젝트당 캐릭터는 최대 ${MAX_CHARACTERS_PER_PROJECT}명까지 등록할 수 있습니다.`, 400);
    }
    return tx.character.create({ data: { ...data, projectId } });
  });
}

export async function updateCharacter(userId, characterId, data) {
  await loadOwnedCharacter(userId, characterId);
  return prisma.character.update({ where: { id: characterId }, data });
}

export async function deleteCharacter(userId, characterId) {
  const character = await loadOwnedCharacter(userId, characterId);
  await prisma.character.delete({ where: { id: characterId } });
  if (character.storageKey) await deleteImage(character.storageKey).catch(() => {});
}

export async function setCharacterImage(userId, characterId, file) {
  const character = await loadOwnedCharacter(userId, characterId);
  const uploaded = await uploadImage({ userId, projectId: character.projectId, purpose: "character", file });
  if (character.storageKey) await deleteImage(character.storageKey).catch(() => {});
  return prisma.character.update({
    where: { id: characterId },
    data: { imageUrl: uploaded.imageUrl, storageKey: uploaded.storageKey },
  });
}

export async function removeCharacterImage(userId, characterId) {
  const character = await loadOwnedCharacter(userId, characterId);
  if (character.storageKey) await deleteImage(character.storageKey).catch(() => {});
  return prisma.character.update({ where: { id: characterId }, data: { imageUrl: null, storageKey: null } });
}
