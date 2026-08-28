import type { Act, Character, Foreshadow, Project, SceneRequest, SceneResult, WorldSetting } from "./index";

export interface StoryStructureInput {
  projectId: string;
  logline?: string;
  conflict?: string;
}

export type StoryStructureSuggestion = Pick<Act, "act1" | "act2" | "act3">;

export interface ExportSummaryInput {
  project: Project;
  characters?: Character[];
  foreshadows?: Foreshadow[];
  worldSetting?: WorldSetting | null;
}

export type { SceneRequest, SceneResult };
