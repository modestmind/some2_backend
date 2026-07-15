import { IMemoRepo } from "../contracts/memo-repo.contract.js";
import { IRecommendRepo } from "../contracts/recommend-repo.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";

export const createRecommendService = (
  findArticleById: IMemoRepo["findById"],
  findByUserIdAndArticleId: IRecommendRepo["findByUserIdAndArticleId"],
  create: IRecommendRepo["create"],
  deleteRecommend: IRecommendRepo["delete"],
) => {
  // 게시글 추천 토글
  const toggleRecommend = async (params: {
    userId: number;
    articleId: number;
  }) => {
    // 게시글 존재 확인
    const article = await findArticleById(params.articleId);
    if (!article) {
      throw new BusinessException("존재하지 않는 게시글입니다.");
    }

    // 자기 게시글 추천 금지
    if (article.userId === params.userId) {
      throw new BusinessException("본인의 게시글은 추천할 수 없습니다.");
    }

    // 기존 추천 여부 확인 후 토글
    const existingRecommend = await findByUserIdAndArticleId(params);
    if (existingRecommend) {
      const deletedRecommend = await deleteRecommend(existingRecommend.id);
      return deletedRecommend;
    }

    const newRecommend = await create(params);
    return newRecommend;
  };

  return { toggleRecommend };
};

export type RecommendServiceType = ReturnType<typeof createRecommendService>;
