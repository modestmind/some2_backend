import { jest, describe, test, expect } from "@jest/globals";
import { createOrderService } from "./order.service.js";
import type { IOrderRepo } from "../contracts/order-repo.contract.js";
import type { ISajuReportRepo } from "../contracts/saju-report-repo.contract.js";
import type { Order } from "../../generated/prisma/client.js";

const createMocks = (overrides?: {
  createOrder?: jest.Mock<IOrderRepo["createOrder"]>;
  findOrderById?: jest.Mock<IOrderRepo["findOrderById"]>;
  updateOrderPaid?: jest.Mock<IOrderRepo["updateOrderPaid"]>;
  createSajuReport?: jest.Mock<ISajuReportRepo["createSajuReport"]>;
  confirmTossPayment?: jest.Mock<(params: { paymentKey: string; orderId: string; amount: number }) => Promise<{ paymentKey: string; method: string }>>;
}) => ({
  createOrder: overrides?.createOrder ?? jest.fn<IOrderRepo["createOrder"]>(),
  findOrderById: overrides?.findOrderById ?? jest.fn<IOrderRepo["findOrderById"]>(),
  updateOrderPaid: overrides?.updateOrderPaid ?? jest.fn<IOrderRepo["updateOrderPaid"]>().mockResolvedValue(undefined),
  createSajuReport: overrides?.createSajuReport ?? jest.fn<ISajuReportRepo["createSajuReport"]>(),
  confirmTossPayment: overrides?.confirmTossPayment ?? jest.fn<(params: { paymentKey: string; orderId: string; amount: number }) => Promise<{ paymentKey: string; method: string }>>(),
});

const buildService = (overrides?: Parameters<typeof createMocks>[0]) => {
  const mocks = createMocks(overrides);
  const { initOrder, confirmOrder } = createOrderService(
    mocks.createOrder,
    mocks.findOrderById,
    mocks.updateOrderPaid,
    mocks.createSajuReport,
    mocks.confirmTossPayment,
  );
  return { mocks, initOrder, confirmOrder };
};

const fakeOrder: Order = {
  orderId: "order-uuid-001",
  userId: "u001",
  sajuProfileId: BigInt(1),
  productName: "썸 손절 판별 리포트",
  paymentAmount: 3300,
  paymentMethod: null,
  orderStatus: "A",
  orderedAt: new Date(),
  paidAt: null,
  pgPaymentCode: null,
  reportId: null,
};

describe("initOrder", () => {
  test("유효한 금액 3300원으로 주문 생성 시 order_id를 반환한다", async () => {
    const { mocks, initOrder } = buildService({
      createOrder: jest.fn<IOrderRepo["createOrder"]>().mockResolvedValue({ orderId: "order-uuid-001" }),
    });

    const result = await initOrder({
      userId: "u001",
      sajuProfileId: BigInt(1),
      paymentAmount: 3300,
    });

    expect(result).toEqual({ order_id: "order-uuid-001" });
    expect(mocks.createOrder).toHaveBeenCalledWith({
      userId: "u001",
      sajuProfileId: BigInt(1),
      productName: "썸 손절 판별 리포트",
      paymentAmount: 3300,
    });
  });
});

describe("initOrder — 엣지케이스", () => {
  test("결제 금액이 3300원이 아니면 BusinessException을 던지고 주문을 생성하지 않는다", async () => {
    const { mocks, initOrder } = buildService({
      createOrder: jest.fn<IOrderRepo["createOrder"]>(),
    });

    await expect(
      initOrder({ userId: "u001", sajuProfileId: BigInt(1), paymentAmount: 1000 }),
    ).rejects.toThrow("결제 금액이 올바르지 않습니다.");
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });
});

describe("confirmOrder", () => {
  test("상태가 A인 주문에 대해 정상 확인하면 order_id와 report_id를 반환한다", async () => {
    const { mocks, confirmOrder } = buildService({
      findOrderById: jest.fn<IOrderRepo["findOrderById"]>().mockResolvedValue(fakeOrder),
      confirmTossPayment: jest.fn<(params: { paymentKey: string; orderId: string; amount: number }) => Promise<{ paymentKey: string; method: string }>>()
        .mockResolvedValue({ paymentKey: "pk-toss-001", method: "카드" }),
      createSajuReport: jest.fn<ISajuReportRepo["createSajuReport"]>().mockResolvedValue({ reportId: "report-uuid-001" }),
    });

    const result = await confirmOrder({
      userId: "u001",
      paymentKey: "pk-toss-001",
      orderId: "order-uuid-001",
      amount: 3300,
    });

    expect(result).toEqual({ order_id: "order-uuid-001", report_id: "report-uuid-001" });
    expect(mocks.confirmTossPayment).toHaveBeenCalledWith({
      paymentKey: "pk-toss-001",
      orderId: "order-uuid-001",
      amount: 3300,
    });
    expect(mocks.updateOrderPaid).toHaveBeenCalledWith({
      orderId: "order-uuid-001",
      pgPaymentCode: "pk-toss-001",
      paymentMethod: "카드",
      paidAt: expect.any(Date),
      reportId: "report-uuid-001",
    });
    expect(mocks.createSajuReport).toHaveBeenCalledWith({
      sajuProfileId: BigInt(1),
      userId: "u001",
    });
  });

  test("존재하지 않는 orderId로 요청 시 BusinessException을 던진다", async () => {
    const { mocks, confirmOrder } = buildService({
      findOrderById: jest.fn<IOrderRepo["findOrderById"]>().mockResolvedValue(null),
    });

    await expect(
      confirmOrder({ userId: "u001", paymentKey: "pk-xxx", orderId: "not-exist-uuid", amount: 3300 }),
    ).rejects.toThrow("존재하지 않는 주문입니다.");
    expect(mocks.confirmTossPayment).not.toHaveBeenCalled();
  });

  test("Toss 결제 승인 API 오류 시 주문 상태를 변경하지 않고 에러를 전파한다", async () => {
    const { mocks, confirmOrder } = buildService({
      findOrderById: jest.fn<IOrderRepo["findOrderById"]>().mockResolvedValue(fakeOrder),
      confirmTossPayment: jest.fn<(params: { paymentKey: string; orderId: string; amount: number }) => Promise<{ paymentKey: string; method: string }>>()
        .mockRejectedValue(new Error("Toss 결제 오류")),
    });

    await expect(
      confirmOrder({ userId: "u001", paymentKey: "pk-fail", orderId: "order-uuid-001", amount: 3300 }),
    ).rejects.toThrow("Toss 결제 오류");
    expect(mocks.updateOrderPaid).not.toHaveBeenCalled();
    expect(mocks.createSajuReport).not.toHaveBeenCalled();
  });

  test("이미 결제완료(B)인 주문에 재요청 시 Toss API 호출 없이 즉시 order_id와 report_id를 반환한다", async () => {
    const paidOrder: Order = { ...fakeOrder, orderStatus: "B", reportId: "existing-report-uuid" };
    const { mocks, confirmOrder } = buildService({
      findOrderById: jest.fn<IOrderRepo["findOrderById"]>().mockResolvedValue(paidOrder),
    });

    const result = await confirmOrder({
      userId: "u001",
      paymentKey: "pk-toss-001",
      orderId: "order-uuid-001",
      amount: 3300,
    });

    expect(result).toEqual({ order_id: "order-uuid-001", report_id: "existing-report-uuid" });
    expect(mocks.confirmTossPayment).not.toHaveBeenCalled();
    expect(mocks.updateOrderPaid).not.toHaveBeenCalled();
    expect(mocks.createSajuReport).not.toHaveBeenCalled();
  });
});
