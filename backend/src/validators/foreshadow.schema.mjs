import { z } from "zod";
import { FORESHADOW_STATUSES, FORESHADOW_IMPORTANCES } from "../config/enums.mjs";

export const foreshadowSchema = z.object({
  content: z.string().trim().min(1, "내용을 입력해주세요.").max(500),
  keyword: z.string().trim().max(60).optional(),
  importance: z.enum(FORESHADOW_IMPORTANCES).optional(),
  appearEp: z.number().int().min(1),
  resolveEp: z.number().int().min(1).nullable(),
  status: z.enum(FORESHADOW_STATUSES),
  relatedCharacterIds: z.array(z.string()).max(30).optional().default([]),
});

export const updateForeshadowSchema = foreshadowSchema.partial();
