import type { Order } from "../../generated/prisma/client.js";

export interface IOrderRepo {
  createOrder: (params: {
    userId: string;
    sajuProfileId: bigint;
    productName: string;
    paymentAmount: number;
  }) => Promise<Pick<Order, "orderId">>;

  findOrderById: (orderId: string, userId: string) => Promise<Order | null>;

  updateOrderPaid: (params: {
    orderId: string;
    pgPaymentCode: string;
    paymentMethod: string;
    paidAt: Date;
    reportId: string;
  }) => Promise<void>;
}
