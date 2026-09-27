import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import * as storyActService from "../services/storyAct.service.mjs";
import { storyActSchema } from "../validators/storyAct.schema.mjs";

// Mounted at /api/projects/:projectId/story-acts, after requireAuth + requireProjectOwnership.
export const storyActsRouter = Router({ mergeParams: true });

storyActsRouter.get("/", asyncRoute(async (req, res) => {
  res.json(await storyActService.getStoryAct(req.params.projectId));
}));

storyActsRouter.put("/", asyncRoute(async (req, res) => {
  const data = storyActSchema.parse(req.body);
  res.json(await storyActService.upsertStoryAct(req.params.projectId, data));
}));
