import { jest, describe, test, expect } from "@jest/globals";
import { createAuthService } from "./auth.service.js";
import type { IUserRepo } from "../contracts/user-repo.contract.js";
import type { IUserLoginLogRepo } from "../contracts/user-login-log-repo.contract.js";
import type { IJwtUtil } from "../../shared/contracts/jwt-util.contract.js";
import type { IHashUtil } from "../../shared/contracts/hash-util.contract.js";
import type { ISha256Util } from "../../shared/contracts/sha256-util.contract.js";
import type { IGoogleAuthUtil } from "../../shared/contracts/google-auth-util.contract.js";
import type { IKakaoAuthUtil } from "../../shared/contracts/kakao-auth-util.contract.js";
import type { User } from "../../generated/prisma/client.js";
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "../../shared/config.js";

const createMocks = (overrides?: {
  findUserBySns?: jest.Mock<IUserRepo["findUserBySns"]>;
  createUser?: jest.Mock<IUserRepo["createUser"]>;
  findMaxUserId?: jest.Mock<IUserRepo["findMaxUserId"]>;
  findUserByIdForRefresh?: jest.Mock<IUserRepo["findUserByIdForRefresh"]>;
  signJwt?: jest.Mock<IJwtUtil["signJwt"]>;
  updateRefreshToken?: jest.Mock<IUserRepo["updateRefreshToken"]>;
  updateLastLogin?: jest.Mock<IUserRepo["updateLastLogin"]>;
  createLoginLog?: jest.Mock<IUserLoginLogRepo["createLoginLog"]>;
  googleAuthUtil?: IGoogleAuthUtil;
  kakaoAuthUtil?: IKakaoAuthUtil;
}) => {
  const fakeHashUtil: IHashUtil = {
    hash: jest.fn<IHashUtil["hash"]>(),
    compare: jest.fn<IHashUtil["compare"]>(),
  };
  const fakeSha256Util: ISha256Util = {
    hash: jest.fn<ISha256Util["hash"]>().mockReturnValue("hashed-refresh-token"),
  };
  const fakeGoogleAuthUtil: IGoogleAuthUtil = overrides?.googleAuthUtil ?? {
    verifyIdToken: jest.fn<IGoogleAuthUtil["verifyIdToken"]>().mockResolvedValue({ name: "테스트유저", googleId: "google_key_123" }),
  };
  const fakeKakaoAuthUtil: IKakaoAuthUtil = overrides?.kakaoAuthUtil ?? {
    getUserInfo: jest.fn<IKakaoAuthUtil["getUserInfo"]>().mockResolvedValue({ name: "테스트유저", kakaoId: "kakao_key_123" }),
  };

  return {
    findUserBySns: overrides?.findUserBySns ?? jest.fn<IUserRepo["findUserBySns"]>(),
    createUser: overrides?.createUser ?? jest.fn<IUserRepo["createUser"]>(),
    findMaxUserId: overrides?.findMaxUserId ?? jest.fn<IUserRepo["findMaxUserId"]>(),
    findUserByIdForRefresh: overrides?.findUserByIdForRefresh ?? jest.fn<IUserRepo["findUserByIdForRefresh"]>(),
    signJwt: overrides?.signJwt ?? jest.fn<IJwtUtil["signJwt"]>().mockReturnValueOnce("fake-access-token").mockReturnValueOnce("fake-refresh-token"),
    hashUtil: fakeHashUtil,
    sha256Util: fakeSha256Util,
    updateRefreshToken: overrides?.updateRefreshToken ?? jest.fn<IUserRepo["updateRefreshToken"]>().mockResolvedValue(undefined),
    updateLastLogin: overrides?.updateLastLogin ?? jest.fn<IUserRepo["updateLastLogin"]>().mockResolvedValue(undefined),
    createLoginLog: overrides?.createLoginLog ?? jest.fn<IUserLoginLogRepo["createLoginLog"]>().mockResolvedValue(undefined),
    googleAuthUtil: fakeGoogleAuthUtil,
    kakaoAuthUtil: fakeKakaoAuthUtil,
  };
};

const buildService = (overrides?: Parameters<typeof createMocks>[0]) => {
  const mocks = createMocks(overrides);
  const { login, refreshTokens, logout } = createAuthService(
    mocks.findUserBySns, mocks.createUser, mocks.findMaxUserId,
    mocks.findUserByIdForRefresh, mocks.signJwt, mocks.hashUtil, mocks.sha256Util,
    mocks.createLoginLog, mocks.updateRefreshToken, mocks.updateLastLogin,
    mocks.googleAuthUtil, mocks.kakaoAuthUtil,
  );
  return { mocks, login, refreshTokens, logout };
};

describe("login", () => {
  test("구글 기존 회원 로그인 시 액세스/리프레시 토큰과 닉네임을 반환한다", async () => {
    const fakeUser = { userId: "1010101010", status: "Y", nickname: "테스트유저" } as User;
    const { mocks, login } = buildService({
      findUserBySns: jest.fn<IUserRepo["findUserBySns"]>().mockResolvedValue(fakeUser),
    });

    const result = await login({
      sns_provider_code: "google",
      credential: "google_id_token",
      loginIp: "127.0.0.1",
    });

    expect(result).toEqual({ accessToken: "fake-access-token", refreshToken: "fake-refresh-token", nickname: "테스트유저" });
    expect(mocks.signJwt).toHaveBeenNthCalledWith(1, { data: { userId: "1010101010" }, expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    expect(mocks.signJwt).toHaveBeenNthCalledWith(2, { data: { userId: "1010101010" }, expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    expect(mocks.sha256Util.hash).toHaveBeenCalledWith("fake-refresh-token");
    expect(mocks.updateRefreshToken).toHaveBeenCalledWith("1010101010", "hashed-refresh-token");
    expect(mocks.createLoginLog).toHaveBeenCalledWith({ userId: "1010101010", loginIp: "127.0.0.1", loggedAt: expect.any(Date) });
  });

  test("구글 신규 회원 가입 완료 후 액세스/리프레시 토큰과 닉네임을 반환한다", async () => {
    const newUser = { userId: "1010101011", status: "Y", nickname: "신규유저" } as User;
    const { mocks, login } = buildService({
      findUserBySns: jest.fn<IUserRepo["findUserBySns"]>().mockResolvedValue(null),
      createUser: jest.fn<IUserRepo["createUser"]>().mockResolvedValue(newUser),
      findMaxUserId: jest.fn<IUserRepo["findMaxUserId"]>().mockResolvedValue("1010101010"),
      googleAuthUtil: {
        verifyIdToken: jest.fn<IGoogleAuthUtil["verifyIdToken"]>().mockResolvedValue({ name: "신규유저", googleId: "google_key_456" }),
      },
    });

    const result = await login({
      sns_provider_code: "google",
      credential: "google_id_token",
      loginIp: "192.168.0.1",
    });

    expect(result).toEqual({ accessToken: "fake-access-token", refreshToken: "fake-refresh-token", nickname: "신규유저" });
    expect(mocks.signJwt).toHaveBeenNthCalledWith(1, { data: { userId: "1010101011" }, expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    expect(mocks.signJwt).toHaveBeenNthCalledWith(2, { data: { userId: "1010101011" }, expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  });

  test("createUser가 reject되면 에러를 전파하고 JWT를 발급하지 않는다", async () => {
    const dbError = new Error("DB 저장 실패");
    const { mocks, login } = buildService({
      findUserBySns: jest.fn<IUserRepo["findUserBySns"]>().mockResolvedValue(null),
      createUser: jest.fn<IUserRepo["createUser"]>().mockRejectedValue(dbError),
      findMaxUserId: jest.fn<IUserRepo["findMaxUserId"]>().mockResolvedValue(null),
    });

    await expect(login({ sns_provider_code: "google", credential: "google_id_token", loginIp: "127.0.0.1" })).rejects.toThrow("DB 저장 실패");
    expect(mocks.signJwt).not.toHaveBeenCalled();
    expect(mocks.createLoginLog).not.toHaveBeenCalled();
  });

  test("signJwt가 예외를 발생하면 해당 에러를 전파하고 로그인 로그를 저장하지 않는다", async () => {
    const fakeUser = { userId: "1010101010", status: "Y" } as User;
    const jwtError = new Error("JWT 서명 실패");
    const { mocks, login } = buildService({
      findUserBySns: jest.fn<IUserRepo["findUserBySns"]>().mockResolvedValue(fakeUser),
      signJwt: jest.fn<IJwtUtil["signJwt"]>().mockImplementation(() => { throw jwtError; }),
    });

    await expect(login({ sns_provider_code: "google", credential: "google_id_token", loginIp: "127.0.0.1" })).rejects.toThrow("JWT 서명 실패");
    expect(mocks.createLoginLog).not.toHaveBeenCalled();
  });

  test("createLoginLog가 reject되면 에러를 전파한다", async () => {
    const fakeUser = { userId: "1010101010", status: "Y" } as User;
    const logError = new Error("로그 저장 실패");
    const { login } = buildService({
      findUserBySns: jest.fn<IUserRepo["findUserBySns"]>().mockResolvedValue(fakeUser),
      createLoginLog: jest.fn<IUserLoginLogRepo["createLoginLog"]>().mockRejectedValue(logError),
    });

    await expect(login({ sns_provider_code: "google", credential: "google_id_token", loginIp: "127.0.0.1" })).rejects.toThrow("로그 저장 실패");
  });
});

describe("refreshTokens", () => {
  test("유효한 리프레시 토큰이면 새 액세스/리프레시 토큰과 닉네임을 반환하고 DB를 업데이트한다", async () => {
    const fakeUser = { userId: "1010101010", nickname: "테스트유저", refreshToken: "hashed-refresh-token" } as User;
    const { mocks, refreshTokens } = buildService({
      findUserByIdForRefresh: jest.fn<IUserRepo["findUserByIdForRefresh"]>().mockResolvedValue(fakeUser),
    });

    const result = await refreshTokens({ userId: "1010101010", rawRefreshToken: "raw-refresh-token" });

    expect(result).toEqual({ accessToken: "fake-access-token", refreshToken: "fake-refresh-token", nickname: "테스트유저" });
    expect(mocks.sha256Util.hash).toHaveBeenCalledWith("raw-refresh-token");
    expect(mocks.updateRefreshToken).toHaveBeenCalledWith("1010101010", "hashed-refresh-token");
  });

  test("DB 토큰과 불일치하면 BusinessException을 던진다", async () => {
    const fakeUser = { userId: "1010101010", refreshToken: "other-hashed-token" } as User;
    const { mocks, refreshTokens } = buildService({
      findUserByIdForRefresh: jest.fn<IUserRepo["findUserByIdForRefresh"]>().mockResolvedValue(fakeUser),
    });

    await expect(refreshTokens({ userId: "1010101010", rawRefreshToken: "raw-refresh-token" })).rejects.toThrow("유효하지 않은 토큰입니다.");
    expect(mocks.updateRefreshToken).not.toHaveBeenCalled();
  });

  test("존재하지 않는 userId면 BusinessException을 던진다", async () => {
    const { refreshTokens } = buildService({
      findUserByIdForRefresh: jest.fn<IUserRepo["findUserByIdForRefresh"]>().mockResolvedValue(null),
    });

    await expect(
      refreshTokens({ userId: "9999999999", rawRefreshToken: "any-token" })
    ).rejects.toThrow("존재하지 않는 유저입니다.");
  });

  test("DB에 저장된 리프레시 토큰이 null이면 BusinessException을 던진다", async () => {
    const fakeUser = { userId: "1010101010", refreshToken: null } as User;
    const { refreshTokens } = buildService({
      findUserByIdForRefresh: jest.fn<IUserRepo["findUserByIdForRefresh"]>().mockResolvedValue(fakeUser),
    });

    await expect(
      refreshTokens({ userId: "1010101010", rawRefreshToken: "any-token" })
    ).rejects.toThrow("유효하지 않은 토큰입니다.");
  });
});

describe("logout", () => {
  test("로그아웃 시 DB의 리프레시 토큰을 null로 업데이트한다", async () => {
    const { mocks, logout } = buildService();

    await logout({ userId: "1010101010" });

    expect(mocks.updateRefreshToken).toHaveBeenCalledWith("1010101010", null);
  });
});
