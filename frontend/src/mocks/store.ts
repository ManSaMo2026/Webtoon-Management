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
    id: "showcase-starlight-post",
    title: "별을 줍는 우체국",
    platform: "네이버웹툰",
    tags: ["힐링판타지", "미스터리", "성장물"],
    genre: "판타지",
    totalEpisodes: 72,
    cadence: "주 1회",
    weeklyHours: 36,
    avgCuts: 48,
    colorMode: "컬러",
    bgComplexity: "보통",
    hasAssistant: true,
    logline: "배달되지 못한 마음이 별이 되는 도시에서, 견습 집배원 여름이 마지막 편지들의 주인을 찾아가는 이야기",
    conflict: "타인의 미련을 해결할수록 자신의 잃어버린 기억이 사라지는 여름의 선택",
    currentEpisode: 21,
    nextDeadline: new Date(Date.now() + 6 * 86400000).toISOString(),
    completionDate: new Date(Date.now() + 357 * 86400000).toISOString(),
    successRate: 81,
    riskLevel: "낮음",
    status: "연재중",
    createdAt: new Date(Date.now() - 150 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "showcase-afterwork-ghost",
    title: "퇴근 후 괴담수집부",
    platform: "카카오페이지",
    tags: ["오피스", "도시괴담", "팀플레이"],
    genre: "스릴러",
    totalEpisodes: 48,
    cadence: "주 2회",
    weeklyHours: 28,
    avgCuts: 62,
    colorMode: "한정컬러",
    bgComplexity: "복잡",
    hasAssistant: false,
    logline: "야근을 피하려던 신입 사원이 사내 비밀 동아리에 들어가 매주 금요일 현실이 되는 도시괴담을 기록한다",
    conflict: "괴담을 끝내려면 회사가 감춘 실종 사건을 밝혀야 하지만 진실에 가까워질수록 동료가 한 명씩 기억에서 사라진다",
    currentEpisode: 13,
    nextDeadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    completionDate: new Date(Date.now() + 168 * 86400000).toISOString(),
    successRate: 47,
    riskLevel: "높음",
    status: "연재중",
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_EPISODES: Episode[] = [
  { id: "showcase-star-e20", projectId: "showcase-starlight-post", number: 20, summary: "수신인이 없는 푸른 편지가 여름의 어린 시절 집으로 향한다.", purpose: "반전", hook: "편지 끝에 여름의 필체로 쓴 추신이 발견된다" },
  { id: "showcase-star-e21", projectId: "showcase-starlight-post", number: 21, summary: "여름과 도윤이 폐쇄된 별빛 우편실에서 발송 기록을 추적한다.", purpose: "전개", hook: "기록 속 배달 완료 시각이 내일로 적혀 있다" },
  { id: "showcase-ghost-e12", projectId: "showcase-afterwork-ghost", number: 12, summary: "팀원들은 아무도 기억하지 못하는 14층 회의실에 잠입한다.", purpose: "전개", hook: "회의록 참석자 명단에서 현재 팀장의 이름이 지워진다" },
  { id: "showcase-ghost-e13", projectId: "showcase-afterwork-ghost", number: 13, summary: "서진은 사내 메신저에만 존재하는 퇴사자와 대화를 시작한다.", purpose: "클라이맥스", hook: "퇴사자가 오늘 자정 서진의 계정으로 로그인하겠다고 예고한다" },
];

const SEED_FORESHADOWS: Foreshadow[] = [
  { id: "showcase-star-f1", projectId: "showcase-starlight-post", content: "여름이 만지는 편지만 별빛이 잠시 검게 변한다", keyword: "검은 별빛", importance: "high", relatedCharacterIds: ["showcase-star-yeoreum"], appearEp: 2, resolveEp: 36, status: "진행중" },
  { id: "showcase-star-f2", projectId: "showcase-starlight-post", content: "도윤이 매번 같은 날짜의 우편 소인을 숨긴다", keyword: "멈춘 소인", importance: "medium", relatedCharacterIds: ["showcase-star-doyun"], appearEp: 7, resolveEp: 28, status: "진행중" },
  { id: "showcase-ghost-f1", projectId: "showcase-afterwork-ghost", content: "엘리베이터 층수 표시에서 매주 금요일 14층이 사라진다", keyword: "없는 14층", importance: "high", relatedCharacterIds: ["showcase-ghost-seojin", "showcase-ghost-hyun"], appearEp: 1, resolveEp: 24, status: "진행중" },
  { id: "showcase-ghost-f2", projectId: "showcase-afterwork-ghost", content: "팀장이 오래된 단체 사진마다 다른 위치에 서 있다", keyword: "움직이는 사진", importance: "high", relatedCharacterIds: ["showcase-ghost-hyun"], appearEp: 4, resolveEp: null, status: "미회수" },
];

const SEED_CHARACTERS: Character[] = [
  {
    id: "showcase-star-yeoreum", projectId: "showcase-starlight-post", name: "한여름", role: "견습 별빛 집배원", roleGroup: "주연",
    personality: "다정하고 끈질기지만 자신의 슬픔은 농담으로 넘긴다",
    goal: "배달되지 못한 마지막 편지를 모두 주인에게 전한다",
    speechStyle: "상대의 말을 먼저 되묻고 부드럽게 확신을 건넨다",
    taboo: "어린 시절과 가족에 관한 질문을 피한다",
    secret: "우체국에 보관된 첫 번째 미배달 편지의 발신인이다",
    keywords: ["다정함", "기억", "책임감"],
    age: "22세", occupation: "별빛 우체국 견습 집배원", likes: "새벽 산책, 오래된 우표", dislikes: "작별 인사",
  },
  {
    id: "showcase-star-doyun", projectId: "showcase-starlight-post", name: "서도윤", role: "기록실 담당자", roleGroup: "주연",
    personality: "정확하고 무뚝뚝하지만 타인의 기억을 세심하게 기록한다",
    goal: "우체국이 숨긴 미배달 사고의 진실을 밝힌다",
    speechStyle: "짧은 존댓말과 날짜를 정확히 말하는 습관이 있다",
    taboo: "자신이 배달에 실패한 편지 이야기를 거부한다",
    secret: "여름의 잃어버린 기억 일부를 대신 보관하고 있다",
    keywords: ["기록", "죄책감", "신뢰"],
    age: "27세", occupation: "별빛 우체국 기록실 담당자", likes: "정리된 서가, 비 오는 날", dislikes: "기한이 지워진 우편물",
  },
  {
    id: "showcase-star-madam", projectId: "showcase-starlight-post", name: "마담 소라", role: "우체국장", roleGroup: "조연",
    personality: "태연하고 유머러스하지만 우체국의 규칙에는 단호하다",
    goal: "별이 된 마음이 도시를 집어삼키기 전에 미련을 정리한다",
    speechStyle: "수수께끼 같은 비유 뒤에 현실적인 조언을 덧붙인다",
    taboo: "첫 번째 집배원의 이름을 입에 올리지 않는다",
    secret: "도시가 생긴 날부터 늙지 않고 우체국을 지켰다",
    keywords: ["안내자", "비밀", "오래된 약속"],
  },
  {
    id: "showcase-ghost-seojin", projectId: "showcase-afterwork-ghost", name: "윤서진", role: "신입 사원", roleGroup: "주연",
    personality: "눈치가 빠르고 현실적이지만 부당한 일을 지나치지 못한다",
    goal: "사라진 동료들의 기록을 되찾고 괴담수집부를 해체한다",
    speechStyle: "혼잣말이 많고 위기일수록 업무 용어로 상황을 정리한다",
    taboo: "누군가를 기억하지 못한다는 사실을 인정하기 두려워한다",
    secret: "입사 전 이미 회사 괴담을 한 번 겪었지만 기억이 조작됐다",
    keywords: ["현실주의", "관찰력", "기억"],
    age: "26세", occupation: "대성물산 브랜드팀 신입", likes: "정시 퇴근, 캔커피", dislikes: "읽음 표시 없는 메신저",
  },
  {
    id: "showcase-ghost-hyun", projectId: "showcase-afterwork-ghost", name: "강태현", role: "괴담수집부 팀장", roleGroup: "주연",
    personality: "침착하고 친절하지만 모든 상황을 이미 예상한 듯 행동한다",
    goal: "실종 사건이 반복되는 금요일을 끝낸다",
    speechStyle: "업무 지시처럼 간결하며 위험한 순간에도 존댓말을 쓴다",
    taboo: "자신의 입사 연도와 가족 이야기를 밝히지 않는다",
    secret: "사내 기록상 12년 전에 실종 처리된 직원이다",
    keywords: ["미스터리", "보호자", "실종자"],
    occupation: "괴담수집부 팀장", likes: "종이 문서, 계단", dislikes: "사원증 사진 촬영",
  },
  {
    id: "showcase-ghost-mira", projectId: "showcase-afterwork-ghost", name: "오미라", role: "정보 수집 담당", roleGroup: "조연",
    personality: "대담하고 사교적이며 공포를 농담으로 견딘다",
    goal: "괴담 속에서 사라진 언니의 흔적을 찾는다",
    speechStyle: "인터넷 은어와 사내 소문을 섞어 빠르게 말한다",
    taboo: "언니가 자진 퇴사했다는 회사의 설명을 믿지 않는다",
    secret: "괴담 게시판의 익명 운영자다",
    keywords: ["정보력", "유머", "집념"],
    age: "29세", occupation: "인사팀 대리", likes: "익명 게시판, 매운 과자", dislikes: "삭제된 인사 기록",
  },
];

const SEED_ACTS: Act[] = [
  {
    projectId: "showcase-starlight-post",
    act1: "1~18화: 한여름이 별빛 우체국의 견습 집배원이 되어 미배달 편지를 전한다. 편지가 해결될 때마다 자신의 어린 시절 기억이 흐려진다는 사실을 깨닫는다.",
    act2: "19~52화: 여름과 도윤은 우체국이 특정 편지들을 의도적으로 숨겼다는 증거를 찾는다. 잃어버린 기억과 도시의 탄생이 연결되며 두 사람의 신뢰가 흔들린다.",
    act3: "53~72화: 도시를 지탱해온 첫 번째 편지의 수신인이 밝혀진다. 여름은 모든 기억을 되찾는 것과 도시 사람들의 미련을 보내주는 것 사이에서 마지막 배달을 선택한다.",
  },
  {
    projectId: "showcase-afterwork-ghost",
    act1: "1~12화: 윤서진이 괴담수집부에 들어가 금요일마다 현실이 되는 사내 괴담을 기록한다. 팀원들은 14층 회의실과 실종된 직원 명단의 연관성을 발견한다.",
    act2: "13~34화: 괴담이 회사 밖으로 번지고, 동료들이 사람들의 기억에서 사라지기 시작한다. 서진은 팀장 태현이 오래전 실종자라는 증거와 자신의 조작된 기억을 마주한다.",
    act3: "35~48화: 회사가 괴담을 이용해 사고와 실종을 은폐해왔다는 진실이 드러난다. 수집부는 모든 기록을 공개하는 대신 자신들이 완전히 지워질 위험을 감수한다.",
  },
];

const SEED_WORLD_SETTINGS: WorldSetting[] = [
  {
    id: "world-showcase-starlight-post",
    projectId: "showcase-starlight-post",
    era: "현대와 닮았지만 밤이 길고 별빛이 가까운 가상 도시",
    mainPlaces: "언덕 끝 별빛 우체국, 미배달 편지 기록실, 새벽 시장, 빛이 꺼진 구시가지",
    worldRules: "끝내 전하지 못한 마음은 별이 되어 우체국에 떨어진다. 편지는 수신인에게 직접 전달되어야만 별빛으로 돌아간다.",
    organizations: "별빛 우체국, 시청 야간관리과, 기억을 거래하는 새벽 상인회",
    culture: "중요한 작별은 손편지로 남기며, 별이 많이 떨어지는 밤에는 집 밖에 나가지 않는 풍습이 있다.",
    technologyOrMagic: "집배원은 우표에 남은 감정을 읽을 수 있지만 배달할 때마다 자신의 기억 하나가 흐려진다.",
    moodTone: "따뜻한 일상과 잔잔한 미스터리가 교차하는 밤의 힐링 판타지",
    forbiddenSettings: "편지가 죽은 사람을 직접 되살리지는 않는다. 잃은 기억은 대가 없이 복구할 수 없다.",
    researchNotes: "우편 분류 과정, 오래된 우체국 건축, 야간 도시 조명을 배경 자료로 조사한다.",
    referenceSources: "가상 작품 촬영용 설정 자료",
  },
  {
    id: "world-showcase-afterwork-ghost",
    projectId: "showcase-afterwork-ghost",
    era: "현재의 서울과 유사한 대기업 밀집 업무 지구",
    mainPlaces: "대성물산 본사, 존재하지 않는 14층, 지하 문서고, 막차 이후의 지하철역",
    worldRules: "사내에서 세 번 이상 같은 괴담이 공유되면 다음 금요일 자정에 현실이 된다. 기록에서 지워진 사람은 주변의 기억에서도 사라진다.",
    organizations: "대성물산, 비공식 괴담수집부, 실종 기록을 관리하는 보안감사실",
    culture: "야근과 사내 메신저, 익명 게시판의 소문이 괴담을 빠르게 증폭한다.",
    technologyOrMagic: "삭제된 전자 기록은 자정 이후 잠시 복원되며, 오래된 종이 문서는 기억 삭제의 영향을 받지 않는다.",
    moodTone: "익숙한 사무실의 불편함이 공포로 변하는 오피스 미스터리 스릴러",
    forbiddenSettings: "괴담은 이유 없이 사람을 공격하지 않으며 반드시 회사가 숨긴 사건이나 기록과 연결된다.",
    researchNotes: "대기업 사무실 동선, 전산 기록 보존, 야간 보안 절차를 장면 설계에 활용한다.",
    referenceSources: "가상 작품 촬영용 설정 자료",
  },
];

const SEED_TODOS: Todo[] = [
  { id: "showcase-star-t1", projectId: "showcase-starlight-post", content: "22화 우편실 배경 스케치", done: true },
  { id: "showcase-star-t2", projectId: "showcase-starlight-post", content: "검은 별빛 복선 대사 점검", done: false },
  { id: "showcase-ghost-t1", projectId: "showcase-afterwork-ghost", content: "14화 콘티 62컷 정리", done: false },
  { id: "showcase-ghost-t2", projectId: "showcase-afterwork-ghost", content: "사내 메신저 화면 식자", done: false },
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

// 이전 버전에 포함됐던 샘플 3개와 연결 데이터를 기존 브라우저에서도 한 번만 정리합니다.
const LEGACY_SEED_CLEANUP_KEY = "wt_legacy_seed_projects_removed_v1";
const LEGACY_SEED_PROJECT_IDS = new Set(["p1", "p2", "demo-hungry-dinner"]);
if (!localStorage.getItem(LEGACY_SEED_CLEANUP_KEY)) {
  save(KEYS.projects, load<Project>(KEYS.projects).filter((item) => !LEGACY_SEED_PROJECT_IDS.has(item.id)));
  save(KEYS.episodes, load<Episode>(KEYS.episodes).filter((item) => !LEGACY_SEED_PROJECT_IDS.has(item.projectId)));
  save(KEYS.foreshadows, load<Foreshadow>(KEYS.foreshadows).filter((item) => !LEGACY_SEED_PROJECT_IDS.has(item.projectId)));
  save(KEYS.characters, load<Character>(KEYS.characters).filter((item) => !LEGACY_SEED_PROJECT_IDS.has(item.projectId)));
  save(KEYS.acts, load<Act>(KEYS.acts).filter((item) => !LEGACY_SEED_PROJECT_IDS.has(item.projectId)));
  save(KEYS.todos, load<Todo>(KEYS.todos).filter((item) => !LEGACY_SEED_PROJECT_IDS.has(item.projectId)));
  save(KEYS.timelineItems, load<TimelineItem>(KEYS.timelineItems).filter((item) => !LEGACY_SEED_PROJECT_IDS.has(item.projectId)));
  save(KEYS.relationshipBoards, load<RelationshipBoard>(KEYS.relationshipBoards).filter((item) => !LEGACY_SEED_PROJECT_IDS.has(item.projectId)));
  save(KEYS.worldSettings, load<WorldSetting>(KEYS.worldSettings).filter((item) => !LEGACY_SEED_PROJECT_IDS.has(item.projectId)));
  localStorage.removeItem("wt_demo_hungry_dinner_seeded");
  localStorage.setItem(LEGACY_SEED_CLEANUP_KEY, "1");
}

// 기존 브라우저에도 메인 화면 촬영용 가상 작품 2개를 추가합니다.
const SHOWCASE_SEED_KEY = "wt_showcase_projects_seeded_v1";
const SHOWCASE_PROJECT_IDS = ["showcase-starlight-post", "showcase-afterwork-ghost"];
if (!localStorage.getItem(SHOWCASE_SEED_KEY)) {
  const currentProjects = load<Project>(KEYS.projects);
  const showcaseProjects = SEED_PROJECTS.filter((project) => SHOWCASE_PROJECT_IDS.includes(project.id));
  const availableSlots = Math.max(0, MAX_PROJECTS - currentProjects.length);
  const projectsToAdd = showcaseProjects
    .filter((project) => !currentProjects.some((item) => item.id === project.id))
    .slice(0, availableSlots);
  const nextProjects = [...currentProjects, ...projectsToAdd];
  if (projectsToAdd.length) save(KEYS.projects, nextProjects);

  const activeProjectIds = new Set(
    SHOWCASE_PROJECT_IDS.filter((projectId) => nextProjects.some((project) => project.id === projectId)),
  );

  const mergeSeedById = <T extends { id: string }>(key: string, seeds: T[]) => {
    const current = load<T>(key);
    const additions = seeds.filter((seed) => !current.some((item) => item.id === seed.id));
    if (additions.length) save(key, [...current, ...additions]);
  };

  mergeSeedById(KEYS.episodes, SEED_EPISODES.filter((item) => activeProjectIds.has(item.projectId)));
  mergeSeedById(KEYS.foreshadows, SEED_FORESHADOWS.filter((item) => activeProjectIds.has(item.projectId)));
  mergeSeedById(KEYS.characters, SEED_CHARACTERS.filter((item) => activeProjectIds.has(item.projectId)));
  mergeSeedById(KEYS.todos, SEED_TODOS.filter((item) => activeProjectIds.has(item.projectId)));

  const currentActs = load<Act>(KEYS.acts);
  const actsToAdd = SEED_ACTS.filter((item) => activeProjectIds.has(item.projectId) && !currentActs.some((act) => act.projectId === item.projectId));
  if (actsToAdd.length) save(KEYS.acts, [...currentActs, ...actsToAdd]);

  const currentWorldSettings = load<WorldSetting>(KEYS.worldSettings);
  const worldsToAdd = SEED_WORLD_SETTINGS.filter((item) => activeProjectIds.has(item.projectId) && !currentWorldSettings.some((world) => world.projectId === item.projectId));
  if (worldsToAdd.length) save(KEYS.worldSettings, [...currentWorldSettings, ...worldsToAdd]);

  if (SHOWCASE_PROJECT_IDS.every((projectId) => activeProjectIds.has(projectId))) {
    localStorage.setItem(SHOWCASE_SEED_KEY, "1");
  }
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
