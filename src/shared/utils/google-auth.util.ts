import { OAuth2Client } from "google-auth-library";
import { IGoogleAuthUtil } from "../contracts/google-auth-util.contract.js";
import { BusinessException } from "../exceptions/business.exception.js";

export const createGoogleAuthUtil = (clientId: string): IGoogleAuthUtil => {
  const client = new OAuth2Client(clientId);

  const verifyIdToken: IGoogleAuthUtil["verifyIdToken"] = async (idToken) => {
    // 구글 서버에 ID 토큰 진위 여부 검증
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    // 페이로드에서 사용자 식별 정보 추출
    const payload = ticket.getPayload();
    if (!payload?.email || !payload?.sub) {
      throw new BusinessException("구글 토큰에서 사용자 정보를 가져올 수 없습니다");
    }

    return {
      name: payload.name ?? payload.email,
      googleId: payload.sub,
    };
  };

  return { verifyIdToken };
};
