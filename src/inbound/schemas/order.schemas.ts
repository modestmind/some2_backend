import { z } from "zod";

export const createOrderSchema = z.object({
  saju_profile_id: z.number().int().positive(),
  payment_amount: z.number().int().positive(),
});

export const confirmOrderSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().uuid(),
  amount: z.number().int().positive(),
});
