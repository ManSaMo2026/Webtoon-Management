import { Router } from "express";
import { requireAuth } from "../middleware/auth.mjs";
import { aiRateLimit } from "../middleware/aiRateLimit.mjs";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import { runAiTask, DEFAULT_MODEL } from "../lib/openai.mjs";
import { recordAiUsage } from "../services/aiUsage.service.mjs";
import { AppError } from "../lib/errors.mjs";
import * as aiChatService from "../services/aiChat.service.mjs";

export const aiRouter = Router();
aiRouter.use(requireAuth, aiRateLimit);

const TASK_BY_PATH = {
  "/story-structure": "story-structure",
  "/scene-guide": "scene-guide",
  "/character-conflicts": "character-conflicts",
  "/foreshadow-review": "foreshadow-review",
  "/world-setting": "world-setting",
  "/export-summary": "export-summary",
};

const CHAT_AREAS = new Set(["story", "character", "world"]);

function readChatArea(value) {
  const area = String(value || "");
  if (!CHAT_AREAS.has(area)) throw new AppError("지원하지 않는 상담 영역입니다.", 400);
  return area;
}

aiRouter.get("/projects/:projectId/messages", asyncRoute(async (req, res) => {
  const area = readChatArea(req.query.area);
  res.json(await aiChatService.listChatMessages(req.user.id, req.params.projectId, area));
}));

aiRouter.delete("/projects/:projectId/messages", asyncRoute(async (req, res) => {
  const area = readChatArea(req.query.area);
  await aiChatService.clearChatMessages(req.user.id, req.params.projectId, area);
  res.status(204).end();
}));

aiRouter.post("/chat", asyncRoute(async (req, res) => {
  const projectId = String(req.body?.projectId || "").trim();
  const area = readChatArea(req.body?.area);
  const message = String(req.body?.message || "").trim();
  if (!projectId) throw new AppError("프로젝트 정보가 필요합니다.", 400);
  if (!message) throw new AppError("메시지를 입력해주세요.", 400);
  if (message.length > 2_000) throw new AppError("메시지는 2,000자 이내로 입력해주세요.", 400);

  const { context, history } = await aiChatService.buildChatRequest(req.user.id, projectId, area);
  const result = await runAiTask("chat", { area, message, history, context });
  await aiChatService.saveChatExchange(projectId, area, message, result.result);
  await recordAiUsage({
    userId: req.user.id,
    projectId,
    task: "chat",
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    usage: result.usage,
  });
  res.status(200).json(result);
}));

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
