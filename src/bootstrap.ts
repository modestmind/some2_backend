import { createAuthService } from "./application/services/auth.service.js";
import { createUserService } from "./application/services/user.service.js";
import { createSajuProfileService } from "./application/services/saju-profile.service.js";
import { createOrderService } from "./application/services/order.service.js";
import { createAuthController } from "./inbound/controllers/auth.controller.js";
import { createUserController } from "./inbound/controllers/user.controller.js";
import { createSajuController } from "./inbound/controllers/saju.controller.js";
import { createOrderController } from "./inbound/controllers/order.controller.js";
import { createReportController } from "./inbound/controllers/report.controller.js";
import { createAuthMiddleware } from "./inbound/middlewares/auth.middleware.js";
import { createUserRepo } from "./outbound/repos/user.repo.js";
import { createSajuProfileRepo } from "./outbound/repos/saju-profile.repo.js";
import { createUserLoginLogRepo } from "./outbound/repos/user-login-log.repo.js";
import { createOrderRepo } from "./outbound/repos/order.repo.js";
import { createSajuReportRepo } from "./outbound/repos/saju-report.repo.js";
import { createOpenAIReportUtil } from "./shared/utils/openai-report.util.js";
import { createReportService } from "./application/services/report.service.js";
import { bcryptUtil } from "./shared/utils/bcrypt.util.js";
import { sha256Util } from "./shared/utils/sha256.util.js";
import { signJwt, jwtUtil } from "./shared/utils/jwt.util.js";
import { createGoogleAuthUtil } from "./shared/utils/google-auth.util.js";
import { createKakaoAuthUtil } from "./shared/utils/kakao-auth.util.js";
import { createManseService } from "./shared/manse/manse.util.js";
import { KAKAO_REDIRECT_URI } from "./shared/config.js";
import { BusinessException } from "./shared/exceptions/business.exception.js";

export const bootstrap = () => {

  const { findUserBySns, createUser, findMaxUserId, findUserById, findUserByIdForRefresh, updateRefreshToken, updateLastLogin } = createUserRepo();
  const { findSelfProfile, findOtherProfiles, findProfileById, updateReportYn, create: createSajuProfile, update: updateSajuProfile } = createSajuProfileRepo();
  const { createLoginLog } = createUserLoginLogRepo();

  const googleAuthUtil = createGoogleAuthUtil(process.env.GOOGLE_OAUTH_CLIENT_ID as string);
  const kakaoAuthUtil = createKakaoAuthUtil(
    process.env.KAKAO_JS_APP_KEY as string,
    KAKAO_REDIRECT_URI,
  );

  const { login, refreshTokens, logout } = createAuthService(
    findUserBySns, createUser, findMaxUserId, findUserByIdForRefresh, signJwt,
    bcryptUtil, sha256Util, createLoginLog, updateRefreshToken, updateLastLogin, googleAuthUtil, kakaoAuthUtil
  );
  const { getMe } = createUserService(findUserById);
  const { calculateSaju } = createManseService();
  const { saveSajuProfile, getMyProfile, getProfileList, updateReport } = createSajuProfileService(
    createSajuProfile, updateSajuProfile, findSelfProfile, findOtherProfiles, updateReportYn, findUserById, calculateSaju,
  );

  const { createOrder, findOrderById, updateOrderPaid } = createOrderRepo();
  const { createSajuReport, findSajuReportById, updateSajuReportSections, findReportsByUserId } = createSajuReportRepo();

  // Toss 결제 승인 API 호출 함수 (주입용 클로저)
  const confirmTossPayment = async (params: { paymentKey: string; orderId: string; amount: number }) => {
    const encoded = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString("base64");
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      const errBody = await response.json() as { message?: string };
      throw new BusinessException(errBody.message ?? "결제 확인에 실패했습니다.");
    }
    return response.json() as Promise<{ paymentKey: string; method: string }>;
  };

  const { initOrder, confirmOrder } = createOrderService(
    createOrder, findOrderById, updateOrderPaid, createSajuReport, confirmTossPayment,
  );

  const openAIReportUtil = createOpenAIReportUtil(process.env.OPENAI_API_KEY as string);
  const { generateReportForId, getReport, getMyReports } = createReportService(
    findSajuReportById, updateSajuReportSections, findReportsByUserId,
    findProfileById, findSelfProfile, updateReportYn,
    openAIReportUtil.generateReport,
  );

  const authMiddleware = createAuthMiddleware(jwtUtil.verifyJwt);

  const { router: authRouter } = createAuthController(login, refreshTokens, logout, jwtUtil.verifyJwt);
  const { router: userRouter } = createUserController(getMe, authMiddleware);
  const { router: sajuRouter } = createSajuController(saveSajuProfile, getMyProfile, getProfileList, updateReport, authMiddleware);
  const { router: orderRouter } = createOrderController(initOrder, confirmOrder, authMiddleware);
  const { router: reportRouter } = createReportController(generateReportForId, getReport, getMyReports, authMiddleware);

  return { authRouter, userRouter, sajuRouter, orderRouter, reportRouter };
};
