import type {
  Project, Episode, Foreshadow, Character, Act, Todo, TimelineItem, WorldSetting, RelationshipBoard,
} from "../types";
import { MAX_CHARACTERS_PER_PROJECT, MAX_EPISODES, MAX_PROJECTS } from "../config/limits";

const KEYS = {
  projects: "wt_projects",
  episodes: "wt_episodes",
  foreshadows: "wt_foreshadows",
  characters: "wt_characters",
  acts: "wt_acts",
  todos: "wt_todos",
  timelineItems: "wt_timeline_items",
  relationshipBoards: "wt_relationship_boards",
  worldSettings: "wt_world_settings",
};

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    if (error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
      throw new Error("브라우저 저장 공간이 부족합니다. 큰 이미지를 줄이거나 불필요한 항목을 삭제해주세요.");
    }
    throw error;
  }
}

function projectEpisodeLimit(projectId: string): number {
  const project = load<Project>(KEYS.projects).find((item) => item.id === projectId);
  return Math.min(project?.totalEpisodes ?? MAX_EPISODES, MAX_EPISODES);
}

function validateForeshadowEpisodes(data: Pick<Foreshadow, "projectId" | "appearEp" | "resolveEp">): void {
  const limit = projectEpisodeLimit(data.projectId);
  if (!Number.isInteger(data.appearEp) || data.appearEp < 1 || data.appearEp > limit) {
    throw new Error(`등장화는 1화부터 이 프로젝트의 완결 목표인 ${limit}화까지 입력할 수 있습니다.`);
  }
  if (data.resolveEp !== null && (!Number.isInteger(data.resolveEp) || data.resolveEp < data.appearEp || data.resolveEp > limit)) {
    throw new Error(`회수화는 등장화 이후부터 완결 목표인 ${limit}화까지 입력할 수 있습니다.`);
  }
}

const SEED_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "검은 태양의 후계자",
    platform: "네이버웹툰",
    tags: ["다크판타지", "성장물", "복수극"],
    genre: "판타지",
    totalEpisodes: 60,
    cadence: "주 1회",
    weeklyHours: 40,
    avgCuts: 50,
    colorMode: "컬러",
    bgComplexity: "보통",
    hasAssistant: true,
    logline: "황제의 사생아가 금지된 마법으로 제국을 구해야 하는 이야기",
    conflict: "혈통과 신념 사이의 갈등",
    currentEpisode: 18,
    nextDeadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    successRate: 72,
    riskLevel: "보통",
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "p2",
    title: "편의점 아르바이트생",
    platform: "카카오페이지",
    tags: ["로맨스", "힐링물", "일상"],
    genre: "로맨스",
    totalEpisodes: 30,
    cadence: "주 2회",
    weeklyHours: 25,
    avgCuts: 35,
    colorMode: "컬러",
    bgComplexity: "단순",
    hasAssistant: false,
    logline: "편의점 야간 알바 중 매일 밤 찾아오는 손님과의 로맨스",
    conflict: "현실과 이상 사이",
    currentEpisode: 8,
    nextDeadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    successRate: 45,
    riskLevel: "높음",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "demo-hungry-dinner",
    title: "공복의 저녁식사",
    platform: "네이버웹툰",
    tags: ["요리", "학원", "성장", "레퍼런스"],
    genre: "일상",
    totalEpisodes: 220,
    cadence: "주 1회",
    weeklyHours: 30,
    avgCuts: 50,
    colorMode: "컬러",
    bgComplexity: "보통",
    hasAssistant: false,
    logline: "맛있는 음식을 좋아하는 복희가 만두와 저녁을 나누며 성장하는 학원 이야기",
    conflict: "먹는 즐거움과 관계 속 갈등을 지나며 성장하는 청소년들",
    currentEpisode: 220,
    nextDeadline: "2019-06-14T00:00:00.000Z",
    successRate: 100,
    riskLevel: "낮음",
    status: "완결",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_EPISODES: Episode[] = [
  { id: "e1", projectId: "p1", number: 1, summary: "주인공의 탄생과 비밀", purpose: "설정", hook: "황제의 문서가 발견된다" },
  { id: "e2", projectId: "p1", number: 2, summary: "금지된 마법의 각성", purpose: "전개", hook: "스승이 죽는다" },
  { id: "e3", projectId: "p1", number: 3, summary: "첫 번째 적과의 조우", purpose: "전개", hook: "적이 사실은 동생임이 암시된다" },
];

const SEED_FORESHADOWS: Foreshadow[] = [
  { id: "f1", projectId: "p1", content: "황제의 반지에 새겨진 룬 문자", keyword: "황제의 반지", importance: "high", relatedCharacterIds: ["c1"], appearEp: 1, resolveEp: null, status: "미회수" },
  { id: "f2", projectId: "p1", content: "스승의 마지막 말 '네 어머니를 찾아라'", keyword: "어머니의 행방", importance: "medium", relatedCharacterIds: ["c1"], appearEp: 2, resolveEp: 15, status: "회수완료" },
  { id: "f3", projectId: "p1", content: "붉은 달이 뜨는 날의 예언", keyword: "붉은 달", importance: "high", relatedCharacterIds: ["c1", "c2"], appearEp: 1, resolveEp: null, status: "미회수" },
];

const SEED_CHARACTERS: Character[] = [
  {
    id: "c1", projectId: "p1", name: "카이 레온", role: "주인공", roleGroup: "주연",
    personality: "냉정하고 계산적이지만 내면엔 정의감",
    goal: "황제를 타도하고 왕국을 구한다",
    speechStyle: "짧고 단호하게 말함",
    taboo: "자신의 출생에 대해 말하지 않음",
    secret: "사실 황제의 아들",
    keywords: ["냉혹", "정의", "고독"],
  },
  {
    id: "c2", projectId: "p1", name: "루나 실버", role: "히로인", roleGroup: "주연",
    personality: "밝고 긍정적, 하지만 슬픔을 숨김",
    goal: "실종된 오빠를 찾는다",
    speechStyle: "친근하고 따뜻하게 말함",
    taboo: "오빠 이야기에 예민하게 반응",
    secret: "마법 능력이 있음을 숨기고 있음",
    keywords: ["따뜻함", "희망", "비밀"],
  },
  {
    id: "demo-bokhui", projectId: "demo-hungry-dinner", name: "공복희", role: "주인공", roleGroup: "주연",
    personality: "맛있는 음식을 좋아하고 사람들과 식사하며 관계를 넓혀가는 고등학생",
    goal: "새로운 학교생활과 관계 속에서 자신만의 방식으로 성장한다",
    speechStyle: "", taboo: "", secret: "", keywords: ["식탐", "성장", "학원생활"],
  },
  {
    id: "demo-mandu", projectId: "demo-hungry-dinner", name: "손민주(만두)", role: "친구·요리 담당", roleGroup: "주연",
    personality: "요리와 만화를 좋아하며 자신의 방식이 뚜렷한 인물",
    goal: "친구들과 맛있는 식사를 나누며 관계를 이어간다",
    speechStyle: "", taboo: "", secret: "", keywords: ["요리", "친구", "마이페이스"],
  },
  {
    id: "demo-jinsu", projectId: "demo-hungry-dinner", name: "김진수", role: "친구", roleGroup: "주연",
    personality: "복희와 만두의 식사와 학교생활에 함께하는 친구",
    goal: "친구들과의 관계 속에서 자신의 마음과 갈등을 마주한다",
    speechStyle: "", taboo: "", secret: "", keywords: ["친구", "학원", "관계"],
  },
];

const SEED_ACTS: Act[] = [
  {
    projectId: "p1",
    act1: "1-15화: 카이가 자신의 출생을 알게 되고, 금지된 마법을 각성한다. 왕국의 부패를 목격하며 저항군에 합류를 결심한다.",
    act2: "16-40화: 저항군과 함께 황제의 비밀 기지를 파괴하며 세력을 키운다. 루나와의 관계가 깊어지지만 진실이 밝혀지면서 갈등이 시작된다.",
    act3: "41-60화: 황제가 최종 계획을 발동한다. 카이는 자신의 혈통을 받아들이고 진정한 왕으로서 최후의 결전을 치른다.",
  },
  {
    projectId: "demo-hungry-dinner",
    act1: "소개용 요약: 복희가 학교생활을 시작하고 만두와 저녁을 함께 먹으며 새로운 관계를 만들어간다.",
    act2: "소개용 요약: 음식과 식사 자리를 중심으로 친구들의 관계와 각자의 고민이 구체화된다.",
    act3: "소개용 요약: 여러 갈등을 지나며 복희와 친구들이 서로를 이해하고 성장해간다.",
  },
];

const SEED_WORLD_SETTINGS: WorldSetting[] = [
  {
    id: "world-demo-hungry-dinner",
    projectId: "demo-hungry-dinner",
    era: "2010년대 대한민국 현대",
    mainPlaces: "고등학교, 친구들이 함께 식사하는 집과 식탁, 동네 생활 공간",
    worldRules: "현실적인 학교생활을 바탕으로 음식과 식사 장면이 인물 관계를 이어주는 중심 장치로 작동한다.",
    organizations: "학교와 학급, 가족과 친구 관계",
    culture: "학업과 친구 관계를 함께 겪는 10대 청소년의 일상",
    technologyOrMagic: "현실 기반 작품으로 별도의 마법이나 초능력 체계가 없다.",
    moodTone: "음식의 즐거움과 청소년 관계의 갈등이 함께 있는 학원 성장물",
    forbiddenSettings: "공식 작품에 확인되지 않은 설정은 사실처럼 추가하지 않는다.",
    researchNotes: "작품의 기본 정보와 공개 소개를 바탕으로 만든 팀 발표용 레퍼런스 프로젝트. 작업 시간, 평균 컷 수 등 제작 데이터는 공개 정보가 아니므로 화면 시연용 가정값을 사용한다.",
    referenceSources: "네이버 시리즈 《공복의 저녁식사》 https://series.naver.com/comic/detail.series?productNo=2201775\nMBN 인터뷰·기사 https://www.mbn.co.kr/pages/news/newsPrintView.php?news_seq_no=2488558",
  },
];

const SEED_TODOS: Todo[] = [
  { id: "t1", projectId: "p1", content: "18화 콘티 완성", done: false },
  { id: "t2", projectId: "p1", content: "17화 배경 채색 검수", done: true },
  { id: "t3", projectId: "p1", content: "복선 회수 계획표 업데이트", done: false },
];

function initSeed() {
  if (!localStorage.getItem("wt_seeded")) {
    save(KEYS.projects, SEED_PROJECTS);
    save(KEYS.episodes, SEED_EPISODES);
    save(KEYS.foreshadows, SEED_FORESHADOWS);
    save(KEYS.characters, SEED_CHARACTERS);
    save(KEYS.acts, SEED_ACTS);
    save(KEYS.todos, SEED_TODOS);
    save(KEYS.timelineItems, []);
    save(KEYS.relationshipBoards, []);
    save(KEYS.worldSettings, SEED_WORLD_SETTINGS);
    localStorage.setItem("wt_seeded", "1");
  }
}

initSeed();

// Backfill only the bundled demo projects that may already exist in localStorage.
const projectsForPlatformMigration = load<Project>(KEYS.projects);
const migratedProjects = projectsForPlatformMigration.map((project) => {
  if (project.id === "p1" && project.title === "검은 태양의 후계자") return { ...project, platform: project.platform || "네이버웹툰", tags: project.tags?.length ? project.tags : ["다크판타지", "성장물", "복수극"] };
  if (project.id === "p2" && project.title === "편의점 아르바이트생") return { ...project, platform: project.platform || "카카오페이지", tags: project.tags?.length ? project.tags : ["로맨스", "힐링물", "일상"] };
  return project;
});
if (JSON.stringify(migratedProjects) !== JSON.stringify(projectsForPlatformMigration)) {
  save(KEYS.projects, migratedProjects);
}

// 기존 브라우저에도 팀 발표용 레퍼런스 프로젝트를 한 번만 추가합니다.
const HUNGRY_DINNER_SEED_KEY = "wt_demo_hungry_dinner_seeded";
if (!localStorage.getItem(HUNGRY_DINNER_SEED_KEY)) {
  const demoProject = SEED_PROJECTS.find((project) => project.id === "demo-hungry-dinner")!;
  const currentProjects = load<Project>(KEYS.projects);
  if (!currentProjects.some((project) => project.id === demoProject.id || project.title === demoProject.title)) save(KEYS.projects, [...currentProjects, demoProject]);

  const demoCharacters = SEED_CHARACTERS.filter((character) => character.projectId === demoProject.id);
  const currentCharacters = load<Character>(KEYS.characters);
  save(KEYS.characters, [...currentCharacters, ...demoCharacters.filter((character) => !currentCharacters.some((item) => item.id === character.id))]);

  const demoAct = SEED_ACTS.find((act) => act.projectId === demoProject.id)!;
  const currentActs = load<Act>(KEYS.acts);
  if (!currentActs.some((act) => act.projectId === demoProject.id)) save(KEYS.acts, [...currentActs, demoAct]);

  const demoWorld = SEED_WORLD_SETTINGS.find((setting) => setting.projectId === demoProject.id)!;
  const currentWorldSettings = load<WorldSetting>(KEYS.worldSettings);
  if (!currentWorldSettings.some((setting) => setting.projectId === demoProject.id)) save(KEYS.worldSettings, [...currentWorldSettings, demoWorld]);

  localStorage.setItem(HUNGRY_DINNER_SEED_KEY, "1");
}

const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

function estimateInitialSchedule(data: Pick<Project, "avgCuts" | "weeklyHours" | "colorMode" | "bgComplexity" | "hasAssistant" | "nextDeadline">) {
  const colorFactor = data.colorMode === "컬러" ? 1.3 : 1;
  const backgroundFactor = data.bgComplexity === "복잡" ? 1.25 : data.bgComplexity === "보통" ? 1.1 : 1;
  const assistantFactor = data.hasAssistant ? 0.8 : 1;
  const requiredHours = data.avgCuts * 1.5 * colorFactor * backgroundFactor * assistantFactor;
  const daysLeft = Math.max(1, Math.ceil((new Date(data.nextDeadline).getTime() - Date.now()) / 86400000));
  const availableHours = data.weeklyHours * (daysLeft / 7);
  const successRate = Math.max(5, Math.min(95, Math.round((availableHours / requiredHours) * 72)));
  const riskLevel: Project["riskLevel"] = successRate >= 75 ? "낮음" : successRate >= 55 ? "보통" : successRate >= 35 ? "높음" : "위험";

  return { successRate, riskLevel };
}

// Projects
export const projectStore = {
  getAll: async (): Promise<Project[]> => { await delay(); return load<Project>(KEYS.projects); },
  getById: async (id: string): Promise<Project | undefined> => { await delay(200); return load<Project>(KEYS.projects).find(p => p.id === id); },
  create: async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "currentEpisode" | "successRate" | "riskLevel">): Promise<Project> => {
    await delay(600);
    const projects = load<Project>(KEYS.projects);
    if (projects.length >= MAX_PROJECTS) {
      throw new Error(`프로젝트는 최대 ${MAX_PROJECTS}개까지 만들 수 있습니다.`);
    }
    if (data.totalEpisodes < 1 || data.totalEpisodes > MAX_EPISODES) {
      throw new Error(`완결 목표는 1화부터 ${MAX_EPISODES}화까지 입력할 수 있습니다.`);
    }
    const scheduleEstimate = estimateInitialSchedule(data);
    const newProject: Project = {
      ...data,
      id: `p${Date.now()}`,
      currentEpisode: 0,
      ...scheduleEstimate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    save(KEYS.projects, [...projects, newProject]);
    return newProject;
  },
  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    await delay(400);
    const projects = load<Project>(KEYS.projects);
    const target = projects.find((project) => project.id === id);
    if (!target) throw new Error("프로젝트를 찾을 수 없습니다.");
    if (data.totalEpisodes !== undefined && (data.totalEpisodes < 1 || data.totalEpisodes > MAX_EPISODES)) {
      throw new Error(`완결 목표는 1화부터 ${MAX_EPISODES}화까지 입력할 수 있습니다.`);
    }
    const nextTotal = data.totalEpisodes ?? target.totalEpisodes;
    const nextCurrent = data.currentEpisode ?? target.currentEpisode;
    if (!Number.isInteger(nextCurrent) || nextCurrent < 0 || nextCurrent > nextTotal) {
      throw new Error(`현재 회차는 0화부터 완결 목표인 ${nextTotal}화까지 입력할 수 있습니다.`);
    }
    const highestEpisode = load<Episode>(KEYS.episodes)
      .filter((episode) => episode.projectId === id)
      .reduce((highest, episode) => Math.max(highest, episode.number), 0);
    if (highestEpisode > nextTotal) {
      throw new Error(`이미 ${highestEpisode}화까지 등록되어 있어 완결 목표를 ${nextTotal}화로 줄일 수 없습니다.`);
    }
    const updated = projects.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p);
    save(KEYS.projects, updated);
    return updated.find(p => p.id === id)!;
  },
  delete: async (id: string): Promise<void> => {
    await delay(300);
    save(KEYS.projects, load<Project>(KEYS.projects).filter(p => p.id !== id));
    save(KEYS.episodes, load<Episode>(KEYS.episodes).filter(item => item.projectId !== id));
    save(KEYS.foreshadows, load<Foreshadow>(KEYS.foreshadows).filter(item => item.projectId !== id));
    save(KEYS.characters, load<Character>(KEYS.characters).filter(item => item.projectId !== id));
    save(KEYS.acts, load<Act>(KEYS.acts).filter(item => item.projectId !== id));
    save(KEYS.todos, load<Todo>(KEYS.todos).filter(item => item.projectId !== id));
    save(KEYS.timelineItems, load<TimelineItem>(KEYS.timelineItems).filter(item => item.projectId !== id));
    save(KEYS.relationshipBoards, load<RelationshipBoard>(KEYS.relationshipBoards).filter(item => item.projectId !== id));
    save(KEYS.worldSettings, load<WorldSetting>(KEYS.worldSettings).filter(item => item.projectId !== id));
  },
};

// Episodes
export const episodeStore = {
  getByProject: async (projectId: string): Promise<Episode[]> => { await delay(); return load<Episode>(KEYS.episodes).filter(e => e.projectId === projectId); },
  create: async (data: Omit<Episode, "id">): Promise<Episode> => {
    await delay(400);
    const limit = projectEpisodeLimit(data.projectId);
    if (!Number.isInteger(data.number) || data.number < 1 || data.number > limit) {
      throw new Error(`회차 번호는 1화부터 이 프로젝트의 완결 목표인 ${limit}화까지 입력할 수 있습니다.`);
    }
    const episodes = load<Episode>(KEYS.episodes);
    if (episodes.some((episode) => episode.projectId === data.projectId && episode.number === data.number)) {
      throw new Error(`${data.number}화는 이미 등록되어 있습니다.`);
    }
    const ep: Episode = { ...data, id: `e${Date.now()}` };
    save(KEYS.episodes, [...episodes, ep]);
    return ep;
  },
  update: async (id: string, data: Partial<Episode>): Promise<Episode> => {
    await delay(300);
    const existing = load<Episode>(KEYS.episodes);
    const target = existing.find((episode) => episode.id === id);
    const nextNumber = data.number ?? target?.number;
    const limit = target ? projectEpisodeLimit(target.projectId) : MAX_EPISODES;
    if (!target || !Number.isInteger(nextNumber) || nextNumber < 1 || nextNumber > limit) {
      throw new Error(`회차 번호는 1화부터 이 프로젝트의 완결 목표인 ${limit}화까지 입력할 수 있습니다.`);
    }
    if (existing.some((episode) => episode.id !== id && episode.projectId === target.projectId && episode.number === nextNumber)) {
      throw new Error(`${nextNumber}화는 이미 등록되어 있습니다.`);
    }
    const eps = existing.map(e => e.id === id ? { ...e, ...data } : e);
    save(KEYS.episodes, eps);
    return eps.find(e => e.id === id)!;
  },
  delete: async (id: string): Promise<void> => {
    await delay(300);
    save(KEYS.episodes, load<Episode>(KEYS.episodes).filter(e => e.id !== id));
  },
};

// Foreshadows
export const foreshadowStore = {
  getByProject: async (projectId: string): Promise<Foreshadow[]> => { await delay(); return load<Foreshadow>(KEYS.foreshadows).filter(f => f.projectId === projectId); },
  create: async (data: Omit<Foreshadow, "id">): Promise<Foreshadow> => {
    await delay(400);
    validateForeshadowEpisodes(data);
    const f: Foreshadow = { ...data, id: `f${Date.now()}` };
    save(KEYS.foreshadows, [...load<Foreshadow>(KEYS.foreshadows), f]);
    return f;
  },
  update: async (id: string, data: Partial<Foreshadow>): Promise<Foreshadow> => {
    await delay(300);
    const existing = load<Foreshadow>(KEYS.foreshadows);
    const target = existing.find((item) => item.id === id);
    if (!target) throw new Error("복선을 찾을 수 없습니다.");
    const next = { ...target, ...data };
    validateForeshadowEpisodes(next);
    const fs = existing.map(f => f.id === id ? next : f);
    save(KEYS.foreshadows, fs);
    return fs.find(f => f.id === id)!;
  },
  delete: async (id: string): Promise<void> => {
    await delay(300);
    save(KEYS.foreshadows, load<Foreshadow>(KEYS.foreshadows).filter(f => f.id !== id));
  },
};

// Characters
export const characterStore = {
  getByProject: async (projectId: string): Promise<Character[]> => { await delay(); return load<Character>(KEYS.characters).filter(c => c.projectId === projectId); },
  create: async (data: Omit<Character, "id">): Promise<Character> => {
    await delay(400);
    const characters = load<Character>(KEYS.characters);
    const projectCharacterCount = characters.filter((character) => character.projectId === data.projectId).length;
    if (projectCharacterCount >= MAX_CHARACTERS_PER_PROJECT) {
      throw new Error(`프로젝트당 캐릭터는 최대 ${MAX_CHARACTERS_PER_PROJECT}명까지 등록할 수 있습니다.`);
    }
    const c: Character = { ...data, id: `c${Date.now()}` };
    save(KEYS.characters, [...characters, c]);
    return c;
  },
  update: async (id: string, data: Partial<Character>): Promise<Character> => {
    await delay(300);
    const existing = load<Character>(KEYS.characters);
    const target = existing.find((character) => character.id === id);
    if (!target) throw new Error("캐릭터를 찾을 수 없습니다.");
    const nextProjectId = data.projectId ?? target.projectId;
    if (nextProjectId !== target.projectId) {
      const nextCount = existing.filter((character) => character.projectId === nextProjectId).length;
      if (nextCount >= MAX_CHARACTERS_PER_PROJECT) {
        throw new Error(`프로젝트당 캐릭터는 최대 ${MAX_CHARACTERS_PER_PROJECT}명까지 등록할 수 있습니다.`);
      }
    }
    const cs = existing.map(c => c.id === id ? { ...c, ...data } : c);
    save(KEYS.characters, cs);
    return cs.find(c => c.id === id)!;
  },
  delete: async (id: string): Promise<void> => {
    await delay(300);
    save(KEYS.characters, load<Character>(KEYS.characters).filter(c => c.id !== id));
  },
};

// Acts
export const actStore = {
  getByProject: async (projectId: string): Promise<Act | null> => {
    await delay(200);
    return load<Act>(KEYS.acts).find(a => a.projectId === projectId) ?? null;
  },
  upsert: async (data: Act): Promise<Act> => {
    await delay(400);
    const acts = load<Act>(KEYS.acts);
    const existing = acts.findIndex(a => a.projectId === data.projectId);
    if (existing >= 0) acts[existing] = data;
    else acts.push(data);
    save(KEYS.acts, acts);
    return data;
  },
};

// World setting uses one document per project so it can later map to a REST upsert endpoint.
export const worldSettingStore = {
  getByProject: async (projectId: string): Promise<WorldSetting | null> => {
    await delay(200);
    return load<WorldSetting>(KEYS.worldSettings).find((item) => item.projectId === projectId) ?? null;
  },
  upsert: async (data: WorldSetting): Promise<WorldSetting> => {
    await delay(400);
    const settings = load<WorldSetting>(KEYS.worldSettings);
    const existing = settings.findIndex((item) => item.projectId === data.projectId);
    if (existing >= 0) settings[existing] = data;
    else settings.push(data);
    save(KEYS.worldSettings, settings);
    return data;
  },
};

// Todos
export const todoStore = {
  getByProject: async (projectId: string): Promise<Todo[]> => { await delay(200); return load<Todo>(KEYS.todos).filter(t => t.projectId === projectId); },
  toggle: async (id: string): Promise<void> => {
    await delay(200);
    const todos = load<Todo>(KEYS.todos).map(t => t.id === id ? { ...t, done: !t.done } : t);
    save(KEYS.todos, todos);
  },
  create: async (data: Omit<Todo, "id">): Promise<Todo> => {
    await delay(300);
    const t: Todo = { ...data, id: `t${Date.now()}` };
    save(KEYS.todos, [...load<Todo>(KEYS.todos), t]);
    return t;
  },
  delete: async (id: string): Promise<void> => {
    await delay(200);
    save(KEYS.todos, load<Todo>(KEYS.todos).filter(t => t.id !== id));
  },
};

// Timeline items
export const timelineItemStore = {
  getByProject: async (projectId: string): Promise<TimelineItem[]> => {
    await delay(200);
    return load<TimelineItem>(KEYS.timelineItems).filter((item) => item.projectId === projectId);
  },
  create: async (data: Omit<TimelineItem, "id" | "createdAt">): Promise<TimelineItem> => {
    await delay(300);
    const item: TimelineItem = { ...data, id: `timeline-${Date.now()}`, createdAt: new Date().toISOString() };
    save(KEYS.timelineItems, [...load<TimelineItem>(KEYS.timelineItems), item]);
    return item;
  },
  update: async (id: string, data: Partial<Pick<TimelineItem, "title" | "startDate" | "endDate">>): Promise<TimelineItem> => {
    await delay(300);
    const items = load<TimelineItem>(KEYS.timelineItems);
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("일정을 찾을 수 없습니다.");
    items[index] = { ...items[index], ...data };
    save(KEYS.timelineItems, items);
    return items[index];
  },
  delete: async (id: string): Promise<void> => {
    await delay(200);
    save(KEYS.timelineItems, load<TimelineItem>(KEYS.timelineItems).filter((item) => item.id !== id));
  },
};

// Character relationship boards use one document per project.
export const relationshipBoardStore = {
  getByProject: async (projectId: string): Promise<RelationshipBoard | null> => {
    await delay(150);
    return load<RelationshipBoard>(KEYS.relationshipBoards).find((board) => board.projectId === projectId) ?? null;
  },
  upsert: async (data: RelationshipBoard): Promise<RelationshipBoard> => {
    await delay(120);
    const boards = load<RelationshipBoard>(KEYS.relationshipBoards);
    const index = boards.findIndex((board) => board.projectId === data.projectId);
    if (index >= 0) boards[index] = data;
    else boards.push(data);
    save(KEYS.relationshipBoards, boards);
    return data;
  },
};
