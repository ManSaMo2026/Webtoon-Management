import { z } from "zod";

export const todoSchema = z.object({
  content: z.string().trim().min(1, "할 일 내용을 입력해주세요.").max(300),
  done: z.boolean().optional().default(false),
});
