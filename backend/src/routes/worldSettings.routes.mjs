import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "../middleware/errorHandler.mjs";
import { uploadImage as uploadImageMiddleware } from "../middleware/upload.mjs";
import * as worldSettingService from "../services/worldSetting.service.mjs";
import { uploadImage as uploadToStorage } from "../lib/supabaseStorage.mjs";
import { worldSettingSchema } from "../validators/worldSetting.schema.mjs";

const memoSchema = z.object({ memo: z.string().trim().max(300).optional().default("") });

// Mounted at /api/projects/:projectId/world-setting (+ world-place-images), after requireAuth + requireProjectOwnership.
export const worldSettingsRouter = Router({ mergeParams: true });

worldSettingsRouter.get("/world-setting", asyncRoute(async (req, res) => {
  res.json(await worldSettingService.getWorldSetting(req.params.projectId));
}));

worldSettingsRouter.put("/world-setting", asyncRoute(async (req, res) => {
  const data = worldSettingSchema.parse(req.body);
  res.json(await worldSettingService.upsertWorldSetting(req.params.projectId, data));
}));

worldSettingsRouter.post(
  "/world-place-images",
  uploadImageMiddleware.single("file"),
  asyncRoute(async (req, res) => {
    const uploaded = await uploadToStorage({
      userId: req.user.id,
      projectId: req.params.projectId,
      purpose: "world-place",
      file: req.file,
    });
    res.status(201).json(
      await worldSettingService.addWorldPlaceImage(req.params.projectId, {
        ...uploaded,
        memo: req.body?.memo || "",
      }),
    );
  }),
);

// Mounted at /api/world-place-images, after requireAuth.
export const worldPlaceImagesRouter = Router();

worldPlaceImagesRouter.patch("/:imageId", asyncRoute(async (req, res) => {
  const { memo } = memoSchema.parse(req.body);
  res.json(await worldSettingService.updateWorldPlaceImageMemo(req.user.id, req.params.imageId, memo));
}));

worldPlaceImagesRouter.delete("/:imageId", asyncRoute(async (req, res) => {
  await worldSettingService.deleteWorldPlaceImage(req.user.id, req.params.imageId);
  res.status(204).end();
}));
