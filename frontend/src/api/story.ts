import { episodeStore, foreshadowStore, actStore } from "../mocks/store";
import type { Episode, Foreshadow, Act } from "../types";

export const storyApi = {
  getEpisodes: (projectId: string) => episodeStore.getByProject(projectId),
  createEpisode: (data: Omit<Episode, "id">) => episodeStore.create(data),
  updateEpisode: (id: string, data: Partial<Episode>) => episodeStore.update(id, data),
  deleteEpisode: (id: string) => episodeStore.delete(id),

  getForeshadows: (projectId: string) => foreshadowStore.getByProject(projectId),
  createForeshadow: (data: Omit<Foreshadow, "id">) => foreshadowStore.create(data),
  updateForeshadow: (id: string, data: Partial<Foreshadow>) => foreshadowStore.update(id, data),
  deleteForeshadow: (id: string) => foreshadowStore.delete(id),

  getActs: (projectId: string): Promise<import("../types").Act | null> => actStore.getByProject(projectId),
  saveActs: (data: Act) => actStore.upsert(data),

  getAiActSuggestion: async (projectId: string): Promise<Act> => {
    await new Promise<void>((r) => setTimeout(r, 1500));
    return {
      projectId,
      act1: "[AI 제안] 1막: 주인공의 일상과 결핍이 제시되고, 사건의 씨앗이 뿌려집니다. 독자가 감정 이입할 수 있는 핵심 욕망이 드러납니다.",
      act2: "[AI 제안] 2막: 주인공이 목표를 향해 나아가지만 연속된 시련을 맞닥뜨립니다. 내적 갈등과 외적 갈등이 교차하며 절정으로 치닫습니다.",
      act3: "[AI 제안] 3막: 최고조의 갈등이 해소되고, 주인공은 변화한 모습으로 새로운 균형에 도달합니다. 남은 복선이 회수됩니다.",
    };
  },
};
