import { Router, Request, Response, NextFunction } from "express";
import type { ReportServiceType } from "../../application/services/report.service.js";
import type { AuthMiddlewareType } from "../middlewares/auth.middleware.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";

export const createReportController = (
  generateReportForId: ReportServiceType["generateReportForId"],
  getReport: ReportServiceType["getReport"],
  getMyReports: ReportServiceType["getMyReports"],
  authMiddleware: AuthMiddlewareType,
) => {
  const router = Router();

  // POST /api/reports/generate — 리포트 생성 (AI 호출 → 8섹션 DB 저장)
  router.post(
    "/generate",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      const { report_id } = req.body;
      if (!report_id || typeof report_id !== "string") {
        throw new BusinessException("report_id가 필요합니다.");
      }
      const result = await generateReportForId(report_id, String(req.userId!));
      res.json(result);
    },
  );

  // GET /api/reports — 내 리포트 목록 조회
  router.get(
    "/",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      const reports = await getMyReports(String(req.userId!));
      res.json({ reports });
    },
  );

  // GET /api/reports/:reportId — 리포트 조회
  router.get(
    "/:reportId",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      const report = await getReport(String(req.params.reportId), String(req.userId!));
      res.json({ report });
    },
  );

  return { router };
};
