import jwt from "jsonwebtoken";
import { IJwtUtil } from "../contracts/jwt-util.contract.js";
import {
  TechnicalException,
  TechnicalExceptionCode,
} from "../exceptions/technical.exception.js";

export const jwtUtil: IJwtUtil = {
  signJwt: (params) => {
    return jwt.sign(params.data, process.env.JWT_SECRET as string, {
      expiresIn: params.expiresIn,
    });
  },
  verifyJwt: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      if (err instanceof Error && err.name === "JsonWebTokenError") {
        throw new TechnicalException(
          err.message,
          TechnicalExceptionCode.JWT_VERIFY_FAILED,
        );
      }
      if (err instanceof Error && err.name === "TokenExpiredError") {
        throw new TechnicalException(
          err.message,
          TechnicalExceptionCode.TOKEN_EXPIRED,
        );
      }

      throw err;
    }
  },
};

export const signJwt: IJwtUtil["signJwt"] = jwtUtil.signJwt;
