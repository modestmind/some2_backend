import { describe, it, expect, jest } from "@jest/globals";
import { createUserService } from "./user.service.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import type { IUserRepo } from "../contracts/user-repo.contract.js";

const createMocks = (overrides?: {
  findUserById?: jest.Mock<IUserRepo["findUserById"]>;
}) => ({
  findUserById: overrides?.findUserById ?? jest.fn<IUserRepo["findUserById"]>(),
});

const buildService = (overrides?: Parameters<typeof createMocks>[0]) => {
  const mocks = createMocks(overrides);
  const { getMe } = createUserService(mocks.findUserById);
  return { mocks, getMe };
};

describe("UserService - getMe", () => {
  it("사용자 ID로 사용자 정보를 조회한다", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      username: "testuser",
      password: "hashedpassword",
    };

    const { mocks, getMe } = buildService({
      findUserById: jest.fn<IUserRepo["findUserById"]>().mockResolvedValue(mockUser as any),
    });

    const result = await getMe("1");

    expect(result).toEqual(mockUser);
    expect(mocks.findUserById).toHaveBeenCalledWith("1");
  });

  it("사용자를 찾을 수 없으면 BusinessException을 던진다", async () => {
    const { mocks, getMe } = buildService({
      findUserById: jest.fn<IUserRepo["findUserById"]>().mockResolvedValue(null),
    });

    await expect(getMe("999")).rejects.toThrow(new BusinessException("존재하지 않는 유저입니다."));
    expect(mocks.findUserById).toHaveBeenCalledWith("999");
  });
});
