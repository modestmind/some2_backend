import { jest, describe, test, expect } from "@jest/globals";
import { createAuthService } from "./auth.service.js";
import type { IUserRepo } from "../contracts/user-repo.contract.js";
import type { IUserLoginLogRepo } from "../contracts/user-login-log-repo.contract.js";
import type { IJwtUtil } from "../../shared/contracts/jwt-util.contract.js";
import type { IHashUtil } from "../../shared/contracts/hash-util.contract.js";
import type { User } from "../../generated/prisma/client.js";

describe("signIn", () => {
  // 1. SNS 정보로 기존 회원을 찾으면 JWT 토큰과 닉네임을 반환한다
  test("SNS 정보로 기존 회원을 찾으면 JWT 토큰과 닉네임을 반환한다", async () => {
    const fakeUser = { userId: "1010101010", status: "Y" } as User;
    const fakeToken = "fake-token";

    const fakeFindUserBySns = jest
      .fn<IUserRepo["findUserBySns"]>()
      .mockResolvedValue(fakeUser);
    const fakeCreateUser = jest.fn<IUserRepo["createUser"]>();
    const fakeFindMaxUserId = jest.fn<IUserRepo["findMaxUserId"]>();
    const fakeSignJwt = jest
      .fn<IJwtUtil["signJwt"]>()
      .mockReturnValue(fakeToken);
    const fakeHashUtil: IHashUtil = {
      hash: jest.fn<IHashUtil["hash"]>(),
      compare: jest.fn<IHashUtil["compare"]>(),
    };
    const fakeCreateLoginLog = jest
      .fn<IUserLoginLogRepo["createLoginLog"]>()
      .mockResolvedValue(undefined);

    const { login } = createAuthService(
      fakeFindUserBySns,
      fakeCreateUser,
      fakeFindMaxUserId,
      fakeSignJwt,
      fakeHashUtil,
      fakeCreateLoginLog,
    );

    const result = await login({
      sns_provider_code: "kakao",
      sns_user_key: "kakao_key_123",
      nickname: "테스트유저",
      loginIp: "127.0.0.1",
    });

    expect(result).toEqual({ token: fakeToken, nickname: "테스트유저" });
    expect(fakeSignJwt).toHaveBeenCalledWith({
      data: { userId: "1010101010" },
      expiresIn: 3600,
    });
    expect(fakeCreateLoginLog).toHaveBeenCalledWith({
      userId: "1010101010",
      loginIp: "127.0.0.1",
      loggedAt: expect.any(Date),
    });
  });

  // 6. 신규 회원 가입 완료 후 JWT 토큰과 닉네임을 반환한다
  test("신규 회원 가입 완료 후 JWT 토큰과 닉네임을 반환한다", async () => {
    const newUser = { userId: "1010101011", status: "Y" } as User;
    const fakeToken = "new-token";

    const fakeFindUserBySns = jest
      .fn<IUserRepo["findUserBySns"]>()
      .mockResolvedValue(null);
    const fakeCreateUser = jest
      .fn<IUserRepo["createUser"]>()
      .mockResolvedValue(newUser);
    const fakeFindMaxUserId = jest
      .fn<IUserRepo["findMaxUserId"]>()
      .mockResolvedValue("1010101010");
    const fakeSignJwt = jest
      .fn<IJwtUtil["signJwt"]>()
      .mockReturnValue(fakeToken);
    const fakeHashUtil: IHashUtil = {
      hash: jest.fn<IHashUtil["hash"]>(),
      compare: jest.fn<IHashUtil["compare"]>(),
    };
    const fakeCreateLoginLog = jest
      .fn<IUserLoginLogRepo["createLoginLog"]>()
      .mockResolvedValue(undefined);

    const { login } = createAuthService(
      fakeFindUserBySns,
      fakeCreateUser,
      fakeFindMaxUserId,
      fakeSignJwt,
      fakeHashUtil,
      fakeCreateLoginLog,
    );

    const result = await login({
      sns_provider_code: "kakao",
      sns_user_key: "kakao_key_456",
      nickname: "신규유저",
      loginIp: "192.168.0.1",
    });

    expect(result).toEqual({ token: fakeToken, nickname: "신규유저" });
    expect(fakeSignJwt).toHaveBeenCalledWith({
      data: { userId: "1010101011" },
      expiresIn: 3600,
    });
    expect(fakeCreateLoginLog).toHaveBeenCalledWith({
      userId: "1010101011",
      loginIp: "192.168.0.1",
      loggedAt: expect.any(Date),
    });
  });

  // 9. createUser가 reject되면 에러를 전파하고 JWT를 발급하지 않는다
  test("createUser가 reject되면 에러를 전파하고 JWT를 발급하지 않는다", async () => {
    const dbError = new Error("DB 저장 실패");

    const fakeFindUserBySns = jest
      .fn<IUserRepo["findUserBySns"]>()
      .mockResolvedValue(null);
    const fakeCreateUser = jest
      .fn<IUserRepo["createUser"]>()
      .mockRejectedValue(dbError);
    const fakeFindMaxUserId = jest
      .fn<IUserRepo["findMaxUserId"]>()
      .mockResolvedValue(null);
    const fakeSignJwt = jest.fn<IJwtUtil["signJwt"]>();
    const fakeHashUtil: IHashUtil = {
      hash: jest.fn<IHashUtil["hash"]>(),
      compare: jest.fn<IHashUtil["compare"]>(),
    };
    const fakeCreateLoginLog = jest.fn<IUserLoginLogRepo["createLoginLog"]>();

    const { login } = createAuthService(
      fakeFindUserBySns,
      fakeCreateUser,
      fakeFindMaxUserId,
      fakeSignJwt,
      fakeHashUtil,
      fakeCreateLoginLog,
    );

    await expect(
      login({
        sns_provider_code: "kakao",
        sns_user_key: "kakao_key_123",
        nickname: "신규유저",
        loginIp: "127.0.0.1",
      }),
    ).rejects.toThrow("DB 저장 실패");
    expect(fakeSignJwt).not.toHaveBeenCalled();
    expect(fakeCreateLoginLog).not.toHaveBeenCalled();
  });

  // 10. signJwt가 예외를 발생하면 해당 에러를 전파하고 로그인 로그를 저장하지 않는다
  test("signJwt가 예외를 발생하면 해당 에러를 전파하고 로그인 로그를 저장하지 않는다", async () => {
    const fakeUser = { userId: "1010101010", status: "Y" } as User;
    const jwtError = new Error("JWT 서명 실패");

    const fakeFindUserBySns = jest
      .fn<IUserRepo["findUserBySns"]>()
      .mockResolvedValue(fakeUser);
    const fakeCreateUser = jest.fn<IUserRepo["createUser"]>();
    const fakeFindMaxUserId = jest.fn<IUserRepo["findMaxUserId"]>();
    const fakeSignJwt = jest
      .fn<IJwtUtil["signJwt"]>()
      .mockImplementation(() => {
        throw jwtError;
      });
    const fakeHashUtil: IHashUtil = {
      hash: jest.fn<IHashUtil["hash"]>(),
      compare: jest.fn<IHashUtil["compare"]>(),
    };
    const fakeCreateLoginLog = jest.fn<IUserLoginLogRepo["createLoginLog"]>();

    const { login } = createAuthService(
      fakeFindUserBySns,
      fakeCreateUser,
      fakeFindMaxUserId,
      fakeSignJwt,
      fakeHashUtil,
      fakeCreateLoginLog,
    );

    await expect(
      login({
        sns_provider_code: "kakao",
        sns_user_key: "kakao_key_123",
        nickname: "테스트유저",
        loginIp: "127.0.0.1",
      }),
    ).rejects.toThrow("JWT 서명 실패");
    expect(fakeCreateLoginLog).not.toHaveBeenCalled();
  });

  // 11. createLoginLog가 reject되면 에러를 전파한다
  test("createLoginLog가 reject되면 에러를 전파한다", async () => {
    const fakeUser = { userId: "1010101010", status: "Y" } as User;
    const fakeToken = "fake-token";
    const logError = new Error("로그 저장 실패");

    const fakeFindUserBySns = jest
      .fn<IUserRepo["findUserBySns"]>()
      .mockResolvedValue(fakeUser);
    const fakeCreateUser = jest.fn<IUserRepo["createUser"]>();
    const fakeFindMaxUserId = jest.fn<IUserRepo["findMaxUserId"]>();
    const fakeSignJwt = jest
      .fn<IJwtUtil["signJwt"]>()
      .mockReturnValue(fakeToken);
    const fakeHashUtil: IHashUtil = {
      hash: jest.fn<IHashUtil["hash"]>(),
      compare: jest.fn<IHashUtil["compare"]>(),
    };
    const fakeCreateLoginLog = jest
      .fn<IUserLoginLogRepo["createLoginLog"]>()
      .mockRejectedValue(logError);

    const { login } = createAuthService(
      fakeFindUserBySns,
      fakeCreateUser,
      fakeFindMaxUserId,
      fakeSignJwt,
      fakeHashUtil,
      fakeCreateLoginLog,
    );

    await expect(
      login({
        sns_provider_code: "kakao",
        sns_user_key: "kakao_key_123",
        nickname: "테스트유저",
        loginIp: "127.0.0.1",
      }),
    ).rejects.toThrow("로그 저장 실패");
  });
});
