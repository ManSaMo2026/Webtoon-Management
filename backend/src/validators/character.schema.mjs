import { z } from "zod";
import { CHARACTER_ROLE_GROUPS } from "../config/enums.mjs";

const optionalText = (max) => z.string().trim().max(max).optional();

// imageUrl/storageKey are set only via the character image upload endpoint.
export const characterSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(60),
  role: z.string().trim().min(1, "역할을 입력해주세요.").max(60),
  roleGroup: z.enum(CHARACTER_ROLE_GROUPS).optional(),
  personality: z.string().trim().max(1000).optional().default(""),
  goal: z.string().trim().max(1000).optional().default(""),
  speechStyle: z.string().trim().max(1000).optional().default(""),
  taboo: z.string().trim().max(1000).optional().default(""),
  secret: z.string().trim().max(1000).optional().default(""),
  keywords: z.array(z.string().trim().min(1)).max(20).optional().default([]),
  gender: optionalText(20),
  age: optionalText(20),
  origin: optionalText(100),
  occupation: optionalText(100),
  likes: optionalText(300),
  dislikes: optionalText(300),
  backstory: optionalText(2000),
  relationships: optionalText(1000),
});

export const updateCharacterSchema = characterSchema.partial();
