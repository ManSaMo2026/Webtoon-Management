import { AppError } from "../lib/errors.mjs";

// In-memory only: resets on restart and isn't shared across instances.
// Reference doc §9/§11 flags moving this to Redis/DB before multi-instance production use.
const AI_REQUEST_LIMIT = 20;
const AI_REQUEST_WINDOW_MS = 60 * 60 * 1000;
const requestLog = new Map();

export function aiRateLimit(req, res, next) {
  const userId = req.user.id;
  const now = Date.now();
  const recent = (requestLog.get(userId) || []).filter((time) => now - time < AI_REQUEST_WINDOW_MS);
  if (recent.length >= AI_REQUEST_LIMIT) {
    return next(new AppError("AI 요청 한도를 초과했습니다. 한 시간 뒤 다시 시도해주세요.", 429));
  }
  recent.push(now);
  requestLog.set(userId, recent);
  next();
}
