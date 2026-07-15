import z from "zod";

export const loginDataSchema = z.object({
  sns_provider_code: z.string().min(1, "간편 로그인 오류입니다. (업체구분)"),
  sns_user_key: z.string().min(1, "간편 로그인 오류입니다. (회원키)"),
  nickname: z.string().min(1, "간편 로그인 오류입니다. (닉네임)"),
});

export const bearerTokenSchema = z.object({
  token: z.string().min(1, "토큰은 필수입니다."),
});
