import { IRecommendRepo } from "../../application/contracts/recommend-repo.contract.js";
import { prismaClient } from "./prismaClinet.js";

export const createRecommendRepo = (): IRecommendRepo => {
  const findByUserIdAndArticleId: IRecommendRepo["findByUserIdAndArticleId"] =
    async (params) => {
      const recommend = await prismaClient.userRecommendArticle.findUnique({
        where: {
          userId_articleId: {
            userId: params.userId,
            articleId: params.articleId,
          },
        },
      });
      return recommend;
    };

  const create: IRecommendRepo["create"] = async (params) => {
    const newRecommend = await prismaClient.userRecommendArticle.create({
      data: {
        userId: params.userId,
        articleId: params.articleId,
      },
    });
    return newRecommend;
  };

  const deleteRecommend: IRecommendRepo["delete"] = async (id: number) => {
    const deletedRecommend = await prismaClient.userRecommendArticle.delete({
      where: { id },
    });
    return deletedRecommend;
  };

  return { findByUserIdAndArticleId, create, delete: deleteRecommend };
};
