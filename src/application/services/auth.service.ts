import { IUserRepo } from "../contracts/user-repo.contract.js";
import { IUserLoginLogRepo } from "../contracts/user-login-log-repo.contract.js";
import { IJwtUtil } from "../../shared/contracts/jwt-util.contract.js";
import { IHashUtil } from "../../shared/contracts/hash-util.contract.js";

export const createAuthService = (
  findUserBySns: IUserRepo["findUserBySns"],
  createUser: IUserRepo["createUser"],
  findMaxUserId: IUserRepo["findMaxUserId"],
  signJwt: IJwtUtil["signJwt"],
  hashUtil: IHashUtil,
  createLoginLog: IUserLoginLogRepo["createLoginLog"],
) => {
  const login = async (params: { sns_provider_code: string; sns_user_key: string; nickname: string; loginIp: string; }) => {
    const { sns_provider_code, sns_user_key, nickname, loginIp } = params;

    // TODO. sns_user_key 유효성 검사.

    const foundUser = await findUserBySns(sns_provider_code, sns_user_key);

    let user = foundUser;
    if (!user) {
      const maxUserId = await findMaxUserId();
      const newUserId = maxUserId ? String(Number(maxUserId) + 1) : "1010101010";

      user = await createUser({
        userId: newUserId,
        snsProviderCode: sns_provider_code,
        snsUserKey: sns_user_key,
        nickname,
        status: "Y",
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
    }

    const token = signJwt({ data: { userId: user.userId }, expiresIn: 3600 });

    await createLoginLog({ userId: user.userId, loginIp, loggedAt: new Date() });

    return { token, nickname };
  };

  return { login };
};

export type AuthServiceType = ReturnType<typeof createAuthService>;
