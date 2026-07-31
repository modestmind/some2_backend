import type { SajuReport } from "../../generated/prisma/client.js";

export type ReportWithProfile = {
  reportId: string;
  sajuProfileId: bigint;
  reportStatus: string;
  createdAt: Date;
  sajuProfile: {
    name: string;
    gender: string;
    relationshipType: string | null;
  };
};

export interface ISajuReportRepo {
  createSajuReport: (params: {
    sajuProfileId: bigint;
    userId: string;
  }) => Promise<Pick<SajuReport, "reportId">>;
  findSajuReportById: (reportId: string, userId: string) => Promise<SajuReport | null>;
  updateSajuReportSections: (params: {
    reportId: string;
    section1: string;
    section2: string;
    section3: string;
    section4: string;
    section5: string;
    section6: string;
    section7: string;
    section8: string;
  }) => Promise<void>;
  findReportsByUserId: (userId: string) => Promise<ReportWithProfile[]>;
}
