import { IUserRepo } from "../contracts/user-repo.contract.js";
import { IUserLoginLogRepo } from "../contracts/user-login-log-repo.contract.js";
import { IJwtUtil } from "../../shared/contracts/jwt-util.contract.js";
import { IHashUtil } from "../../shared/contracts/hash-util.contract.js";
import { ISha256Util } from "../../shared/contracts/sha256-util.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../../shared/config.js";
import { IGoogleAuthUtil } from "../../shared/contracts/google-auth-util.contract.js";
import { IKakaoAuthUtil } from "../../shared/contracts/kakao-auth-util.contract.js";
import { getKstNow } from "../../shared/utils/date.util.js";

export const createAuthService = (
  findUserBySns: IUserRepo["findUserBySns"],
  createUser: IUserRepo["createUser"],
  findMaxUserId: IUserRepo["findMaxUserId"],
  findUserByIdForRefresh: IUserRepo["findUserByIdForRefresh"],
  signJwt: IJwtUtil["signJwt"],
  hashUtil: IHashUtil,
  sha256Util: ISha256Util,
  createLoginLog: IUserLoginLogRepo["createLoginLog"],
  updateRefreshToken: IUserRepo["updateRefreshToken"],
  updateLastLogin: IUserRepo["updateLastLogin"],
  googleAuthUtil: IGoogleAuthUtil,
  kakaoAuthUtil: IKakaoAuthUtil,
) => {
  const login = async (params: { sns_provider_code: string; credential: string; loginIp: string; }) => {
    const { sns_provider_code, credential, loginIp } = params;

    let nickname = "";
    let sns_user_key = "";

    if (sns_provider_code === "google") {
      // 구글 ID 토큰 검증 및 사용자 정보 추출
      ({ name: nickname, googleId: sns_user_key } = await googleAuthUtil.verifyIdToken(credential));
    } else if (sns_provider_code === "kakao") {
      // 카카오 access_token으로 사용자 정보 조회
      ({ name: nickname, kakaoId: sns_user_key } = await kakaoAuthUtil.getUserInfo(credential));
    }

    if (!sns_user_key) {
       throw new BusinessException("로그인 오류입니다. (유저키)");
    }

    // SNS 정보로 기존 회원 조회
    const foundUser = await findUserBySns(sns_provider_code, sns_user_key);

    const isNewUser = !!foundUser;
    let user = foundUser;
    if (!user) {
      // 신규 회원 생성
      const maxUserId = await findMaxUserId();
      const newUserId = maxUserId ? String(Number(maxUserId) + 1) : "1010101010";

      user = await createUser({
        userId: newUserId,
        snsProviderCode: sns_provider_code,
        snsUserKey: sns_user_key,
        nickname,
        status: "Y",
        createdAt: getKstNow(),
        lastLoginAt: getKstNow(),
      });
    } else {
      await updateLastLogin(user.userId, getKstNow());
    }

    // 액세스 토큰 + 리프레시 토큰 발급
    const accessToken = signJwt({ data: { userId: user.userId }, expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const refreshToken = signJwt({ data: { userId: user.userId }, expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    // 리프레시 토큰 SHA-256 해시 후 DB 저장
    const hashedRefreshToken = sha256Util.hash(refreshToken);
    await updateRefreshToken(user.userId, hashedRefreshToken);

    await createLoginLog({ userId: user.userId, loginIp, loggedAt: getKstNow() });

    return { accessToken, refreshToken, nickname, isNewUser };
  };

  const refreshTokens = async (params: { userId: string; rawRefreshToken: string }) => {
    const { userId, rawRefreshToken } = params;

    // userId로 유저 조회 (토큰 자체로 조회하지 않음)
    const user = await findUserByIdForRefresh(userId);
    if (!user) throw new BusinessException("존재하지 않는 유저입니다.");

    // DB 저장된 해시와 요청 토큰 비교
    if (!user.refreshToken) throw new BusinessException("유효하지 않은 토큰입니다.");
    const hashedToken = sha256Util.hash(rawRefreshToken);
    if (hashedToken !== user.refreshToken) throw new BusinessException("유효하지 않은 토큰입니다.");

    // 토큰 로테이션: 두 토큰 모두 재발급
    const accessToken = signJwt({ data: { userId }, expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const refreshToken = signJwt({ data: { userId }, expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    const hashedRefreshToken = sha256Util.hash(refreshToken);
    await updateRefreshToken(userId, hashedRefreshToken);

    return { accessToken, refreshToken, nickname: user.nickname ?? "" };
  };

  const logout = async (params: { userId: string }) => {
    // DB에서 리프레시 토큰 삭제
    await updateRefreshToken(params.userId, null);
  };

  return { login, refreshTokens, logout };
};

export type AuthServiceType = ReturnType<typeof createAuthService>;
