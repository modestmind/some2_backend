import { Router, Request, Response } from "express";
import { RecommendServiceType } from "../../application/services/recommend.service.js";
import { AuthMiddlewareType } from "../middlewares/auth.middleware.js";

export const createRecommendController = (
  toggleRecommend: RecommendServiceType["toggleRecommend"],
  authMiddleware: AuthMiddlewareType,
) => {
  const router = Router();

  router.post(
    "/:articleId",
    authMiddleware,
    async (req: Request, res: Response) => {
      const articleId = parseInt(String(req.params.articleId));

      const recommend = await toggleRecommend({
        userId: req.userId!,
        articleId,
      });

      res.json({ recommend });
    },
  );

  return { router };
};
