import { z } from "zod";

export const storyActSchema = z.object({
  act1: z.string().trim().max(2000).optional().default(""),
  act2: z.string().trim().max(2000).optional().default(""),
  act3: z.string().trim().max(2000).optional().default(""),
});
