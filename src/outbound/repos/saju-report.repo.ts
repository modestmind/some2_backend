import type { ISajuReportRepo } from "../../application/contracts/saju-report-repo.contract.js";
import { prismaClient } from "./prismaClinet.js";

export const createSajuReportRepo = (): ISajuReportRepo => {
  // SajuReport 초기 레코드 생성 (reportStatus 기본값 'A': 작성중)
  const createSajuReport: ISajuReportRepo["createSajuReport"] = async (params) => {
    return prismaClient.sajuReport.create({
      data: {
        sajuProfileId: params.sajuProfileId,
        userId: params.userId,
        reportStatus: "A",
      },
      select: { reportId: true },
    });
  };

  const findSajuReportById: ISajuReportRepo["findSajuReportById"] = async (reportId, userId) => {
    return prismaClient.sajuReport.findUnique({ where: { reportId, userId } });
  };

  const updateSajuReportSections: ISajuReportRepo["updateSajuReportSections"] = async (params) => {
    await prismaClient.sajuReport.update({
      where: { reportId: params.reportId },
      data: {
        reportSection1: params.section1,
        reportSection2: params.section2,
        reportSection3: params.section3,
        reportSection4: params.section4,
        reportSection5: params.section5,
        reportSection6: params.section6,
        reportSection7: params.section7,
        reportSection8: params.section8,
        reportStatus: "B",
        createdAt: new Date(),
      },
    });
  };

  const findReportsByUserId: ISajuReportRepo["findReportsByUserId"] = async (userId) => {
    return prismaClient.sajuReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        sajuProfile: {
          select: { name: true, gender: true, relationshipType: true },
        },
      },
    });
  };

  return { createSajuReport, findSajuReportById, updateSajuReportSections, findReportsByUserId };
};
