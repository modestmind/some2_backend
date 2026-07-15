import { ISajuProfileRepo } from "../contracts/saju-profile-repo.contract.js";
import { IUserRepo } from "../contracts/user-repo.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";

const CALENDAR_TYPE_MAP: Record<string, string> = {
  solar: "1",
  lunar: "2",
  lunar_leap: "3",
};

export const createSajuProfileService = (
  create: ISajuProfileRepo["create"],
  update: ISajuProfileRepo["update"],
  findSelfProfile: ISajuProfileRepo["findSelfProfile"],
  findUserById: IUserRepo["findUserById"],
) => {
  // 사주 프로필 저장 (is_self Y: 기존 본인 프로필 수정 또는 신규 등록, N: 무조건 신규 등록)
  const saveSajuProfile = async (params: {
    userId: string;
    isSelf: "Y" | "N";
    name: string;
    gender: "F" | "M";
    birthDate: string;
    calendarType: "solar" | "lunar" | "lunar_leap";
    birthTime: string | null;
    relationshipType: string | null;
    relationDuration: string | null;
    relationshipStatus: string | null;
  }) => {
    // 회원 존재 확인
    const user = await findUserById(params.userId);
    if (!user) {
      throw new BusinessException("존재하지 않는 회원입니다.");
    }

    // calendar_type 변환 (API 값 → DB 저장값)
    const calendarType = CALENDAR_TYPE_MAP[params.calendarType];

    // 생년월일 변환
    const birthDate = new Date(params.birthDate);

    // 출생 시간 변환 (없는 경우 null)
    const birthTime = params.birthTime
      ? new Date(`1970-01-01T${params.birthTime}`)
      : null;

    const profileData = {
      isSelf: params.isSelf,
      name: params.name,
      gender: params.gender,
      birthDate,
      calendarType,
      birthTime,
      relationshipType: params.relationshipType,
      relationDuration: params.relationDuration,
      relationshipStatus: params.relationshipStatus,
    };

    // is_self Y: 기존 본인 프로필 확인 후 수정 또는 신규 등록
    if (params.isSelf === "Y") {
      const existing = await findSelfProfile(params.userId);
      if (existing) {
        return update({ sajuProfileId: existing.sajuProfileId, ...profileData });
      }
    }

    // is_self N 또는 본인 프로필 없음: 신규 등록
    return create({ userId: params.userId, ...profileData });
  };

  // 내 사주 프로필 조회 (is_self = Y)
  const getMyProfile = async (userId: string) => {
    return findSelfProfile(userId);
  };

  return { saveSajuProfile, getMyProfile };
};

export type SajuProfileServiceType = ReturnType<typeof createSajuProfileService>;
