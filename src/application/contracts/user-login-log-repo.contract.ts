export interface IUserLoginLogRepo {
  createLoginLog: (params: {
    userId: string;
    loginIp: string;
    loggedAt: Date;
  }) => Promise<void>;
}
