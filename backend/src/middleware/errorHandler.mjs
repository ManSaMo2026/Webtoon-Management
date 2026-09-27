import { ZodError } from "zod";

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message || "입력값을 확인해주세요.";
    return res.status(400).json({ message });
  }

  const status = Number(error.statusCode) || Number(error.status) || 500;
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  if (safeStatus >= 500) {
    // Don't leak internal error text (e.g. raw Prisma/DB errors) to the client.
    console.error(`[server] ${error?.stack || error?.message || "알 수 없는 오류"}`);
    return res.status(safeStatus).json({ message: "서버 오류가 발생했습니다." });
  }
  res.status(safeStatus).json({ message: error.message || "요청을 처리할 수 없습니다." });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ message: "요청한 API를 찾을 수 없습니다." });
}

export function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
