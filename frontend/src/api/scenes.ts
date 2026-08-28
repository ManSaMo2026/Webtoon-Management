import type { SceneRequest, SceneResult } from "../types";
import { aiApi } from "./ai.api";

export const scenesApi = {
  generate: (req: SceneRequest): Promise<SceneResult> => aiApi.generateSceneGuide(req),
};
