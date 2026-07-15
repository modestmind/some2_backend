import { Request, Response, NextFunction } from "express";
import { IJwtUtil } from "../../shared/contracts/jwt-util.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import {
  TechnicalException,
  TechnicalExceptionCode,
} from "../../shared/exceptions/technical.exception.js";

export const createAuthMiddleware = (verifyJwt: IJwtUtil["verifyJwt"]) => {
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new BusinessException("권한이 없습니다.");
    }
    const token = authHeader.replace("Bearer ", "");

    // 토큰을 검증하고 만료기간을 체크
    try {
      const decoded = verifyJwt(token) as { userId: number };
      req.userId = decoded.userId;
      next();
    } catch (err) {
      if (err instanceof TechnicalException) {
        if (err.code === TechnicalExceptionCode.JWT_VERIFY_FAILED) {
          throw new BusinessException("권한이 없습니다.");
        }
        if (err.code === TechnicalExceptionCode.TOKEN_EXPIRED) {
          throw new BusinessException(
            "세션이 삭제되었습니다. 다시 로그인 해주세요.",
          );
        }
      }

      throw err;
    }
  };

  return authMiddleware;
};

export type AuthMiddlewareType = ReturnType<typeof createAuthMiddleware>;
