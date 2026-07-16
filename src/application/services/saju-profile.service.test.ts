import { jest, describe, test, expect } from "@jest/globals";
import { createSajuProfileService } from "./saju-profile.service.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import type { ISajuProfileRepo, SajuProfileListItem } from "../contracts/saju-profile-repo.contract.js";
import type { IUserRepo } from "../contracts/user-repo.contract.js";
import type { SajuProfile, User } from "../../generated/prisma/client.js";

describe("saveSajuProfile", () => {
  test("정상적인 요청으로 사주 프로필을 저장하면 저장된 프로필을 반환한다", async () => {
    // 가짜 데이터 준비
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

    const fakeFindUserById = jest
      .fn<IUserRepo["findUserById"]>()
      .mockResolvedValue(fakeUser);
    const fakeFindSelfProfile = jest
      .fn<ISajuProfileRepo["findSelfProfile"]>()
      .mockResolvedValue(null);
    const fakeCreate = jest
      .fn<ISajuProfileRepo["create"]>()
      .mockResolvedValue(fakeProfile);
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();

    // 서비스 실행
    const { saveSajuProfile } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      jest.fn<ISajuProfileRepo["findOtherProfiles"]>(),
      jest.fn<ISajuProfileRepo["updateReportYn"]>(),
      fakeFindUserById,
    );
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

    // 검증
    expect(result).toEqual(fakeProfile);
    expect(fakeFindUserById).toHaveBeenCalledWith("1010101010");
    expect(fakeFindSelfProfile).toHaveBeenCalledWith("1010101010");
    expect(fakeCreate).toHaveBeenCalledWith({
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
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test("is_self가 Y이고 기존 프로필이 존재하면 수정하고 반환한다", async () => {
    // 가짜 데이터 준비
    const fakeUser = { userId: "1010101010", status: "Y" } as User;
    const existingProfile = {
      sajuProfileId: BigInt(1),
      userId: "1010101010",
      isSelf: "Y",
    } as SajuProfile;
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

    const fakeFindUserById = jest
      .fn<IUserRepo["findUserById"]>()
      .mockResolvedValue(fakeUser);
    const fakeFindSelfProfile = jest
      .fn<ISajuProfileRepo["findSelfProfile"]>()
      .mockResolvedValue(existingProfile);
    const fakeCreate = jest.fn<ISajuProfileRepo["create"]>();
    const fakeUpdate = jest
      .fn<ISajuProfileRepo["update"]>()
      .mockResolvedValue(updatedProfile);

    // 서비스 실행
    const { saveSajuProfile } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      jest.fn<ISajuProfileRepo["findOtherProfiles"]>(),
      jest.fn<ISajuProfileRepo["updateReportYn"]>(),
      fakeFindUserById,
    );
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

    // 검증
    expect(result).toEqual(updatedProfile);
    expect(fakeUpdate).toHaveBeenCalledWith({
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
    expect(fakeCreate).not.toHaveBeenCalled();
  });

  test("존재하지 않는 userId로 요청하면 BusinessException을 던지고 저장하지 않는다", async () => {
    const fakeFindUserById = jest
      .fn<IUserRepo["findUserById"]>()
      .mockResolvedValue(null);
    const fakeFindSelfProfile = jest.fn<ISajuProfileRepo["findSelfProfile"]>();
    const fakeCreate = jest.fn<ISajuProfileRepo["create"]>();
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();

    const { saveSajuProfile } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      jest.fn<ISajuProfileRepo["findOtherProfiles"]>(),
      jest.fn<ISajuProfileRepo["updateReportYn"]>(),
      fakeFindUserById,
    );

    await expect(
      saveSajuProfile({
        userId: "9999999999",
        isSelf: "N",
        name: "홍길동",
        gender: "M",
        birthDate: "1990-01-15",
        calendarType: "solar",
        birthTime: null,
        relationshipType: null,
        relationDuration: null,
        relationshipStatus: null,
      }),
    ).rejects.toThrow(BusinessException);
    await expect(
      saveSajuProfile({
        userId: "9999999999",
        isSelf: "N",
        name: "홍길동",
        gender: "M",
        birthDate: "1990-01-15",
        calendarType: "solar",
        birthTime: null,
        relationshipType: null,
        relationDuration: null,
        relationshipStatus: null,
      }),
    ).rejects.toThrow("존재하지 않는 회원입니다.");
    expect(fakeCreate).not.toHaveBeenCalled();
  });

  test("calendarType lunar은 '2', lunar_leap은 '3'으로 변환되어 저장된다", async () => {
    const fakeUser = { userId: "1010101010", status: "Y" } as User;
    const fakeFindUserById = jest
      .fn<IUserRepo["findUserById"]>()
      .mockResolvedValue(fakeUser);
    const fakeFindSelfProfile = jest.fn<ISajuProfileRepo["findSelfProfile"]>();
    const lunarProfile = { calendarType: "2" } as SajuProfile;
    const lunarLeapProfile = { calendarType: "3" } as SajuProfile;
    const fakeCreate = jest
      .fn<ISajuProfileRepo["create"]>()
      .mockResolvedValueOnce(lunarProfile)
      .mockResolvedValueOnce(lunarLeapProfile);
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();

    const { saveSajuProfile } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      jest.fn<ISajuProfileRepo["findOtherProfiles"]>(),
      jest.fn<ISajuProfileRepo["updateReportYn"]>(),
      fakeFindUserById,
    );
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

    // lunar → "2" 검증
    await saveSajuProfile({ ...baseParams, calendarType: "lunar" });
    expect(fakeCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ calendarType: "2" }));

    // lunar_leap → "3" 검증
    await saveSajuProfile({ ...baseParams, calendarType: "lunar_leap" });
    expect(fakeCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({ calendarType: "3" }));
  });
});

describe("getMyProfile", () => {
  test("userId와 is_self가 Y인 프로필이 존재하면 해당 프로필을 반환한다", async () => {
    // 가짜 데이터 준비
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

    const fakeFindSelfProfile = jest
      .fn<ISajuProfileRepo["findSelfProfile"]>()
      .mockResolvedValue(fakeProfile);
    const fakeCreate = jest.fn<ISajuProfileRepo["create"]>();
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();
    const fakeFindUserById = jest.fn<IUserRepo["findUserById"]>();

    // 서비스 실행
    const { getMyProfile } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      jest.fn<ISajuProfileRepo["findOtherProfiles"]>(),
      jest.fn<ISajuProfileRepo["updateReportYn"]>(),
      fakeFindUserById,
    );
    const result = await getMyProfile("1010101010");

    // 검증
    expect(result).toEqual(fakeProfile);
    expect(fakeFindSelfProfile).toHaveBeenCalledWith("1010101010");
  });

  test("프로필이 존재하지 않으면 null을 반환한다", async () => {
    const fakeFindSelfProfile = jest
      .fn<ISajuProfileRepo["findSelfProfile"]>()
      .mockResolvedValue(null);
    const fakeCreate = jest.fn<ISajuProfileRepo["create"]>();
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();
    const fakeFindUserById = jest.fn<IUserRepo["findUserById"]>();

    const { getMyProfile } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      jest.fn<ISajuProfileRepo["findOtherProfiles"]>(),
      jest.fn<ISajuProfileRepo["updateReportYn"]>(),
      fakeFindUserById,
    );
    const result = await getMyProfile("1010101010");

    expect(result).toBeNull();
  });

  test("findSelfProfile이 reject되면 에러를 그대로 전파한다", async () => {
    // 가짜 데이터 준비
    const dbError = new Error("DB 연결 실패");

    const fakeFindSelfProfile = jest
      .fn<ISajuProfileRepo["findSelfProfile"]>()
      .mockRejectedValue(dbError);
    const fakeCreate = jest.fn<ISajuProfileRepo["create"]>();
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();
    const fakeFindUserById = jest.fn<IUserRepo["findUserById"]>();

    // 서비스 실행 및 검증
    const { getMyProfile } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      jest.fn<ISajuProfileRepo["findOtherProfiles"]>(),
      jest.fn<ISajuProfileRepo["updateReportYn"]>(),
      fakeFindUserById,
    );

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

    const fakeFindOtherProfiles = jest
      .fn<ISajuProfileRepo["findOtherProfiles"]>()
      .mockResolvedValue(fakeProfiles);
    const fakeCreate = jest.fn<ISajuProfileRepo["create"]>();
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();
    const fakeFindSelfProfile = jest.fn<ISajuProfileRepo["findSelfProfile"]>();
    const fakeFindUserById = jest.fn<IUserRepo["findUserById"]>();

    const { getProfileList } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      fakeFindOtherProfiles,
      jest.fn<ISajuProfileRepo["updateReportYn"]>(),
      fakeFindUserById,
    );
    const result = await getProfileList("1010101010");

    expect(result).toEqual(fakeProfiles);
    expect(fakeFindOtherProfiles).toHaveBeenCalledWith("1010101010");
  });

  test("is_self=N 프로필이 없으면 빈 배열을 반환한다", async () => {
    const fakeFindOtherProfiles = jest
      .fn<ISajuProfileRepo["findOtherProfiles"]>()
      .mockResolvedValue([]);
    const fakeCreate = jest.fn<ISajuProfileRepo["create"]>();
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();
    const fakeFindSelfProfile = jest.fn<ISajuProfileRepo["findSelfProfile"]>();
    const fakeFindUserById = jest.fn<IUserRepo["findUserById"]>();

    const { getProfileList } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      fakeFindOtherProfiles,
      jest.fn<ISajuProfileRepo["updateReportYn"]>(),
      fakeFindUserById,
    );
    const result = await getProfileList("1010101010");

    expect(result).toEqual([]);
    expect(fakeFindOtherProfiles).toHaveBeenCalledWith("1010101010");
  });

  test("findOtherProfiles가 reject되면 에러를 그대로 전파한다", async () => {
    const dbError = new Error("DB 연결 실패");
    const fakeFindOtherProfiles = jest
      .fn<ISajuProfileRepo["findOtherProfiles"]>()
      .mockRejectedValue(dbError);
    const fakeCreate = jest.fn<ISajuProfileRepo["create"]>();
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();
    const fakeFindSelfProfile = jest.fn<ISajuProfileRepo["findSelfProfile"]>();
    const fakeFindUserById = jest.fn<IUserRepo["findUserById"]>();

    const { getProfileList } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      fakeFindOtherProfiles,
      jest.fn<ISajuProfileRepo["updateReportYn"]>(),
      fakeFindUserById,
    );

    await expect(getProfileList("1010101010")).rejects.toThrow("DB 연결 실패");
  });
});

describe("updateReport", () => {
  test("존재하지 않는 saju_profile_id로 요청하면 BusinessException을 던진다", async () => {
    // 업데이트된 레코드 없음 (count = 0)
    const fakeUpdateReportYn = jest
      .fn<ISajuProfileRepo["updateReportYn"]>()
      .mockResolvedValue(0);
    const fakeCreate = jest.fn<ISajuProfileRepo["create"]>();
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();
    const fakeFindSelfProfile = jest.fn<ISajuProfileRepo["findSelfProfile"]>();
    const fakeFindOtherProfiles = jest.fn<ISajuProfileRepo["findOtherProfiles"]>();
    const fakeFindUserById = jest.fn<IUserRepo["findUserById"]>();

    const { updateReport } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      fakeFindOtherProfiles,
      fakeUpdateReportYn,
      fakeFindUserById,
    );

    await expect(updateReport(BigInt(999), "1010101010")).rejects.toThrow(BusinessException);
    await expect(updateReport(BigInt(999), "1010101010")).rejects.toThrow("존재하지 않는 사주 프로필입니다.");
  });

  test("유효한 sajuProfileId로 요청하면 updateReportYn을 호출한다", async () => {
    // Mock 준비
    const fakeUpdateReportYn = jest
      .fn<ISajuProfileRepo["updateReportYn"]>()
      .mockResolvedValue(1);
    const fakeCreate = jest.fn<ISajuProfileRepo["create"]>();
    const fakeUpdate = jest.fn<ISajuProfileRepo["update"]>();
    const fakeFindSelfProfile = jest.fn<ISajuProfileRepo["findSelfProfile"]>();
    const fakeFindOtherProfiles = jest.fn<ISajuProfileRepo["findOtherProfiles"]>();
    const fakeFindUserById = jest.fn<IUserRepo["findUserById"]>();

    // 서비스 실행
    const { updateReport } = createSajuProfileService(
      fakeCreate,
      fakeUpdate,
      fakeFindSelfProfile,
      fakeFindOtherProfiles,
      fakeUpdateReportYn,
      fakeFindUserById,
    );
    await updateReport(BigInt(1), "1010101010");

    // 검증
    expect(fakeUpdateReportYn).toHaveBeenCalledWith(BigInt(1), "1010101010");
  });
});
