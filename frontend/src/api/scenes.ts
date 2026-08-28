import type { SceneRequest, SceneResult } from "../types";

export const scenesApi = {
  generate: async (req: SceneRequest): Promise<SceneResult> => {
    await new Promise<void>((r) => setTimeout(r, 1800));
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
        emotion: req.emotionKeywords[i % req.emotionKeywords.length] ?? "중립",
      })),
      viewpointRecommendation: `이 장면은 ${req.tone} 톤에 맞춰 초반 롱샷 → 클로즈업 점층 구조를 추천합니다. 감정선의 고조를 카메라 거리로 표현하세요.`,
      emotionPoint: `${req.emotionKeywords.join(", ")}의 감정 조합은 독자에게 강한 몰입감을 줍니다. 5~6컷에서 감정 정점을 배치하면 효과적입니다.`,
      endingHooks: [
        `${req.characters[0] ?? "주인공"}이 예상치 못한 인물과 마주친다`,
        "중요 정보가 담긴 편지/메시지가 발견된다",
        `${req.location}에서 불길한 징조가 나타나며 끊긴다`,
      ],
    };
  },
};
