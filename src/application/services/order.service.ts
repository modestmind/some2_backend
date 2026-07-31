import type { IOrderRepo } from "../contracts/order-repo.contract.js";
import type { ISajuReportRepo } from "../contracts/saju-report-repo.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import { getKstNow } from "../../shared/utils/date.util.js";

const FIXED_REPORT_PRICE = 3300;
const REPORT_PRODUCT_NAME = "썸 손절 판별 리포트";

export const createOrderService = (
  createOrder: IOrderRepo["createOrder"],
  findOrderById: IOrderRepo["findOrderById"],
  updateOrderPaid: IOrderRepo["updateOrderPaid"],
  createSajuReport: ISajuReportRepo["createSajuReport"],
  confirmTossPayment: (params: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }) => Promise<{ paymentKey: string; method: string }>,
) => {
  const initOrder = async (params: {
    userId: string;
    sajuProfileId: bigint;
    paymentAmount: number;
  }) => {
    // 결제금액 서버 측 검증
    if (params.paymentAmount !== FIXED_REPORT_PRICE) {
      throw new BusinessException("결제 금액이 올바르지 않습니다.");
    }

    const { orderId } = await createOrder({
      userId: params.userId,
      sajuProfileId: params.sajuProfileId,
      productName: REPORT_PRODUCT_NAME,
      paymentAmount: params.paymentAmount,
    });

    return { order_id: orderId };
  };

  const confirmOrder = async (params: {
    userId: string;
    paymentKey: string;
    orderId: string;
    amount: number;
  }) => {
    // 주문 조회
    const order = await findOrderById(params.orderId, params.userId);
    if (!order) {
      throw new BusinessException("존재하지 않는 주문입니다.");
    }

    // 이미 결제완료인 경우 멱등성 보장
    if (order.orderStatus === "B") {
      return { order_id: order.orderId, report_id: order.reportId! };
    }

    // 주문접수(A)가 아닌 경우 처리 불가
    if (order.orderStatus !== "A") {
      throw new BusinessException("처리할 수 없는 주문 상태입니다.");
    }

    // Toss 결제 승인 API 호출
    const tossResult = await confirmTossPayment({
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      amount: params.amount,
    });

    // SajuReport 초기 레코드 생성 (status='A': 작성중)
    const { reportId } = await createSajuReport({
      sajuProfileId: order.sajuProfileId!,
      userId: order.userId,
    });

    // 주문 상태 결제완료(B)로 업데이트
    await updateOrderPaid({
      orderId: params.orderId,
      pgPaymentCode: tossResult.paymentKey,
      paymentMethod: tossResult.method,
      paidAt: getKstNow(),
      reportId,
    });

    return { order_id: params.orderId, report_id: reportId };
  };

  return { initOrder, confirmOrder };
};

export type OrderServiceType = ReturnType<typeof createOrderService>;
