export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFound(message = "요청한 자원을 찾을 수 없습니다.") {
  return new AppError(message, 404);
}

export function badRequest(message) {
  return new AppError(message, 400);
}

export function conflict(message) {
  return new AppError(message, 409);
}
