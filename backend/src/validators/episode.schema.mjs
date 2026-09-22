import { z } from "zod";
import { EPISODE_PURPOSES } from "../config/enums.mjs";

export const episodeSchema = z.object({
  number: z.number().int().min(1),
  summary: z.string().trim().max(1000).optional().default(""),
  purpose: z.enum(EPISODE_PURPOSES),
  hook: z.string().trim().max(500).optional().default(""),
});

export const updateEpisodeSchema = episodeSchema.partial();
