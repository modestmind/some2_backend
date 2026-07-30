export interface IKakaoAuthUtil {
  getUserInfo: (accessToken: string) => Promise<{
    name: string;
    kakaoId: string;
  }>;
}
