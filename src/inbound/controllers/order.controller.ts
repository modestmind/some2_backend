import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { OrderServiceType } from "../../application/services/order.service.js";
import type { AuthMiddlewareType } from "../middlewares/auth.middleware.js";
import { createOrderSchema, confirmOrderSchema } from "../schemas/order.schemas.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";

export const createOrderController = (
  initOrder: OrderServiceType["initOrder"],
  confirmOrder: OrderServiceType["confirmOrder"],
  authMiddleware: AuthMiddlewareType,
) => {
  const router = Router();

  // 주문서 작성 — order_id 발급
  router.post("/create", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { success, data, error } = createOrderSchema.safeParse(req.body);
    if (success === false) {
      throw new BusinessException(z.prettifyError(error));
    }

    try {
      const { order_id } = await initOrder({
        userId: req.userId!,
        sajuProfileId: BigInt(data.saju_profile_id),
        paymentAmount: data.payment_amount,
      });
      return res.json({ order_id });
    } catch (err) {
      if (err instanceof BusinessException) {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  });

  // 결제 승인 처리 — Toss 승인 API 호출 후 주문·리포트 업데이트
  router.post("/confirm", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    const { success, data, error } = confirmOrderSchema.safeParse(req.body);
    if (success === false) {
      throw new BusinessException(z.prettifyError(error));
    }

    try {
      const { order_id, report_id } = await confirmOrder({
        userId: req.userId!,
        paymentKey: data.paymentKey,
        orderId: data.orderId,
        amount: data.amount,
      });
      return res.json({ order_id, report_id });
    } catch (err) {
      if (err instanceof BusinessException) {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  });

  return { router };
};
