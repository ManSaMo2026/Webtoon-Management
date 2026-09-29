import { prisma } from "../lib/prisma.mjs";
import { notFound } from "../lib/errors.mjs";

const HISTORY_LIMIT = 4;
const MAX_FIELD_LENGTH = 600;

function compact(value, limit = MAX_FIELD_LENGTH) {
  const text = String(value ?? "").trim();
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

async function loadOwnedProject(userId, projectId) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: {
      id: true,
      title: true,
      platform: true,
      tags: true,
      genre: true,
      customGenre: true,
      totalEpisodes: true,
      currentEpisode: true,
      cadence: true,
      logline: true,
      conflict: true,
      status: true,
      customStatus: true,
      storyAct: { select: { act1: true, act2: true, act3: true } },
      worldSetting: {
        select: {
          era: true,
          mainPlaces: true,
          worldRules: true,
          organizations: true,
          culture: true,
          technologyOrMagic: true,
          moodTone: true,
          forbiddenSettings: true,
          researchNotes: true,
          referenceSources: true,
        },
      },
      characters: {
        orderBy: { createdAt: "asc" },
        take: 30,
        select: {
          name: true,
          role: true,
          roleGroup: true,
          personality: true,
          goal: true,
          speechStyle: true,
          taboo: true,
          secret: true,
          keywords: true,
          relationships: true,
        },
      },
      foreshadows: {
        orderBy: { createdAt: "asc" },
        take: 50,
        select: {
          content: true,
          keyword: true,
          importance: true,
          appearEp: true,
          resolveEp: true,
          status: true,
        },
      },
      episodes: {
        orderBy: { number: "desc" },
        take: 20,
        select: { number: true, summary: true, purpose: true, hook: true },
      },
    },
  });

  if (!project) throw notFound("프로젝트를 찾을 수 없습니다.");
  return project;
}

function compactProject(project) {
  return {
    작품: {
      제목: project.title,
      플랫폼: project.platform,
      태그: project.tags,
      장르: project.customGenre || project.genre,
      진행회차: `${project.currentEpisode}/${project.totalEpisodes}`,
      연재주기: project.cadence,
      연재상태: project.customStatus || project.status,
      로그라인: compact(project.logline),
      핵심갈등: compact(project.conflict),
    },
    스토리3막: project.storyAct
      ? {
          시작: compact(project.storyAct.act1),
          전개: compact(project.storyAct.act2),
          결말: compact(project.storyAct.act3),
        }
      : null,
    캐릭터: project.characters.map((character) => ({
      이름: character.name,
      역할: character.role,
      분류: character.roleGroup,
      성격: compact(character.personality, 300),
      목표: compact(character.goal, 300),
      말투: compact(character.speechStyle, 200),
      금기: compact(character.taboo, 200),
      비밀: compact(character.secret, 300),
      키워드: character.keywords,
      관계: compact(character.relationships, 300),
    })),
    복선: project.foreshadows.map((item) => ({
      내용: compact(item.content, 300),
      키워드: item.keyword,
      중요도: item.importance,
      등장화: item.appearEp,
      회수화: item.resolveEp,
      상태: item.status,
    })),
    최근회차: project.episodes
      .slice()
      .reverse()
      .map((episode) => ({
        회차: episode.number,
        요약: compact(episode.summary, 300),
        목적: episode.purpose,
        훅: compact(episode.hook, 200),
      })),
    세계관: project.worldSetting
      ? Object.fromEntries(
          Object.entries(project.worldSetting).map(([key, value]) => [key, compact(value, 400)]),
        )
      : null,
  };
}

export async function listChatMessages(userId, projectId, area) {
  await loadOwnedProject(userId, projectId);
  const messages = await prisma.aiChatMessage.findMany({
    where: { projectId, area },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
  });
  return messages.reverse();
}

export async function clearChatMessages(userId, projectId, area) {
  await loadOwnedProject(userId, projectId);
  await prisma.aiChatMessage.deleteMany({ where: { projectId, area } });
}

export async function buildChatRequest(userId, projectId, area) {
  const project = await loadOwnedProject(userId, projectId);
  const recentMessages = await prisma.aiChatMessage.findMany({
    where: { projectId, area },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: HISTORY_LIMIT,
    select: { role: true, content: true },
  });

  return {
    context: JSON.stringify(compactProject(project)).slice(0, 7_000),
    history: recentMessages.reverse().map((item) => ({
      role: item.role,
      content: compact(item.content, 750),
    })),
  };
}

export async function saveChatExchange(projectId, area, userContent, assistantContent) {
  const timestamp = Date.now();
  await prisma.$transaction([
    prisma.aiChatMessage.create({
      data: {
        projectId,
        area,
        role: "user",
        content: userContent,
        createdAt: new Date(timestamp),
      },
    }),
    prisma.aiChatMessage.create({
      data: {
        projectId,
        area,
        role: "assistant",
        content: assistantContent,
        createdAt: new Date(timestamp + 1),
      },
    }),
  ]);
}
