import { worldSettingStore } from "../mocks/store";
import type { WorldSetting } from "../types";

export const worldSettingsApi = {
  get: (projectId: string) => worldSettingStore.getByProject(projectId),
  save: (data: WorldSetting) => worldSettingStore.upsert(data),
};
