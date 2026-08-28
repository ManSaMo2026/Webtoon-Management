import type {
  Project, Episode, Foreshadow, Character, Act, Todo,
} from "../types";

const KEYS = {
  projects: "wt_projects",
  episodes: "wt_episodes",
  foreshadows: "wt_foreshadows",
  characters: "wt_characters",
  acts: "wt_acts",
  todos: "wt_todos",
};

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

const SEED_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "검은 태양의 후계자",
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
];

const SEED_EPISODES: Episode[] = [
  { id: "e1", projectId: "p1", number: 1, summary: "주인공의 탄생과 비밀", purpose: "설정", hook: "황제의 문서가 발견된다" },
  { id: "e2", projectId: "p1", number: 2, summary: "금지된 마법의 각성", purpose: "전개", hook: "스승이 죽는다" },
  { id: "e3", projectId: "p1", number: 3, summary: "첫 번째 적과의 조우", purpose: "전개", hook: "적이 사실은 동생임이 암시된다" },
];

const SEED_FORESHADOWS: Foreshadow[] = [
  { id: "f1", projectId: "p1", content: "황제의 반지에 새겨진 룬 문자", appearEp: 1, resolveEp: null, status: "미회수" },
  { id: "f2", projectId: "p1", content: "스승의 마지막 말 '네 어머니를 찾아라'", appearEp: 2, resolveEp: 15, status: "회수완료" },
  { id: "f3", projectId: "p1", content: "붉은 달이 뜨는 날의 예언", appearEp: 1, resolveEp: null, status: "미회수" },
];

const SEED_CHARACTERS: Character[] = [
  {
    id: "c1", projectId: "p1", name: "카이 레온", role: "주인공",
    personality: "냉정하고 계산적이지만 내면엔 정의감",
    goal: "황제를 타도하고 왕국을 구한다",
    speechStyle: "짧고 단호하게 말함",
    taboo: "자신의 출생에 대해 말하지 않음",
    secret: "사실 황제의 아들",
    keywords: ["냉혹", "정의", "고독"],
  },
  {
    id: "c2", projectId: "p1", name: "루나 실버", role: "히로인",
    personality: "밝고 긍정적, 하지만 슬픔을 숨김",
    goal: "실종된 오빠를 찾는다",
    speechStyle: "친근하고 따뜻하게 말함",
    taboo: "오빠 이야기에 예민하게 반응",
    secret: "마법 능력이 있음을 숨기고 있음",
    keywords: ["따뜻함", "희망", "비밀"],
  },
];

const SEED_ACTS: Act[] = [
  {
    projectId: "p1",
    act1: "1-15화: 카이가 자신의 출생을 알게 되고, 금지된 마법을 각성한다. 왕국의 부패를 목격하며 저항군에 합류를 결심한다.",
    act2: "16-40화: 저항군과 함께 황제의 비밀 기지를 파괴하며 세력을 키운다. 루나와의 관계가 깊어지지만 진실이 밝혀지면서 갈등이 시작된다.",
    act3: "41-60화: 황제가 최종 계획을 발동한다. 카이는 자신의 혈통을 받아들이고 진정한 왕으로서 최후의 결전을 치른다.",
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
    localStorage.setItem("wt_seeded", "1");
  }
}

initSeed();

const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

// Projects
export const projectStore = {
  getAll: async (): Promise<Project[]> => { await delay(); return load<Project>(KEYS.projects); },
  getById: async (id: string): Promise<Project | undefined> => { await delay(200); return load<Project>(KEYS.projects).find(p => p.id === id); },
  create: async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "currentEpisode" | "successRate" | "riskLevel">): Promise<Project> => {
    await delay(600);
    const projects = load<Project>(KEYS.projects);
    const newProject: Project = {
      ...data,
      id: `p${Date.now()}`,
      currentEpisode: 0,
      successRate: Math.floor(50 + Math.random() * 40),
      riskLevel: "보통",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    save(KEYS.projects, [...projects, newProject]);
    return newProject;
  },
  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    await delay(400);
    const projects = load<Project>(KEYS.projects);
    const updated = projects.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p);
    save(KEYS.projects, updated);
    return updated.find(p => p.id === id)!;
  },
  delete: async (id: string): Promise<void> => {
    await delay(300);
    save(KEYS.projects, load<Project>(KEYS.projects).filter(p => p.id !== id));
  },
};

// Episodes
export const episodeStore = {
  getByProject: async (projectId: string): Promise<Episode[]> => { await delay(); return load<Episode>(KEYS.episodes).filter(e => e.projectId === projectId); },
  create: async (data: Omit<Episode, "id">): Promise<Episode> => {
    await delay(400);
    const ep: Episode = { ...data, id: `e${Date.now()}` };
    save(KEYS.episodes, [...load<Episode>(KEYS.episodes), ep]);
    return ep;
  },
  update: async (id: string, data: Partial<Episode>): Promise<Episode> => {
    await delay(300);
    const eps = load<Episode>(KEYS.episodes).map(e => e.id === id ? { ...e, ...data } : e);
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
    const f: Foreshadow = { ...data, id: `f${Date.now()}` };
    save(KEYS.foreshadows, [...load<Foreshadow>(KEYS.foreshadows), f]);
    return f;
  },
  update: async (id: string, data: Partial<Foreshadow>): Promise<Foreshadow> => {
    await delay(300);
    const fs = load<Foreshadow>(KEYS.foreshadows).map(f => f.id === id ? { ...f, ...data } : f);
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
    const c: Character = { ...data, id: `c${Date.now()}` };
    save(KEYS.characters, [...load<Character>(KEYS.characters), c]);
    return c;
  },
  update: async (id: string, data: Partial<Character>): Promise<Character> => {
    await delay(300);
    const cs = load<Character>(KEYS.characters).map(c => c.id === id ? { ...c, ...data } : c);
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
