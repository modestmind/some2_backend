import { User } from "../../generated/prisma/client.js";

type BasicUserData = {
  userId: string;
  nickname: string | null;
}

type RefreshUserData = {
  userId: string;
  nickname: string | null;
  refreshToken: string | null;
}

export interface IUserRepo {
  findUserBySns: (snsProviderCode: string, snsUserKey: string) => Promise<BasicUserData | null>;
  findUserById: (userId: string) => Promise<BasicUserData | null>;
  findUserByIdForRefresh: (userId: string) => Promise<RefreshUserData | null>;
  findMaxUserId: () => Promise<string | null>;
  createUser: (params: {
    userId: string;
    snsProviderCode?: string | null;
    snsUserKey?: string | null;
    nickname?: string | null;
    status: string;
    createdAt: Date;
    lastLoginAt: Date;
  }) => Promise<BasicUserData>;
  updateRefreshToken: (userId: string, hashedToken: string | null) => Promise<void>;
  updateLastLogin: (userId: string, lastLoginAt: Date) => Promise<void>;
}
