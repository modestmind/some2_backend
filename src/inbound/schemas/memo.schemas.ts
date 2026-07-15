import { z } from "zod";

export const createMemoDataSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 최소 1글자 이상입니다.")
    .max(100, "제목은 최대 100글자입니다."),
  content: z
    .string()
    .min(1, "내용은 최소 1글자 이상입니다.")
    .max(2000, "내용은 최대 2000글자입니다."),
});

export const updateMemoDataSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 최소 1글자 이상입니다.")
    .max(100, "제목은 최대 100글자입니다.")
    .optional(),
  content: z
    .string()
    .min(1, "내용은 최소 1글자 이상입니다.")
    .max(2000, "내용은 최대 2000글자입니다.")
    .optional(),
});
