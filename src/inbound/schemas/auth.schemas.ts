import z from "zod";

export const loginDataSchema = z.object({
  sns_provider_code: z.string().min(1, "간편 로그인 오류입니다. (구분)"),
  credential: z.string().min(1, "간편 로그인 오류입니다. (코드)"),
});

export const bearerTokenSchema = z.object({
  token: z.string().min(1, "토큰은 필수입니다."),
});
