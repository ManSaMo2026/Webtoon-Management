import type { Character, Foreshadow, SceneRequest, SceneResult, WorldSetting } from "../types";
import type { ExportSummaryInput, StoryStructureInput, StoryStructureSuggestion } from "../types/ai";
import { apiClient } from "./client";

export type CreativeChatArea = "story" | "character" | "world";

export interface CreativeChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SavedCreativeChatMessage extends CreativeChatMessage {
  id: string;
  projectId: string;
  area: CreativeChatArea;
  createdAt: string;
}

interface CreativeChatRequest {
  projectId: string;
  area: CreativeChatArea;
  message: string;
}

interface AiResponse<T> {
  result: T;
  usage?: unknown;
}

async function postAi<T>(path: string, payload: unknown): Promise<T> {
  const response = await apiClient.post<AiResponse<T>>(path, payload, { timeout: 45_000 });
  return response.data.result;
}

export const aiApi = {
  async listCreativeChat(projectId: string, area: CreativeChatArea): Promise<SavedCreativeChatMessage[]> {
    return (await apiClient.get<SavedCreativeChatMessage[]>(`/api/ai/projects/${projectId}/messages`, { params: { area } })).data;
  },

  async chatCreativeAssistant(req: CreativeChatRequest): Promise<string> {
    return postAi<string>("/api/ai/chat", req);
  },

  async clearCreativeChat(projectId: string, area: CreativeChatArea): Promise<void> {
    await apiClient.delete(`/api/ai/projects/${projectId}/messages`, { params: { area } });
  },

  async suggestStoryStructure(input: StoryStructureInput): Promise<StoryStructureSuggestion> {
    return postAi<StoryStructureSuggestion>("/api/ai/story-structure", input);
  },

  async generateSceneGuide(req: SceneRequest): Promise<SceneResult> {
    return postAi<SceneResult>("/api/ai/scene-guide", req);
  },

  async checkCharacterConflict(characters: Character[]): Promise<string[]> {
    if (characters.length < 2) return [];
    return postAi<string[]>("/api/ai/character-conflicts", { characters });
  },

  async reviewForeshadows(foreshadows: Foreshadow[]): Promise<string> {
    return postAi<string>("/api/ai/foreshadow-review", { foreshadows });
  },

  async organizeWorldSetting(worldSetting: WorldSetting): Promise<WorldSetting> {
    return postAi<WorldSetting>("/api/ai/world-setting", { worldSetting });
  },

  async summarizeExport(input: ExportSummaryInput): Promise<string> {
    return postAi<string>("/api/ai/export-summary", input);
  },
};
