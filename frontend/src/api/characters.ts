import { characterStore } from "../mocks/store";
import type { Character } from "../types";

export const charactersApi = {
  list: (projectId: string) => characterStore.getByProject(projectId),
  create: (data: Omit<Character, "id">) => characterStore.create(data),
  update: (id: string, data: Partial<Character>) => characterStore.update(id, data),
  delete: (id: string) => characterStore.delete(id),

  checkConflicts: async (projectId: string): Promise<string[]> => {
    await new Promise<void>((r) => setTimeout(r, 1200));
    return [
      "루나 실버: 3화에서 '마법 사용 불가'로 설정했으나 7화에서 마법을 사용하는 장면이 존재합니다.",
      "카이 레온: 목표(황제 타도)와 금기(혈통 언급 회피) 사이의 잠재적 충돌이 감지됩니다.",
    ];
  },
};
