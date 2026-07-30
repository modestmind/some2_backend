import { jest, describe, test, expect } from "@jest/globals";
import { createSajuProfileService } from "./saju-profile.service.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import type { ISajuProfileRepo, SajuProfileListItem } from "../contracts/saju-profile-repo.contract.js";
import type { IUserRepo } from "../contracts/user-repo.contract.js";
import type { SajuProfile, User } from "../../generated/prisma/client.js";

const createMocks = (overrides?: {
  create?: jest.Mock<ISajuProfileRepo["create"]>;
  update?: jest.Mock<ISajuProfileRepo["update"]>;
  findSelfProfile?: jest.Mock<ISajuProfileRepo["findSelfProfile"]>;
  findOtherProfiles?: jest.Mock<ISajuProfileRepo["findOtherProfiles"]>;
  updateReportYn?: jest.Mock<ISajuProfileRepo["updateReportYn"]>;
  findUserById?: jest.Mock<IUserRepo["findUserById"]>;
}) => ({
  create: overrides?.create ?? jest.fn<ISajuProfileRepo["create"]>(),
  update: overrides?.update ?? jest.fn<ISajuProfileRepo["update"]>(),
  findSelfProfile: overrides?.findSelfProfile ?? jest.fn<ISajuProfileRepo["findSelfProfile"]>(),
  findOtherProfiles: overrides?.findOtherProfiles ?? jest.fn<ISajuProfileRepo["findOtherProfiles"]>(),
  updateReportYn: overrides?.updateReportYn ?? jest.fn<ISajuProfileRepo["updateReportYn"]>(),
  findUserById: overrides?.findUserById ?? jest.fn<IUserRepo["findUserById"]>(),
});

const buildService = (overrides?: Parameters<typeof createMocks>[0]) => {
  const mocks = createMocks(overrides);
  const { saveSajuProfile, getMyProfile, getProfileList, updateReport } =
    createSajuProfileService(
      mocks.create, mocks.update, mocks.findSelfProfile,
      mocks.findOtherProfiles, mocks.updateReportYn, mocks.findUserById,
    );
  return { mocks, saveSajuProfile, getMyProfile, getProfileList, updateReport };
};

describe("saveSajuProfile", () => {
  test("정상적인 요청으로 사주 프로필을 저장하면 저장된 프로필을 반환한다", async () => {
    const fakeUser = { userId: "1010101010", status: "Y" } as User;
    const fakeProfile = {
      sajuProfileId: BigInt(1),
      userId: "1010101010",
      isSelf: "Y",
      name: "홍길동",
      gender: "M",
      birthDate: new Date("1990-01-15"),
      calendarType: "1",
      birthTime: null,
      relationshipType: null,
      relationDuration: null,
      relationshipStatus: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SajuProfile;

    const { mocks, saveSajuProfile } = buildService({
      findUserById: jest.fn<IUserRepo["findUserById"]>().mockResolvedValue(fakeUser),
      findSelfProfile: jest.fn<ISajuProfileRepo["findSelfProfile"]>().mockResolvedValue(null),
      create: jest.fn<ISajuProfileRepo["create"]>().mockResolvedValue(fakeProfile),
    });

    const result = await saveSajuProfile({
      userId: "1010101010",
      isSelf: "Y",
      name: "홍길동",
      gender: "M",
      birthDate: "1990-01-15",
      calendarType: "solar",
      birthTime: null,
      relationshipType: null,
      relationDuration: null,
      relationshipStatus: null,
    });

    expect(result).toEqual(fakeProfile);
    expect(mocks.findUserById).toHaveBeenCalledWith("1010101010");
    expect(mocks.findSelfProfile).toHaveBeenCalledWith("1010101010");
    expect(mocks.create).toHaveBeenCalledWith({
      userId: "1010101010",
      isSelf: "Y",
      name: "홍길동",
      gender: "M",
      birthDate: new Date("1990-01-15"),
      calendarType: "1",
      birthTime: null,
      relationshipType: null,
      relationDuration: null,
      relationshipStatus: null,
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  test("is_self가 Y이고 기존 프로필이 존재하면 수정하고 반환한다", async () => {
    const fakeUser = { userId: "1010101010", status: "Y" } as User;
    const existingProfile = { sajuProfileId: BigInt(1), userId: "1010101010", isSelf: "Y" } as SajuProfile;
    const updatedProfile = {
      sajuProfileId: BigInt(1),
      userId: "1010101010",
      isSelf: "Y",
      name: "홍길동수정",
      gender: "M",
      birthDate: new Date("1990-03-20"),
      calendarType: "1",
      birthTime: null,
      relationshipType: null,
      relationDuration: null,
      relationshipStatus: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SajuProfile;

    const { mocks, saveSajuProfile } = buildService({
      findUserById: jest.fn<IUserRepo["findUserById"]>().mockResolvedValue(fakeUser),
      findSelfProfile: jest.fn<ISajuProfileRepo["findSelfProfile"]>().mockResolvedValue(existingProfile),
      update: jest.fn<ISajuProfileRepo["update"]>().mockResolvedValue(updatedProfile),
    });

    const result = await saveSajuProfile({
      userId: "1010101010",
      isSelf: "Y",
      name: "홍길동수정",
      gender: "M",
      birthDate: "1990-03-20",
      calendarType: "solar",
      birthTime: null,
      relationshipType: null,
      relationDuration: null,
      relationshipStatus: null,
    });

    expect(result).toEqual(updatedProfile);
    expect(mocks.update).toHaveBeenCalledWith({
      sajuProfileId: BigInt(1),
      isSelf: "Y",
      name: "홍길동수정",
      gender: "M",
      birthDate: new Date("1990-03-20"),
      calendarType: "1",
      birthTime: null,
      relationshipType: null,
      relationDuration: null,
      relationshipStatus: null,
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  test("존재하지 않는 userId로 요청하면 BusinessException을 던지고 저장하지 않는다", async () => {
    const { mocks, saveSajuProfile } = buildService({
      findUserById: jest.fn<IUserRepo["findUserById"]>().mockResolvedValue(null),
    });

    const params = {
      userId: "9999999999",
      isSelf: "N" as const,
      name: "홍길동",
      gender: "M" as const,
      birthDate: "1990-01-15",
      calendarType: "solar" as const,
      birthTime: null,
      relationshipType: null,
      relationDuration: null,
      relationshipStatus: null,
    };

    await expect(saveSajuProfile(params)).rejects.toThrow(BusinessException);
    await expect(saveSajuProfile(params)).rejects.toThrow("존재하지 않는 회원입니다.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  test("calendarType lunar은 '2', lunar_leap은 '3'으로 변환되어 저장된다", async () => {
    const fakeUser = { userId: "1010101010", status: "Y" } as User;
    const lunarProfile = { calendarType: "2" } as SajuProfile;
    const lunarLeapProfile = { calendarType: "3" } as SajuProfile;

    const { mocks, saveSajuProfile } = buildService({
      findUserById: jest.fn<IUserRepo["findUserById"]>().mockResolvedValue(fakeUser),
      create: jest.fn<ISajuProfileRepo["create"]>()
        .mockResolvedValueOnce(lunarProfile)
        .mockResolvedValueOnce(lunarLeapProfile),
    });

    const baseParams = {
      userId: "1010101010",
      isSelf: "N" as const,
      name: "홍길동",
      gender: "M" as const,
      birthDate: "1990-01-15",
      birthTime: null,
      relationshipType: null,
      relationDuration: null,
      relationshipStatus: null,
    };

    await saveSajuProfile({ ...baseParams, calendarType: "lunar" });
    expect(mocks.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ calendarType: "2" }));

    await saveSajuProfile({ ...baseParams, calendarType: "lunar_leap" });
    expect(mocks.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ calendarType: "3" }));
  });
});

describe("getMyProfile", () => {
  test("userId와 is_self가 Y인 프로필이 존재하면 해당 프로필을 반환한다", async () => {
    const fakeProfile = {
      sajuProfileId: BigInt(1),
      userId: "1010101010",
      isSelf: "Y",
      name: "홍길동",
      gender: "M",
      birthDate: new Date("1990-01-15"),
      calendarType: "1",
      birthTime: null,
      relationshipType: null,
      relationDuration: null,
      relationshipStatus: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SajuProfile;

    const { mocks, getMyProfile } = buildService({
      findSelfProfile: jest.fn<ISajuProfileRepo["findSelfProfile"]>().mockResolvedValue(fakeProfile),
    });

    const result = await getMyProfile("1010101010");

    expect(result).toEqual(fakeProfile);
    expect(mocks.findSelfProfile).toHaveBeenCalledWith("1010101010");
  });

  test("프로필이 존재하지 않으면 null을 반환한다", async () => {
    const { getMyProfile } = buildService({
      findSelfProfile: jest.fn<ISajuProfileRepo["findSelfProfile"]>().mockResolvedValue(null),
    });

    const result = await getMyProfile("1010101010");

    expect(result).toBeNull();
  });

  test("findSelfProfile이 reject되면 에러를 그대로 전파한다", async () => {
    const dbError = new Error("DB 연결 실패");
    const { getMyProfile } = buildService({
      findSelfProfile: jest.fn<ISajuProfileRepo["findSelfProfile"]>().mockRejectedValue(dbError),
    });

    await expect(getMyProfile("1010101010")).rejects.toThrow("DB 연결 실패");
  });
});

describe("getProfileList", () => {
  test("userId에 해당하는 is_self=N 프로필 목록을 반환한다", async () => {
    const fakeProfiles: SajuProfileListItem[] = [
      {
        sajuProfileId: BigInt(1),
        name: "김철수",
        gender: "M",
        relationshipType: "연인",
        relationDuration: "1년",
        relationshipStatus: "고민 중",
        createdAt: new Date("2024-06-01"),
        reportYn: "N",
      },
      {
        sajuProfileId: BigInt(2),
        name: "이영희",
        gender: "F",
        relationshipType: null,
        relationDuration: null,
        relationshipStatus: null,
        createdAt: new Date("2024-05-01"),
        reportYn: "Y",
      },
    ];

    const { mocks, getProfileList } = buildService({
      findOtherProfiles: jest.fn<ISajuProfileRepo["findOtherProfiles"]>().mockResolvedValue(fakeProfiles),
    });

    const result = await getProfileList("1010101010");

    expect(result).toEqual(fakeProfiles);
    expect(mocks.findOtherProfiles).toHaveBeenCalledWith("1010101010");
  });

  test("is_self=N 프로필이 없으면 빈 배열을 반환한다", async () => {
    const { mocks, getProfileList } = buildService({
      findOtherProfiles: jest.fn<ISajuProfileRepo["findOtherProfiles"]>().mockResolvedValue([]),
    });

    const result = await getProfileList("1010101010");

    expect(result).toEqual([]);
    expect(mocks.findOtherProfiles).toHaveBeenCalledWith("1010101010");
  });

  test("findOtherProfiles가 reject되면 에러를 그대로 전파한다", async () => {
    const dbError = new Error("DB 연결 실패");
    const { getProfileList } = buildService({
      findOtherProfiles: jest.fn<ISajuProfileRepo["findOtherProfiles"]>().mockRejectedValue(dbError),
    });

    await expect(getProfileList("1010101010")).rejects.toThrow("DB 연결 실패");
  });
});

describe("updateReport", () => {
  test("존재하지 않는 saju_profile_id로 요청하면 BusinessException을 던진다", async () => {
    const { updateReport } = buildService({
      updateReportYn: jest.fn<ISajuProfileRepo["updateReportYn"]>().mockResolvedValue(0),
    });

    await expect(updateReport(BigInt(999), "1010101010")).rejects.toThrow(BusinessException);
    await expect(updateReport(BigInt(999), "1010101010")).rejects.toThrow("존재하지 않는 사주 프로필입니다.");
  });

  test("유효한 sajuProfileId로 요청하면 updateReportYn을 호출한다", async () => {
    const { mocks, updateReport } = buildService({
      updateReportYn: jest.fn<ISajuProfileRepo["updateReportYn"]>().mockResolvedValue(1),
    });

    await updateReport(BigInt(1), "1010101010");

    expect(mocks.updateReportYn).toHaveBeenCalledWith(BigInt(1), "1010101010");
  });
});
