import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import * as timelineItemService from "../services/timelineItem.service.mjs";
import { timelineItemSchema, updateTimelineItemSchema } from "../validators/timelineItem.schema.mjs";

// Mounted at /api/projects/:projectId/timeline-items, after requireAuth + requireProjectOwnership.
export const nestedTimelineItemsRouter = Router({ mergeParams: true });

nestedTimelineItemsRouter.get("/", asyncRoute(async (req, res) => {
  res.json(await timelineItemService.listTimelineItems(req.params.projectId));
}));

nestedTimelineItemsRouter.post("/", asyncRoute(async (req, res) => {
  const data = timelineItemSchema.parse(req.body);
  res.status(201).json(await timelineItemService.createTimelineItem(req.params.projectId, data));
}));

// Mounted at /api/timeline-items, after requireAuth.
export const timelineItemsRouter = Router();

timelineItemsRouter.put("/:itemId", asyncRoute(async (req, res) => {
  const data = updateTimelineItemSchema.parse(req.body);
  res.json(await timelineItemService.updateTimelineItem(req.user.id, req.params.itemId, data));
}));

timelineItemsRouter.delete("/:itemId", asyncRoute(async (req, res) => {
  await timelineItemService.deleteTimelineItem(req.user.id, req.params.itemId);
  res.status(204).end();
}));
