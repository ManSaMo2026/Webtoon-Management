import { z } from "zod";
import { GENRES, CADENCES, COLOR_MODES, BG_COMPLEXITIES, PROJECT_STATUSES } from "../config/enums.mjs";
import { MAX_EPISODES } from "../config/limits.mjs";

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: "올바른 날짜 형식이 아닙니다." });

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요.").max(120),
  platform: z.string().trim().max(60).optional(),
  tags: z.array(z.string().trim().min(1)).max(10).optional().default([]),
  genre: z.enum(GENRES),
  customGenre: z.string().trim().max(60).optional(),
  totalEpisodes: z.number().int().min(1).max(MAX_EPISODES),
  cadence: z.enum(CADENCES),
  weeklyHours: z.number().min(0).max(200),
  avgCuts: z.number().int().min(1).max(300),
  colorMode: z.enum(COLOR_MODES),
  bgComplexity: z.enum(BG_COMPLEXITIES),
  hasAssistant: z.boolean(),
  logline: z.string().trim().max(500).optional().default(""),
  conflict: z.string().trim().max(500).optional().default(""),
  nextDeadline: isoDate,
  completionDate: isoDate.optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  customStatus: z.string().trim().max(60).optional(),
});

// coverImageUrl/coverStorageKey are set only via the cover-image upload endpoint, never from this body.
export const updateProjectSchema = createProjectSchema.partial().extend({
  currentEpisode: z.number().int().min(0).optional(),
});
