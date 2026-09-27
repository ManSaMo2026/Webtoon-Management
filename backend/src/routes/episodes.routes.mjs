import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import * as episodeService from "../services/episode.service.mjs";
import { episodeSchema, updateEpisodeSchema } from "../validators/episode.schema.mjs";

// Mounted at /api/projects/:projectId/episodes, after requireAuth + requireProjectOwnership.
export const nestedEpisodesRouter = Router({ mergeParams: true });

nestedEpisodesRouter.get("/", asyncRoute(async (req, res) => {
  res.json(await episodeService.listEpisodes(req.params.projectId));
}));

nestedEpisodesRouter.post("/", asyncRoute(async (req, res) => {
  const data = episodeSchema.parse(req.body);
  res.status(201).json(await episodeService.createEpisode(req.params.projectId, data));
}));

// Mounted at /api/episodes, after requireAuth.
export const episodesRouter = Router();

episodesRouter.put("/:episodeId", asyncRoute(async (req, res) => {
  const data = updateEpisodeSchema.parse(req.body);
  res.json(await episodeService.updateEpisode(req.user.id, req.params.episodeId, data));
}));

episodesRouter.delete("/:episodeId", asyncRoute(async (req, res) => {
  await episodeService.deleteEpisode(req.user.id, req.params.episodeId);
  res.status(204).end();
}));
