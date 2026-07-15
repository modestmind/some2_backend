import { Router, Request, Response, NextFunction } from "express";
import { SajuProfileServiceType } from "../../application/services/saju-profile.service.js";
import { AuthMiddlewareType } from "../middlewares/auth.middleware.js";
import { createSajuProfileSchema } from "../schemas/saju.schemas.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import { SajuProfile } from "../../generated/prisma/client.js";
import z from "zod";

// Prisma camelCase 필드를 DB 컬럼명(snake_case)으로 변환
const toResponse = ({
  sajuProfileId,
  userId,
  isSelf,
  birthDate,
  calendarType,
  birthTime,
  relationshipType,
  relationDuration,
  relationshipStatus,
  createdAt,
  updatedAt,
  name,
  gender,
}: SajuProfile) => ({
  saju_profile_id: Number(sajuProfileId),
  user_id: userId,
  is_self: isSelf,
  name,
  gender,
  birth_date: birthDate,
  calendar_type: calendarType,
  birth_time: birthTime,
  relationship_type: relationshipType,
  relation_duration: relationDuration,
  relationship_status: relationshipStatus,
  created_at: createdAt,
  updated_at: updatedAt,
});

export const createSajuController = (
  saveSajuProfile: SajuProfileServiceType["saveSajuProfile"],
  getMyProfile: SajuProfileServiceType["getMyProfile"],
  authMiddleware: AuthMiddlewareType,
) => {
  const router = Router();

  // 내 사주 프로필 조회
  router.get(
    "/my-profile",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      const profile = await getMyProfile(String(req.userId!));
      res.json({ saju_profile: profile ? toResponse(profile) : null });
    },
  );

  // 사주 프로필 저장
  router.post(
    "/profile",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      const result = createSajuProfileSchema.safeParse(req.body);
      if (!result.success) {
        throw new BusinessException(z.prettifyError(result.error));
      }

      const profile = await saveSajuProfile({
        userId: String(req.userId!),
        isSelf: result.data.is_self,
        name: result.data.name,
        gender: result.data.gender,
        birthDate: result.data.birth_date,
        calendarType: result.data.calendar_type,
        birthTime: result.data.birth_time ?? null,
        relationshipType: result.data.relationship_type ?? null,
        relationDuration: result.data.relation_duration ?? null,
        relationshipStatus: result.data.relationship_status ?? null,
      });

      res.json({ saju_profile: toResponse(profile) });
    },
  );

  return { router };
};
