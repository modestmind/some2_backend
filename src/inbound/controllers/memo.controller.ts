import { Router, Request, Response, NextFunction } from "express";
import { MemoServiceType } from "../../application/services/memo.service.js";
import { AuthMiddlewareType } from "../middlewares/auth.middleware.js";
import {
  createMemoDataSchema,
  updateMemoDataSchema,
} from "../schemas/memo.schemas.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import z from "zod";

export const createMemoController = (
  getAllMemos: MemoServiceType["getAllMemos"],
  createMemo: MemoServiceType["createMemo"],
  updateMemo: MemoServiceType["updateMemo"],
  deleteMemo: MemoServiceType["deleteMemo"],
  authMiddleware: AuthMiddlewareType,
) => {
  const router = Router();

  router.get(
    "/",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      const memos = await getAllMemos(req.userId!);
      res.json({ memos });
    },
  );

  router.post(
    "/",
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      const result = createMemoDataSchema.safeParse(req.body);
      if (!result.success) {
        throw new BusinessException(z.prettifyError(result.error));
      }

      const memo = await createMemo({
        userId: req.userId!,
        title: result.data.title,
        content: result.data.content,
      });

      res.json({ memo });
    },
  );

  router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
    const memoId = parseInt(String(req.params.id));
    const result = updateMemoDataSchema.safeParse(req.body);
    if (!result.success) {
      throw new BusinessException(z.prettifyError(result.error));
    }

    const memo = await updateMemo({
      memoId,
      userId: req.userId!,
      title: result.data.title,
      content: result.data.content,
    });

    res.json({ memo });
  });

  router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
    const memoId = parseInt(String(req.params.id));

    const memo = await deleteMemo({
      memoId,
      userId: req.userId!,
    });

    res.json({ memo });
  });

  return { router };
};
