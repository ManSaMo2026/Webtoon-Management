import { prisma } from "../lib/prisma.mjs";
import { notFound } from "../lib/errors.mjs";

// Attaches req.project after confirming req.user owns it. 404 (not 403) on
// mismatch so we don't reveal whether the project id exists for someone else.
export function requireProjectOwnership(paramName = "projectId") {
  return async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({ where: { id: req.params[paramName] } });
      if (!project || project.userId !== req.user.id) throw notFound("프로젝트를 찾을 수 없습니다.");
      req.project = project;
      next();
    } catch (error) {
      next(error);
    }
  };
}
