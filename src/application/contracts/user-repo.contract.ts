import { User } from "../../generated/prisma/client.js";

export interface IUserRepo {
  findUserBySns: (snsProviderCode: string, snsUserKey: string) => Promise<User | null>;
  findUserById: (userId: string) => Promise<User | null>;
  findMaxUserId: () => Promise<string | null>;
  createUser: (params: {
    userId: string;
    snsProviderCode?: string | null;
    snsUserKey?: string | null;
    nickname?: string | null;
    status: string;
    createdAt: Date;
    lastLoginAt: Date;
  }) => Promise<User>;
}
