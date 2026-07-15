import { describe, it, expect, jest } from "@jest/globals";
import { createRecommendService } from "./recommend.service.js";
import { IRecommendRepo } from "../contracts/recommend-repo.contract.js";
import { IMemoRepo } from "../contracts/memo-repo.contract.js";

describe("RecommendService", () => {
  describe("toggleRecommend", () => {
    it("아직 추천하지 않은 게시글을 추천하면 추천이 생성된다", async () => {
      // 추천 대상 게시글 (작성자: userId=2)
      const existingArticle = {
        id: 1,
        title: "제목",
        content: "내용",
        userId: 2,
        createdAt: new Date(),
      };

      // 새로 생성될 추천 데이터
      const newRecommend = {
        id: 1,
        userId: 1,
        articleId: 1,
        createdAt: new Date(),
      };

      // Mock 데이터
      const mockFindById = jest
        .fn<IMemoRepo["findById"]>()
        .mockResolvedValue(existingArticle as any);

      const mockFindByUserIdAndArticleId = jest
        .fn<IRecommendRepo["findByUserIdAndArticleId"]>()
        .mockResolvedValue(null);

      const mockCreate = jest
        .fn<IRecommendRepo["create"]>()
        .mockResolvedValue(newRecommend as any);

      // RecommendService 생성
      const recommendService = createRecommendService(
        mockFindById,
        mockFindByUserIdAndArticleId,
        mockCreate,
        jest.fn() as any,
      );

      // toggleRecommend 호출
      const result = await recommendService.toggleRecommend({
        userId: 1,
        articleId: 1,
      });

      // 검증
      expect(result).toEqual(newRecommend);
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockFindByUserIdAndArticleId).toHaveBeenCalledWith({
        userId: 1,
        articleId: 1,
      });
      expect(mockCreate).toHaveBeenCalledWith({ userId: 1, articleId: 1 });
    });
  });
});
