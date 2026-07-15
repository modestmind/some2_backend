import { IUserRepo } from "../contracts/user-repo.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";

export const createUserService = (findUserById: IUserRepo["findUserById"]) => {
  const getMe = async (userId: string) => {
    const user = await findUserById(userId);
    if (!user) {
      throw new BusinessException("존재하지 않는 유저입니다.");
    }
    return user;
  };

  return { getMe };
};

export type UserServiceType = ReturnType<typeof createUserService>;
