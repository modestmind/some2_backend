import type { ISajuReportRepo, ReportWithProfile } from "../contracts/saju-report-repo.contract.js";
import type { ISajuProfileRepo } from "../contracts/saju-profile-repo.contract.js";
import type { IOpenAIReportUtil, PersonInfo, HeavenlyStem, EarthlyBranch } from "../../shared/contracts/openai-report-util.contract.js";
import type { SajuProfile } from "../../generated/prisma/client.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";

const GENDER_MAP: Record<string, "남" | "여"> = { M: "남", F: "여" };

const buildPersonInfo = (profile: SajuProfile): PersonInfo => ({
  name: profile.name,
  gender: GENDER_MAP[profile.gender] ?? "남",
  yearPillar: { heavenlyStem: profile.yearStem as HeavenlyStem, earthlyBranch: profile.yearBranch as EarthlyBranch },
  monthPillar: { heavenlyStem: profile.monthStem as HeavenlyStem, earthlyBranch: profile.monthBranch as EarthlyBranch },
  dayPillar: { heavenlyStem: profile.dayStem as HeavenlyStem, earthlyBranch: profile.dayBranch as EarthlyBranch },
  hourPillar: profile.hourStem && profile.hourBranch
    ? { heavenlyStem: profile.hourStem as HeavenlyStem, earthlyBranch: profile.hourBranch as EarthlyBranch }
    : null,
});

const parseReportSections = (raw: string): string[] =>
  Array.from({ length: 8 }, (_, i) => {
    const marker = `===SECTION_${i + 1}===`;
    const nextMarker = `===SECTION_${i + 2}===`;
    const start = raw.indexOf(marker);
    if (start === -1) return "";
    const end = i < 7 ? raw.indexOf(nextMarker) : raw.length;
    return raw.slice(start + marker.length, end === -1 ? raw.length : end).trim();
  });

export const createReportService = (
  findSajuReportById: ISajuReportRepo["findSajuReportById"],
  updateSajuReportSections: ISajuReportRepo["updateSajuReportSections"],
  findReportsByUserId: ISajuReportRepo["findReportsByUserId"],
  findProfileById: ISajuProfileRepo["findProfileById"],
  findSelfProfile: ISajuProfileRepo["findSelfProfile"],
  updateReportYn: ISajuProfileRepo["updateReportYn"],
  generateReport: IOpenAIReportUtil["generateReport"],
) => {
  const generateReportForId = async (reportId: string, userId: string) => {
    const report = await findSajuReportById(reportId, userId);
    if (!report) throw new BusinessException("존재하지 않는 리포트입니다.");
    if (report.userId !== userId) throw new BusinessException("접근 권한이 없습니다.");

    if (report.reportStatus === "B") return { report_id: reportId };

    const partnerProfile = await findProfileById(report.sajuProfileId);
    if (!partnerProfile) throw new BusinessException("상대방 사주 프로필을 찾을 수 없습니다.");

    const selfProfile = await findSelfProfile(userId);
    if (!selfProfile) throw new BusinessException("본인 사주 프로필을 찾을 수 없습니다.");

    const relationship = [partnerProfile.relationshipType, partnerProfile.relationDuration]
      .filter(Boolean)
      .join(", ");

    const rawReport = await generateReport({
      client: buildPersonInfo(selfProfile),
      partner: buildPersonInfo(partnerProfile),
      relationship,
      currentSituation: partnerProfile.relationshipStatus ?? "",
      reportFormat: "",
    });

    const sections = parseReportSections(rawReport);
    console.log("[report] sections parsed:", sections.map((s, i) => `section${i + 1}: ${s.length}자`));

    console.log("[report] updateSajuReportSections 호출 시작, reportId:", reportId);
    try {
      await updateSajuReportSections({
        reportId,
        section1: sections[0],
        section2: sections[1],
        section3: sections[2],
        section4: sections[3],
        section5: sections[4],
        section6: sections[5],
        section7: sections[6],
        section8: sections[7],
      });
      console.log("[report] updateSajuReportSections 완료");
    } catch (err) {
      console.error("[report] updateSajuReportSections 실패:", err);
      throw err;
    }

    await updateReportYn(report.sajuProfileId, userId);

    return { report_id: reportId };
  };

  const getReport = async (reportId: string, userId: string) => {
    const report = await findSajuReportById(reportId, userId);
    if (!report) throw new BusinessException("존재하지 않는 리포트입니다.");

    const [partnerProfile, selfProfile] = await Promise.all([
      findProfileById(report.sajuProfileId),
      findSelfProfile(report.userId),
    ]);

    return {
      report_id: report.reportId,
      report_status: report.reportStatus,
      report_section1: report.reportSection1,
      report_section2: report.reportSection2,
      report_section3: report.reportSection3,
      report_section4: report.reportSection4,
      report_section5: report.reportSection5,
      report_section6: report.reportSection6,
      report_section7: report.reportSection7,
      report_section8: report.reportSection8,
      created_at: report.createdAt,
      client_name: selfProfile?.name ?? null,
      partner_name: partnerProfile?.name ?? null,
      partner_relationship_type: partnerProfile?.relationshipType ?? null,
    };
  };

  const getMyReports = async (userId: string) => {
    const reports: ReportWithProfile[] = await findReportsByUserId(userId);
    return reports.map((r) => ({
      report_id: r.reportId,
      saju_profile_id: Number(r.sajuProfileId),
      report_status: r.reportStatus,
      created_at: r.createdAt,
      partner_name: r.sajuProfile.name,
      partner_gender: r.sajuProfile.gender,
      partner_relationship_type: r.sajuProfile.relationshipType,
    }));
  };

  return { generateReportForId, getReport, getMyReports };
};

export type ReportServiceType = ReturnType<typeof createReportService>;
