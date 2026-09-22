import { apiClient } from "./client";
import { dataUrlToBlob, isDataUrl, uploadImageBlob } from "./imageUpload";
import type { WorldSetting, WorldPlaceReference } from "../types";

type ServerWorldSetting = Omit<WorldSetting, "id"> & { placeReferences: WorldPlaceReference[] };

// The backend keys world_settings by projectId (no separate id column) — the
// frontend type still expects an `id`, so we synthesize a stable one.
function withId(setting: ServerWorldSetting): WorldSetting {
  return { id: setting.projectId, ...setting };
}

export const worldSettingsApi = {
  get: async (projectId: string): Promise<WorldSetting | null> => {
    const { data } = await apiClient.get<ServerWorldSetting | null>(`/api/projects/${projectId}/world-setting`);
    return data ? withId(data) : null;
  },

  // The component stages everything (text fields + placeReferences, including
  // newly-picked data-URL images with client-generated temp ids) in one local
  // object and calls save() once. The real backend only accepts text fields on
  // this endpoint and manages place images through separate upload/delete/memo
  // endpoints, so this reconciles the two shapes internally.
  save: async (data: WorldSetting): Promise<WorldSetting> => {
    const { projectId, placeReferences = [] } = data;
    const { data: saved } = await apiClient.put<ServerWorldSetting>(`/api/projects/${projectId}/world-setting`, data);

    const serverRefs = saved.placeReferences;
    const serverById = new Map(serverRefs.map((ref) => [ref.id, ref]));
    const clientIds = new Set(placeReferences.map((ref) => ref.id));

    const removed = serverRefs.filter((ref) => !clientIds.has(ref.id));
    const added = placeReferences.filter((ref) => !serverById.has(ref.id) && isDataUrl(ref.imageUrl));
    const memoChanged = placeReferences.filter((ref) => {
      const existing = serverById.get(ref.id);
      return existing && existing.memo !== ref.memo;
    });

    await Promise.all([
      ...removed.map((ref) => apiClient.delete(`/api/world-place-images/${ref.id}`)),
      ...added.map(async (ref) => {
        const blob = await dataUrlToBlob(ref.imageUrl);
        return uploadImageBlob(`/api/projects/${projectId}/world-place-images`, blob);
      }),
      ...memoChanged.map((ref) => apiClient.patch(`/api/world-place-images/${ref.id}`, { memo: ref.memo })),
    ]);

    const { data: refreshed } = await apiClient.get<ServerWorldSetting>(`/api/projects/${projectId}/world-setting`);
    return withId(refreshed);
  },
};
