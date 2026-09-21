import { Router } from "express";
import { uploadImage as uploadImageMiddleware } from "../middleware/upload.mjs";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import * as characterService from "../services/character.service.mjs";
import { characterSchema, updateCharacterSchema } from "../validators/character.schema.mjs";

// Mounted at /api/projects/:projectId/characters, after requireAuth + requireProjectOwnership.
export const nestedCharactersRouter = Router({ mergeParams: true });

nestedCharactersRouter.get("/", asyncRoute(async (req, res) => {
  res.json(await characterService.listCharacters(req.params.projectId));
}));

nestedCharactersRouter.post("/", asyncRoute(async (req, res) => {
  const data = characterSchema.parse(req.body);
  res.status(201).json(await characterService.createCharacter(req.params.projectId, data));
}));

// Mounted at /api/characters, after requireAuth.
export const charactersRouter = Router();

charactersRouter.put("/:characterId", asyncRoute(async (req, res) => {
  const data = updateCharacterSchema.parse(req.body);
  res.json(await characterService.updateCharacter(req.user.id, req.params.characterId, data));
}));

charactersRouter.delete("/:characterId", asyncRoute(async (req, res) => {
  await characterService.deleteCharacter(req.user.id, req.params.characterId);
  res.status(204).end();
}));

charactersRouter.post(
  "/:characterId/image",
  uploadImageMiddleware.single("file"),
  asyncRoute(async (req, res) => {
    res.status(201).json(await characterService.setCharacterImage(req.user.id, req.params.characterId, req.file));
  }),
);

charactersRouter.delete(
  "/:characterId/image",
  asyncRoute(async (req, res) => {
    res.json(await characterService.removeCharacterImage(req.user.id, req.params.characterId));
  }),
);
