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
import { signJwt, jwtUtil } from "./shared/utils/jwt.util.js";

export const bootstrap = () => {

  const { findUserBySns, createUser, findMaxUserId, findUserById } = createUserRepo();
  const { findSelfProfile, findOtherProfiles, updateReportYn, create: createSajuProfile, update: updateSajuProfile } = createSajuProfileRepo();
  const { createLoginLog } = createUserLoginLogRepo();

  const { login } = createAuthService( findUserBySns, createUser, findMaxUserId, signJwt, bcryptUtil, createLoginLog);
  const { getMe } = createUserService(findUserById);
  const { saveSajuProfile, getMyProfile, getProfileList, updateReport } = createSajuProfileService(createSajuProfile, updateSajuProfile, findSelfProfile, findOtherProfiles, updateReportYn, findUserById);

  const authMiddleware = createAuthMiddleware(jwtUtil.verifyJwt);

  const { router: authRouter } = createAuthController(login, jwtUtil.verifyJwt);
  const { router: userRouter } = createUserController(getMe, authMiddleware);
  const { router: sajuRouter } = createSajuController(saveSajuProfile, getMyProfile, getProfileList, updateReport, authMiddleware);

  return { authRouter, userRouter, sajuRouter };
};
