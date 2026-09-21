import { Router } from "express";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import * as relationshipBoardService from "../services/relationshipBoard.service.mjs";
import { relationshipBoardSchema } from "../validators/relationshipBoard.schema.mjs";

// Mounted at /api/projects/:projectId/relationship-board, after requireAuth + requireProjectOwnership.
export const relationshipBoardRouter = Router({ mergeParams: true });

relationshipBoardRouter.get("/", asyncRoute(async (req, res) => {
  res.json(await relationshipBoardService.getRelationshipBoard(req.params.projectId));
}));

relationshipBoardRouter.put("/", asyncRoute(async (req, res) => {
  const data = relationshipBoardSchema.parse(req.body);
  res.json(await relationshipBoardService.saveRelationshipBoard(req.params.projectId, data));
}));
