import { Router } from "express";
import { requireAuth } from "../middleware/auth.mjs";
import { aiRateLimit } from "../middleware/aiRateLimit.mjs";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import { runAiTask, DEFAULT_MODEL } from "../lib/openai.mjs";
import { recordAiUsage } from "../services/aiUsage.service.mjs";

export const aiRouter = Router();
aiRouter.use(requireAuth, aiRateLimit);

const TASK_BY_PATH = {
  "/chat": "chat",
  "/story-structure": "story-structure",
  "/scene-guide": "scene-guide",
  "/character-conflicts": "character-conflicts",
  "/foreshadow-review": "foreshadow-review",
  "/world-setting": "world-setting",
  "/export-summary": "export-summary",
};

for (const [path, task] of Object.entries(TASK_BY_PATH)) {
  aiRouter.post(path, asyncRoute(async (req, res) => {
    const result = await runAiTask(task, req.body);
    recordAiUsage({
      userId: req.user.id,
      projectId: req.body?.projectId || req.body?.characters?.[0]?.projectId || null,
      task,
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      usage: result.usage,
    });
    res.status(200).json(result);
  }));
}
