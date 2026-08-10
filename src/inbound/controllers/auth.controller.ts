import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { AuthServiceType } from "../../application/services/auth.service.js";
import { loginDataSchema } from "../schemas/auth.schemas.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import { AuthException } from "../../shared/exceptions/auth.exception.js";
import type { IJwtUtil } from "../../shared/contracts/jwt-util.contract.js";
import {
  TechnicalException,
  TechnicalExceptionCode,
} from "../../shared/exceptions/technical.exception.js";
import {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from "../../shared/config.js";

export const createAuthController = (
  login: AuthServiceType["login"],
  refreshTokens: AuthServiceType["refreshTokens"],
  logout: AuthServiceType["logout"],
  verifyJwt: IJwtUtil["verifyJwt"],
) => {
  const router = Router();

  router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    const { success, data, error } = loginDataSchema.safeParse(req.body);
    if (success === false) {
      throw new BusinessException(z.prettifyError(error));
    }

    try {
      const { accessToken, refreshToken, nickname, isNewUser } = await login({ ...data, loginIp: req.ip ?? "" });

      // 리프레시 토큰은 httpOnly 쿠키로 전달
      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...REFRESH_TOKEN_COOKIE_OPTIONS });
      return res.json({ token: accessToken, nickname, isNewUser });

    } catch (err) {
      if (err instanceof BusinessException) {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  });

  router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
    // 쿠키에서 리프레시 토큰 추출
    const rawRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    if (!rawRefreshToken) {
      return res.status(400).json({ message: "권한이 없습니다." });
    }

    // 컨트롤러에서 JWT 유효성 검증 (만료 vs 변조 구분)
    let userId: string;
    try {
      const decoded = verifyJwt(rawRefreshToken) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      if (err instanceof TechnicalException && err.code === TechnicalExceptionCode.TOKEN_EXPIRED) {
        return res.status(400).json({ message: "세션이 만료되었습니다. 다시 로그인해주세요." });
      }
      return res.status(400).json({ message: "유효하지 않은 토큰입니다." });
    }

    try {
      // userId로 조회 + DB 해시 비교 + 토큰 로테이션
      const { accessToken, refreshToken, nickname } = await refreshTokens({ userId, rawRefreshToken });

      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...REFRESH_TOKEN_COOKIE_OPTIONS });
      return res.json({ token: accessToken, nickname });
    } catch (err) {
      // 토큰 불일치 → 400 (재시도 불필요)
      if (err instanceof BusinessException) {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  });

  router.post("/logout", async (req: Request, res: Response, next: NextFunction) => {
    const rawRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

    if (rawRefreshToken) {
      try {
        // 토큰 검증 실패해도 쿠키 제거는 진행
        const decoded = verifyJwt(rawRefreshToken) as { userId: string };
        await logout({ userId: decoded.userId });
      } catch {
        // 검증 실패는 무시
      }
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_TOKEN_COOKIE_OPTIONS.path });
    return res.json({});
  });

  return { router };
};
