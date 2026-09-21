import { prisma } from "../lib/prisma.mjs";

// Usage rows only ever store token counts, never prompt/response content.
export async function recordAiUsage({ userId, projectId, task, model, usage }) {
  try {
    await prisma.aiUsageEvent.create({
      data: {
        userId,
        projectId: projectId || null,
        task,
        model,
        inputTokens: usage?.input_tokens ?? null,
        outputTokens: usage?.output_tokens ?? null,
      },
    });
  } catch (error) {
    console.error(`[ai-usage] 기록 실패: ${error?.message || error}`);
  }
}
