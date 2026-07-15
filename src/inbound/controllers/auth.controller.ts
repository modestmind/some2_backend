import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthServiceType } from "../../application/services/auth.service.js";
import { loginDataSchema } from "../schemas/auth.schemas.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import { IJwtUtil } from "../../shared/contracts/jwt-util.contract.js";

export const createAuthController = (
  login: AuthServiceType["login"],
  verifyJwt: IJwtUtil["verifyJwt"],
) => {
  const router = Router();

  router.post(
    "/login",
    async (req: Request, res: Response, next: NextFunction) => {
      const { success, data, error } = loginDataSchema.safeParse(req.body);
      if (success === false) {
        throw new BusinessException(z.prettifyError(error));
      }

      const { token, nickname } = await login({ ...data, loginIp: req.ip ?? "" });

      return res.json({ token, nickname });
    },
  );

  router.get("/verify", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "권한이 없습니다." });
    }
    const token = authHeader.replace("Bearer ", "");

    try {
      verifyJwt(token);
      return res.status(200).json({});
    } catch (err) {
      return res.status(401).json({ message: "권한이 없습니다." });
    }
  });

  router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
    return res.json({});
  });

  return { router };
};
