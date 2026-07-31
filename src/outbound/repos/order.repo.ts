import type { IOrderRepo } from "../../application/contracts/order-repo.contract.js";
import { prismaClient } from "./prismaClinet.js";

export const createOrderRepo = (): IOrderRepo => {
  // 주문 생성
  const createOrder: IOrderRepo["createOrder"] = async (params) => {
    return prismaClient.order.create({
      data: {
        userId: params.userId,
        sajuProfileId: params.sajuProfileId,
        productName: params.productName,
        paymentAmount: params.paymentAmount,
        orderStatus: "A",
      },
      select: { orderId: true },
    });
  };

  // 주문 단건 조회
  const findOrderById: IOrderRepo["findOrderById"] = async (orderId, userId) => {
    return prismaClient.order.findUnique({ where: { orderId, userId } });
  };

  // 결제 완료 업데이트 (status=B, pgPaymentCode, paymentMethod, paidAt, reportId)
  const updateOrderPaid: IOrderRepo["updateOrderPaid"] = async (params) => {
    await prismaClient.order.update({
      where: { orderId: params.orderId },
      data: {
        orderStatus: "B",
        pgPaymentCode: params.pgPaymentCode,
        paymentMethod: params.paymentMethod,
        paidAt: params.paidAt,
        reportId: params.reportId,
      },
    });
  };

  return { createOrder, findOrderById, updateOrderPaid };
};
