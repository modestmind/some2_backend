import { Request, Response, NextFunction } from "express";
import { AuthException } from "../../shared/exceptions/auth.exception.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import { TechnicalException } from "../../shared/exceptions/technical.exception.js";

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  throw new BusinessException("존재하지 않는 api 요청입니다.");
};

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AuthException) {
    res.status(401).json({ message: err.message });
  } else if (err instanceof BusinessException) {
    res.status(400).json({ message: err.message });
  } else if (err instanceof TechnicalException) {
    res.status(500).json({ message: "알 수 없는 에러가 발생했어요" });
    console.error(err); // 개발자에게 전송(Sentry)
  } else {
    res.status(500).json({ message: "알 수 없는 에러가 발생했어요" });
    console.error(err); // 개발자에게 전송(Sentry)
  }
};
