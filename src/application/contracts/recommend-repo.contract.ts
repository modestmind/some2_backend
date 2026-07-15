import { UserRecommendArticle } from "../../generated/prisma/client.js";

export interface IRecommendRepo {
  findByUserIdAndArticleId: (params: {
    userId: number;
    articleId: number;
  }) => Promise<UserRecommendArticle | null>;
  create: (params: {
    userId: number;
    articleId: number;
  }) => Promise<UserRecommendArticle>;
  delete: (id: number) => Promise<UserRecommendArticle>;
}
