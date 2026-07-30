import type { IKakaoAuthUtil } from "../contracts/kakao-auth-util.contract.js";
import { BusinessException } from "../exceptions/business.exception.js";

export const createKakaoAuthUtil = (jsAppKey: string, redirectUri: string): IKakaoAuthUtil => {
  const getUserInfo: IKakaoAuthUtil["getUserInfo"] = async (code) => {
    // authorization code → access_token 교환
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: jsAppKey,
      redirect_uri: redirectUri,
      code,
    });
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: tokenParams.toString(),
    });
    if (!tokenRes.ok) {
      throw new BusinessException("카카오 토큰 발급에 실패했습니다.");
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    // access_token으로 사용자 정보 조회
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      throw new BusinessException("카카오 사용자 정보를 가져올 수 없습니다.");
    }

    const data = await userRes.json() as {
      id: number;
      kakao_account?: { profile?: { nickname?: string } };
    };

    const kakaoId = String(data.id);
    if (!kakaoId) {
      throw new BusinessException("카카오 사용자 정보를 가져올 수 없습니다.");
    }

    return {
      kakaoId,
      name: data.kakao_account?.profile?.nickname ?? "",
    };
  };

  return { getUserInfo };
};
