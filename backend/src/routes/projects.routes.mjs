import { Router } from "express";
import { requireAuth } from "../middleware/auth.mjs";
import { requireProjectOwnership } from "../middleware/ownership.mjs";
import { uploadImage as uploadImageMiddleware } from "../middleware/upload.mjs";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import * as projectService from "../services/project.service.mjs";
import { uploadImage as uploadToStorage } from "../lib/supabaseStorage.mjs";
import { createProjectSchema, updateProjectSchema } from "../validators/project.schema.mjs";
import { nestedCharactersRouter } from "./characters.routes.mjs";
import { nestedEpisodesRouter } from "./episodes.routes.mjs";
import { storyActsRouter } from "./storyActs.routes.mjs";
import { nestedForeshadowsRouter } from "./foreshadows.routes.mjs";
import { worldSettingsRouter } from "./worldSettings.routes.mjs";
import { nestedTodosRouter } from "./todos.routes.mjs";
import { nestedTimelineItemsRouter } from "./timelineItems.routes.mjs";
import { relationshipBoardRouter } from "./relationshipBoard.routes.mjs";

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

projectsRouter.get("/", asyncRoute(async (req, res) => {
  res.json(await projectService.listProjects(req.user.id));
}));

projectsRouter.post("/", asyncRoute(async (req, res) => {
  const data = createProjectSchema.parse(req.body);
  res.status(201).json(await projectService.createProject(req.user.id, data));
}));

projectsRouter.get("/:projectId", requireProjectOwnership(), asyncRoute(async (req, res) => {
  res.json(req.project);
}));

projectsRouter.put("/:projectId", requireProjectOwnership(), asyncRoute(async (req, res) => {
  const data = updateProjectSchema.parse(req.body);
  res.json(await projectService.updateProject(req.user.id, req.params.projectId, data));
}));

projectsRouter.delete("/:projectId", requireProjectOwnership(), asyncRoute(async (req, res) => {
  await projectService.deleteProject(req.user.id, req.params.projectId);
  res.status(204).end();
}));

projectsRouter.post(
  "/:projectId/cover-image",
  requireProjectOwnership(),
  uploadImageMiddleware.single("file"),
  asyncRoute(async (req, res) => {
    const uploaded = await uploadToStorage({
      userId: req.user.id,
      projectId: req.params.projectId,
      purpose: "cover",
      file: req.file,
    });
    res.status(201).json(await projectService.setCoverImage(req.user.id, req.params.projectId, uploaded));
  }),
);

projectsRouter.delete(
  "/:projectId/cover-image",
  requireProjectOwnership(),
  asyncRoute(async (req, res) => {
    res.json(await projectService.removeCoverImage(req.user.id, req.params.projectId));
  }),
);

// Child resources: each mount re-verifies project ownership, then delegates to a
// mergeParams sub-router that reads req.params.projectId.
projectsRouter.use("/:projectId/characters", requireProjectOwnership(), nestedCharactersRouter);
projectsRouter.use("/:projectId/episodes", requireProjectOwnership(), nestedEpisodesRouter);
projectsRouter.use("/:projectId/story-acts", requireProjectOwnership(), storyActsRouter);
projectsRouter.use("/:projectId/foreshadows", requireProjectOwnership(), nestedForeshadowsRouter);
projectsRouter.use("/:projectId/todos", requireProjectOwnership(), nestedTodosRouter);
projectsRouter.use("/:projectId/timeline-items", requireProjectOwnership(), nestedTimelineItemsRouter);
projectsRouter.use("/:projectId/relationship-board", requireProjectOwnership(), relationshipBoardRouter);
// Handles /world-setting and /world-place-images under the project.
projectsRouter.use("/:projectId", requireProjectOwnership(), worldSettingsRouter);
