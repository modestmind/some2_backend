import { z } from "zod";

export const createSajuProfileSchema = z.object({
  name: z.string().min(1, "이름은 최소 1글자 이상입니다."),
  gender: z.enum(["F", "M"]),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일을 정확히 입력해 주세요."),
  birth_time: z.preprocess(
    (val) => (val === "" || val == null ? null : val),
    z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, "출생 시간 형식은 HH:MM 또는 HH:MM:SS 입니다.")
      .nullable()
  ),
  calendar_type: z.enum(["solar", "lunar", "lunar_leap"]),
  is_self: z.enum(["Y", "N"]),
  relationship_type: z.string().nullish(),
  relation_duration: z.string().nullish(),
  relationship_status: z.string().nullish(),
});
