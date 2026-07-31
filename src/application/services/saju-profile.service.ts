import { ISajuProfileRepo } from "../contracts/saju-profile-repo.contract.js";
import { IUserRepo } from "../contracts/user-repo.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import type { ManseInput, ManseOutput } from "../../shared/manse/manse.util.js";

const CALENDAR_TYPE_MAP: Record<string, string> = {
  solar: "1",
  lunar: "2",
  lunar_leap: "3",
};

const CALENDAR_INPUT_MAP: Record<string, "solar" | "lunar" | "lunar_leap"> = {
  solar: "solar",
  lunar: "lunar",
  lunar_leap: "lunar_leap",
};

type CalculateSajuFn = (input: ManseInput) => ManseOutput;

export const createSajuProfileService = (
  create: ISajuProfileRepo["create"],
  update: ISajuProfileRepo["update"],
  findSelfProfile: ISajuProfileRepo["findSelfProfile"],
  findOtherProfiles: ISajuProfileRepo["findOtherProfiles"],
  updateReportYn: ISajuProfileRepo["updateReportYn"],
  findUserById: IUserRepo["findUserById"],
  calculateSaju: CalculateSajuFn,
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
    const [year, month, day] = params.birthDate.split("-").map(Number);
    const birthDate = new Date(params.birthDate);

    // 출생 시간 변환 (없는 경우 null)
    const birthTime = params.birthTime
      ? new Date(`1970-01-01T${params.birthTime}`)
      : null;

    // 사주 계산
    const timeInput = params.birthTime
      ? { hour: parseInt(params.birthTime.slice(0, 2)), minute: parseInt(params.birthTime.slice(3, 5)) }
      : undefined;
    const saju = calculateSaju({
      gender: params.gender,
      calendar: CALENDAR_INPUT_MAP[params.calendarType],
      year,
      month,
      day,
      time: timeInput,
    });

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
      yearStem: saju.yearPillar.stem,
      yearBranch: saju.yearPillar.branch,
      monthStem: saju.monthPillar.stem,
      monthBranch: saju.monthPillar.branch,
      dayStem: saju.dayPillar.stem,
      dayBranch: saju.dayPillar.branch,
      hourStem: saju.hourPillar?.stem ?? null,
      hourBranch: saju.hourPillar?.branch ?? null,
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

  // 상대방 사주 프로필 목록 조회 (is_self = N)
  const getProfileList = async (userId: string) => {
    return findOtherProfiles(userId);
  };

  // 리포트 생성 (report_yn Y로 업데이트)
  const updateReport = async (sajuProfileId: bigint, userId: string) => {
    // 업데이트된 레코드가 없으면 존재하지 않거나 소유자가 다른 경우
    const count = await updateReportYn(sajuProfileId, userId);
    if (count === 0) {
      throw new BusinessException("존재하지 않는 사주 프로필입니다.");
    }
  };

  return { saveSajuProfile, getMyProfile, getProfileList, updateReport };
};

export type SajuProfileServiceType = ReturnType<typeof createSajuProfileService>;
