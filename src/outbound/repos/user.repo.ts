import { IUserRepo } from "../../application/contracts/user-repo.contract.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import {
  TechnicalException,
  TechnicalExceptionCode,
} from "../../shared/exceptions/technical.exception.js";
import { prismaClient } from "./prismaClinet.js";

export const createUserRepo = (): IUserRepo => {
  const findUserBySns: IUserRepo["findUserBySns"] = async (
    snsProviderCode: string,
    snsUserKey: string,
  ) => {
    const foundUser = await prismaClient.user.findFirst({
      where: { snsProviderCode, snsUserKey },
    });
    return foundUser;
  };

  const findUserById: IUserRepo["findUserById"] = async (userId: string) => {
    const foundUser = await prismaClient.user.findUnique({
      where: { userId },
    });
    return foundUser;
  };

  const findMaxUserId: IUserRepo["findMaxUserId"] = async () => {
    const lastUser = await prismaClient.user.findFirst({
      orderBy: { userId: "desc" },
      select: { userId: true },
    });
    return lastUser?.userId ?? null;
  };

  const createUser: IUserRepo["createUser"] = async (params) => {
    try {
      const newUser = await prismaClient.user.create({
        data: {
          userId: params.userId,
          snsProviderCode: params.snsProviderCode,
          snsUserKey: params.snsUserKey,
          nickname: params.nickname,
          status: params.status,
          createdAt: params.createdAt,
          lastLoginAt: params.lastLoginAt,
        },
      });
      return newUser;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          throw new TechnicalException(
            err.message,
            TechnicalExceptionCode.EMAIL_DUPLICATED,
          );
        }
      }
      throw err;
    }
  };

  return { findUserBySns, findUserById, findMaxUserId, createUser };
};
