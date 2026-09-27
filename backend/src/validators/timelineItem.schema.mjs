import { z } from "zod";

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: "올바른 날짜 형식이 아닙니다." });

export const timelineItemSchema = z
  .object({
    title: z.string().trim().min(1, "제목을 입력해주세요.").max(120),
    startDate: isoDate,
    endDate: isoDate,
  })
  .refine((data) => Date.parse(data.startDate) <= Date.parse(data.endDate), {
    message: "종료일은 시작일 이후여야 합니다.",
    path: ["endDate"],
  });

export const updateTimelineItemSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
});
