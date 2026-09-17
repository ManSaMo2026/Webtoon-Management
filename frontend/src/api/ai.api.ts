import type { Character, Foreshadow, SceneRequest, SceneResult, WorldSetting } from "../types";
import type { ExportSummaryInput, StoryStructureInput, StoryStructureSuggestion } from "../types/ai";

const wait = (ms = 900) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export type CreativeChatArea = "story" | "character" | "world";

export interface CreativeChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CreativeChatRequest {
  area: CreativeChatArea;
  message: string;
  history: CreativeChatMessage[];
  context?: string;
}

const chatGuides: Record<CreativeChatArea, { questions: string[]; summaryTitle: string }> = {
  story: {
    questions: [
      "주인공이 이 이야기에서 반드시 얻고 싶은 것은 무엇이고, 그것을 가장 강하게 막는 것은 무엇인가요?",
      "주인공이 목표를 이루기 위해 포기하거나 감수해야 하는 대가는 무엇인가요?",
    ],
    summaryTitle: "스토리 논의 메모",
  },
  character: {
    questions: [
      "이 인물이 겉으로 원하는 것과 마음속으로 두려워하는 것을 각각 알려주세요.",
      "평소의 성격과 위기 상황에서 드러나는 행동 사이에 어떤 차이를 만들고 싶나요?",
    ],
    summaryTitle: "캐릭터 논의 메모",
  },
  world: {
    questions: [
      "이 세계에서 모두가 당연하게 지키는 규칙 한 가지는 무엇인가요?",
      "그 규칙을 어기면 누가 어떤 대가를 치르게 되나요?",
    ],
    summaryTitle: "세계관 논의 메모",
  },
};

/**
 * 현재 함수들은 백엔드 연결 전 UI 검증용 mock입니다.
 * 실제 OpenAI API 키는 프론트가 아닌 FastAPI 백엔드에서만 관리해야 합니다.
 */
export const aiApi = {
  async chatCreativeAssistant(req: CreativeChatRequest): Promise<string> {
    await wait(700);
    const userMessages = [...req.history.filter((item) => item.role === "user").map((item) => item.content), req.message];
    const guide = chatGuides[req.area];

    if (userMessages.length <= guide.questions.length) {
      return `좋아요. 말씀해주신 내용을 더 구체화해볼게요.\n\n${guide.questions[userMessages.length - 1]}`;
    }

    const notes = userMessages.slice(-3).map((item) => `• ${item}`).join("\n");
    return `${guide.summaryTitle}\n${notes}\n\n이 내용을 바탕으로 작성 칸에 반영할 문장을 직접 골라 다듬어보세요. 더 확인하고 싶은 부분이 있으면 계속 질문해도 됩니다.`;
  },

  async suggestStoryStructure(input: StoryStructureInput): Promise<StoryStructureSuggestion> {
    await wait();
    const subject = input.logline ? `「${input.logline}」를 중심으로` : "주인공의 핵심 욕망을 중심으로";
    return {
      act1: `[AI 제안] 1막: ${subject} 일상과 결핍, 사건의 씨앗을 제시합니다.`,
      act2: "[AI 제안] 2막: 목표를 향한 시련과 관계 갈등을 교차시키고, 선택의 대가를 키웁니다.",
      act3: "[AI 제안] 3막: 핵심 갈등과 주요 복선을 회수하고 변화한 주인공의 새 균형을 보여줍니다.",
    };
  },

  async generateSceneGuide(req: SceneRequest): Promise<SceneResult> {
    await wait(1_200);
    return {
      cuts: Array.from({ length: 8 }, (_, i) => ({
        number: i + 1,
        description: [
          `${req.location} 전경 롱샷 — ${req.timeOfDay}의 분위기를 확립`,
          `${req.characters[0] ?? "주인공"} 등장, 표정 클로즈업 — ${req.emotionKeywords[0] ?? "긴장"}`,
          "대화 시작, 투 샷 구성",
          "중요 소품 인서트 컷",
          "감정 변화 순간, 리액션 컷",
          `${req.tone} 분위기의 공간 묘사 컷`,
          "하이라이트 장면, 다이나믹 앵글",
          "마무리 컷 — 다음 화 복선 배치",
        ][i],
        viewpoint: ["롱샷", "미디엄샷", "투샷", "클로즈업", "클로즈업", "미디엄샷", "로우앵글", "미디엄샷"][i],
        emotion: req.emotionKeywords[i % Math.max(req.emotionKeywords.length, 1)] ?? "중립",
      })),
      viewpointRecommendation: `이 장면은 ${req.tone} 톤에 맞춰 롱샷에서 클로즈업으로 좁혀가는 구성을 추천합니다.`,
      emotionPoint: `${req.emotionKeywords.join(", ") || "핵심 감정"}의 변화를 5~6컷에서 가장 크게 보여주세요.`,
      endingHooks: [
        `${req.characters[0] ?? "주인공"}이 예상치 못한 인물과 마주친다`,
        "중요 정보가 담긴 편지나 메시지가 발견된다",
        `${req.location}에서 불길한 징조가 나타나며 장면이 끝난다`,
      ],
    };
  },

  async checkCharacterConflict(characters: Character[]): Promise<string[]> {
    await wait();
    if (characters.length < 2) return [];
    return characters
      .filter((character) => character.goal && character.taboo)
      .slice(0, 2)
      .map((character) => `${character.name}: 목표와 금기 설정이 장면 전개에서 충돌하지 않는지 확인해보세요.`);
  },

  async reviewForeshadows(foreshadows: Foreshadow[]): Promise<string> {
    await wait();
    const unresolved = foreshadows.filter((item) => item.status !== "회수완료");
    const high = unresolved.filter((item) => item.importance === "high");
    return `미회수 복선 ${unresolved.length}개 중 중요도 높음이 ${high.length}개입니다. 회수 예정화가 비어 있는 항목부터 점검해보세요.`;
  },

  async organizeWorldSetting(worldSetting: WorldSetting): Promise<WorldSetting> {
    await wait();
    // 사용자가 작성한 값은 유지하고 비어 있는 항목만 예시 초안으로 보완합니다.
    return {
      ...worldSetting,
      era: worldSetting.era || "근미래의 가상 도시",
      mainPlaces: worldSetting.mainPlaces || "구도심 창작 지구와 폐쇄된 중앙 기록소",
      worldRules: worldSetting.worldRules || "기억 기록은 허가받은 기관에서만 열람할 수 있음",
      organizations: worldSetting.organizations || "도시 기록청, 독립 창작자 연합",
      culture: worldSetting.culture || "기록과 평판을 중시하며 외부인을 경계하는 사회",
      technologyOrMagic: worldSetting.technologyOrMagic || "감정을 기록 매체로 변환하는 기술이 존재함",
      moodTone: worldSetting.moodTone || "어둡지만 따뜻한 성장 드라마",
      forbiddenSettings: worldSetting.forbiddenSettings || "시간여행 설정은 사용하지 않음",
    };
  },

  async summarizeExport(input: ExportSummaryInput): Promise<string> {
    await wait();
    return `${input.project.title}은(는) ${input.project.genre} 장르의 작품으로, ${input.project.totalEpisodes}화 완결을 목표로 합니다.`;
  },
};
