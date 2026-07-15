import { IUserLoginLogRepo } from "../../application/contracts/user-login-log-repo.contract.js";
import { prismaClient } from "./prismaClinet.js";

export const createUserLoginLogRepo = (): IUserLoginLogRepo => {
  const createLoginLog: IUserLoginLogRepo["createLoginLog"] = async (params) => {
    await prismaClient.userLoginLog.create({
      data: {
        userId: params.userId,
        loginIp: params.loginIp,
        loggedAt: params.loggedAt,
      },
    });
  };

  return { createLoginLog };
};
