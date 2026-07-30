// 실 운영 여부
const isProduction = process.env.IS_PRODUCTION === "Y";

// 서버 포트
export const PORT = 3000;

// 엑세스 토큰 만료시간 (10분)
export const ACCESS_TOKEN_EXPIRES_IN = 60 * 10;

// 리프레시 토큰 만료시간 (1주일)
export const REFRESH_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 7;

// 리프레시 토큰 쿠키명
export const REFRESH_TOKEN_COOKIE = "refreshToken";

// 리프레시 토큰 쿠키 옵션 설정
export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  path: "/api/auth",
} as const;

// CORS 옵션
export const CORS_OPTIONS = {
  credentials: true,
  origin: isProduction ? "https://some2.vercel.app" : "http://localhost:5173",
} as const;

// morgan 로그 포멧
export const MORGAN_FORMAT = "dev";  // dev, common, combined

// rateLimit 옵션
export const RATE_LIMIT_OPTIONS = {
    windowMs: 15 * 60 * 1000,  // 15분
    limit: 100,
    message: "너무 많은 요청이 발생했습니다. 잠시 뒤에 다시 시도해주세요.",
} as const;

// Kakao 로그인 콜백 URI
export const KAKAO_REDIRECT_URI = isProduction ? "https://some2.vercel.app/auth/kakao/callback" : "http://localhost:5173/auth/kakao/callback";
