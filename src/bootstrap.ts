import { createAuthService } from "./application/services/auth.service.js";
import { createUserService } from "./application/services/user.service.js";
import { createSajuProfileService } from "./application/services/saju-profile.service.js";
import { createAuthController } from "./inbound/controllers/auth.controller.js";
import { createUserController } from "./inbound/controllers/user.controller.js";
import { createSajuController } from "./inbound/controllers/saju.controller.js";
import { createAuthMiddleware } from "./inbound/middlewares/auth.middleware.js";
import { createUserRepo } from "./outbound/repos/user.repo.js";
import { createSajuProfileRepo } from "./outbound/repos/saju-profile.repo.js";
import { createUserLoginLogRepo } from "./outbound/repos/user-login-log.repo.js";
import { bcryptUtil } from "./shared/utils/bcrypt.util.js";
import { sha256Util } from "./shared/utils/sha256.util.js";
import { signJwt, jwtUtil } from "./shared/utils/jwt.util.js";
import { createGoogleAuthUtil } from "./shared/utils/google-auth.util.js";
import { createKakaoAuthUtil } from "./shared/utils/kakao-auth.util.js";
import { KAKAO_REDIRECT_URI } from "./shared/config.js";

export const bootstrap = () => {

  const { findUserBySns, createUser, findMaxUserId, findUserById, findUserByIdForRefresh, updateRefreshToken, updateLastLogin } = createUserRepo();
  const { findSelfProfile, findOtherProfiles, updateReportYn, create: createSajuProfile, update: updateSajuProfile } = createSajuProfileRepo();
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
  const { saveSajuProfile, getMyProfile, getProfileList, updateReport } = createSajuProfileService(
    createSajuProfile, updateSajuProfile, findSelfProfile, findOtherProfiles, updateReportYn, findUserById,
  );

  const authMiddleware = createAuthMiddleware(jwtUtil.verifyJwt);

  const { router: authRouter } = createAuthController(login, refreshTokens, logout, jwtUtil.verifyJwt);
  const { router: userRouter } = createUserController(getMe, authMiddleware);
  const { router: sajuRouter } = createSajuController(saveSajuProfile, getMyProfile, getProfileList, updateReport, authMiddleware);

  return { authRouter, userRouter, sajuRouter };
};
