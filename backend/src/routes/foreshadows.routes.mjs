import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import * as foreshadowService from "../services/foreshadow.service.mjs";
import { foreshadowSchema, updateForeshadowSchema } from "../validators/foreshadow.schema.mjs";

// Mounted at /api/projects/:projectId/foreshadows, after requireAuth + requireProjectOwnership.
export const nestedForeshadowsRouter = Router({ mergeParams: true });

nestedForeshadowsRouter.get("/", asyncRoute(async (req, res) => {
  res.json(await foreshadowService.listForeshadows(req.params.projectId));
}));

nestedForeshadowsRouter.post("/", asyncRoute(async (req, res) => {
  const data = foreshadowSchema.parse(req.body);
  res.status(201).json(await foreshadowService.createForeshadow(req.params.projectId, data));
}));

// Mounted at /api/foreshadows, after requireAuth.
export const foreshadowsRouter = Router();

foreshadowsRouter.put("/:foreshadowId", asyncRoute(async (req, res) => {
  const data = updateForeshadowSchema.parse(req.body);
  res.json(await foreshadowService.updateForeshadow(req.user.id, req.params.foreshadowId, data));
}));

foreshadowsRouter.delete("/:foreshadowId", asyncRoute(async (req, res) => {
  await foreshadowService.deleteForeshadow(req.user.id, req.params.foreshadowId);
  res.status(204).end();
}));
