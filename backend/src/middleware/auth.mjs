import { getUserByToken } from "../services/auth.service.mjs";
import { AppError } from "../lib/errors.mjs";

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const user = await getUserByToken(token);
    if (!user) throw new AppError("로그인이 필요합니다.", 401);
    req.user = user;
    req.authToken = token;
    next();
  } catch (error) {
    next(error);
  }
}
