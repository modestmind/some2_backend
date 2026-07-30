export interface IGoogleAuthUtil {
  // 구글 ID 토큰을 검증하고 사용자 정보를 반환한다
  verifyIdToken: (idToken: string) => Promise<{
    name: string;
    googleId: string;
  }>;
}
