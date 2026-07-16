import { ISajuProfileRepo } from "../../application/contracts/saju-profile-repo.contract.js";
import { prismaClient } from "./prismaClinet.js";

export const createSajuProfileRepo = (): ISajuProfileRepo => {
  // 본인(is_self=Y) 사주 프로필 조회
  const findSelfProfile: ISajuProfileRepo["findSelfProfile"] = async (userId) => {
    return prismaClient.sajuProfile.findFirst({
      where: { userId, isSelf: "Y" },
    });
  };

  // sajuProfileId와 userId 조건 모두 만족하는 레코드의 report_yn을 Y로 업데이트
  const updateReportYn: ISajuProfileRepo["updateReportYn"] = async (sajuProfileId, userId) => {
    const result = await prismaClient.sajuProfile.updateMany({
      where: { sajuProfileId, userId },
      data: { reportYn: "Y" },
    });
    return result.count;
  };

  // 상대방(is_self=N) 사주 프로필 목록 조회 (등록일 역순)
  const findOtherProfiles: ISajuProfileRepo["findOtherProfiles"] = async (userId) => {
    return prismaClient.sajuProfile.findMany({
      where: { userId, isSelf: "N" },
      select: {
        sajuProfileId: true,
        name: true,
        gender: true,
        relationshipType: true,
        relationDuration: true,
        relationshipStatus: true,
        createdAt: true,
        reportYn: true,
      },
      orderBy: { createdAt: "desc" },
    });
  };

  // 사주 프로필 신규 저장
  const create: ISajuProfileRepo["create"] = async (params) => {
    return prismaClient.sajuProfile.create({
      data: {
        userId: params.userId,
        isSelf: params.isSelf,
        name: params.name,
        gender: params.gender,
        birthDate: params.birthDate,
        calendarType: params.calendarType,
        birthTime: params.birthTime,
        relationshipType: params.relationshipType,
        relationDuration: params.relationDuration,
        relationshipStatus: params.relationshipStatus,
      },
    });
  };

  // 기존 사주 프로필 수정
  const update: ISajuProfileRepo["update"] = async (params) => {
    return prismaClient.sajuProfile.update({
      where: { sajuProfileId: params.sajuProfileId },
      data: {
        isSelf: params.isSelf,
        name: params.name,
        gender: params.gender,
        birthDate: params.birthDate,
        calendarType: params.calendarType,
        birthTime: params.birthTime,
        relationshipType: params.relationshipType,
        relationDuration: params.relationDuration,
        relationshipStatus: params.relationshipStatus,
      },
    });
  };

  return { findSelfProfile, findOtherProfiles, updateReportYn, create, update };
};
