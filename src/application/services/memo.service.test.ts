import { describe, it, expect, jest } from "@jest/globals";
import { createMemoService } from "./memo.service.js";
import { IMemoRepo } from "../contracts/memo-repo.contract.js";
import { IUserRepo } from "../contracts/user-repo.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";

describe("MemoService", () => {
  describe("getAllMemos", () => {
    it("존재하는 모든 메모를 추천 개수, 작성자 이름, 내 추천 여부와 함께 조회한다", async () => {
      // 테스트용 Mock 메모 데이터 (추천 개수, 작성자 이름, 내 추천 여부 포함)
      const mockMemos = [
        {
          id: 1,
          title: "첫 번째 메모",
          content: "내용1",
          userId: 2,
          createdAt: new Date(),
          recommendCount: 3,
          username: "김민지",
          isRecommended: true,
        },
        {
          id: 2,
          title: "두 번째 메모",
          content: "내용2",
          userId: 3,
          createdAt: new Date(),
          recommendCount: 0,
          username: "박준호",
          isRecommended: false,
        },
      ];

      // Mock findAll
      const mockFindAll = jest
        .fn<IMemoRepo["findAll"]>()
        .mockResolvedValue(mockMemos as any);

      // MemoService 생성
      const memoService = createMemoService(
        mockFindAll,
        jest.fn() as any,
        jest.fn() as any,
        jest.fn() as any,
        jest.fn() as any,
        jest.fn() as any,
      );

      // getAllMemos 호출
      const result = await memoService.getAllMemos(1);

      // 검증
      expect(result).toEqual(mockMemos);
      expect(mockFindAll).toHaveBeenCalledWith(1);
    });
  });

  describe("createMemo", () => {
    it("새로운 메모를 생성한다", async () => {
      // 테스트용 Mock 메모 데이터
      const newMemo = {
        id: 1,
        title: "새 메모",
        content: "내용",
        userId: 1,
        createdAt: new Date(),
      };

      // Mock 데이터
      const mockFindUserById = jest
        .fn<IUserRepo["findUserById"]>()
        .mockResolvedValue({ id: 1, email: "test@test.com" } as any);

      const mockCreate = jest
        .fn<IMemoRepo["create"]>()
        .mockResolvedValue(newMemo as any);

      // MemoService 생성
      const memoService = createMemoService(
        jest.fn() as any,
        mockCreate,
        mockFindUserById,
        jest.fn() as any,
        jest.fn() as any,
        jest.fn() as any,
      );

      // createMemo 호출
      const result = await memoService.createMemo({
        userId: 1,
        title: "새 메모",
        content: "내용",
      });

      // 검증
      expect(result).toEqual(newMemo);
      expect(mockCreate).toHaveBeenCalledWith({
        userId: 1,
        title: "새 메모",
        content: "내용",
      });
    });

    it("제목이나 내용에 금칙어가 포함되면 BusinessException을 던진다", async () => {
      // Mock 데이터
      const mockFindUserById = jest
        .fn<IUserRepo["findUserById"]>()
        .mockResolvedValue({ id: 1, email: "test@test.com" } as any);

      // MemoService 생성
      const memoService = createMemoService(
        jest.fn() as any,
        jest.fn() as any,
        mockFindUserById,
        jest.fn() as any,
        jest.fn() as any,
        jest.fn() as any,
      );

      // 금칙어 포함 테스트
      await expect(
        memoService.createMemo({
          userId: 1,
          title: "금칙어 테스트",
          content: "내용",
        }),
      ).rejects.toThrow(new BusinessException("게시글을 작성할 수 없습니다."));
    });

    it("해당 사용자가 존재하지 않으면 BusinessException을 던진다", async () => {
      // Mock 데이터 - 사용자 없음
      const mockFindUserById = jest
        .fn<IUserRepo["findUserById"]>()
        .mockResolvedValue(null);

      // MemoService 생성
      const memoService = createMemoService(
        jest.fn() as any,
        jest.fn() as any,
        mockFindUserById,
        jest.fn() as any,
        jest.fn() as any,
        jest.fn() as any,
      );

      // createMemo 호출 - 사용자가 없음
      await expect(
        memoService.createMemo({
          userId: 999,
          title: "새 메모",
          content: "내용",
        }),
      ).rejects.toThrow(new BusinessException("존재하지 않는 유저입니다."));

      expect(mockFindUserById).toHaveBeenCalledWith(999);
    });
  });

  describe("updateMemo", () => {
    it("소유자가 메모의 제목과 내용을 업데이트한다", async () => {
      // 기존 메모 데이터
      const existingMemo = {
        id: 1,
        title: "원래 제목",
        content: "원래 내용",
        userId: 1,
        createdAt: new Date(),
      };

      // 업데이트된 메모 데이터
      const updatedMemo = {
        id: 1,
        title: "수정된 제목",
        content: "수정된 내용",
        userId: 1,
        createdAt: new Date(),
      };

      // Mock 데이터
      const mockFindById = jest
        .fn<IMemoRepo["findById"]>()
        .mockResolvedValue(existingMemo as any);

      const mockUpdate = jest
        .fn<IMemoRepo["update"]>()
        .mockResolvedValue(updatedMemo as any);

      const mockFindUserById = jest
        .fn<IUserRepo["findUserById"]>()
        .mockResolvedValue({ id: 1, email: "test@test.com" } as any);

      // MemoService 생성
      const memoService = createMemoService(
        jest.fn() as any,
        jest.fn() as any,
        mockFindUserById,
        mockFindById,
        mockUpdate,
        jest.fn() as any,
      );

      // updateMemo 호출
      const result = await memoService.updateMemo({
        memoId: 1,
        userId: 1,
        title: "수정된 제목",
        content: "수정된 내용",
      });

      // 검증
      expect(result).toEqual(updatedMemo);
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        id: 1,
        title: "수정된 제목",
        content: "수정된 내용",
      });
    });

    it("소유자가 아닌 사용자가 메모를 업데이트하려면 BusinessException을 던진다", async () => {
      // 기존 메모 데이터 (소유자: userId=1)
      const existingMemo = {
        id: 1,
        title: "원래 제목",
        content: "원래 내용",
        userId: 1,
        createdAt: new Date(),
      };

      // Mock 데이터
      const mockFindById = jest
        .fn<IMemoRepo["findById"]>()
        .mockResolvedValue(existingMemo as any);

      const mockFindUserById = jest
        .fn<IUserRepo["findUserById"]>()
        .mockResolvedValue({ id: 1, email: "test@test.com" } as any);

      // MemoService 생성
      const memoService = createMemoService(
        jest.fn() as any,
        jest.fn() as any,
        mockFindUserById,
        mockFindById,
        jest.fn() as any,
        jest.fn() as any,
      );

      // updateMemo 호출 - 다른 사용자(userId=2)가 업데이트 시도
      await expect(
        memoService.updateMemo({
          memoId: 1,
          userId: 2,
          title: "수정된 제목",
          content: "수정된 내용",
        }),
      ).rejects.toThrow(
        new BusinessException("메모를 수정할 권한이 없습니다."),
      );
    });

    it("금칙어가 포함된 내용으로 메모를 업데이트하려면 BusinessException을 던진다", async () => {
      // 기존 메모 데이터
      const existingMemo = {
        id: 1,
        title: "원래 제목",
        content: "원래 내용",
        userId: 1,
        createdAt: new Date(),
      };

      // Mock 데이터
      const mockFindById = jest
        .fn<IMemoRepo["findById"]>()
        .mockResolvedValue(existingMemo as any);

      const mockFindUserById = jest
        .fn<IUserRepo["findUserById"]>()
        .mockResolvedValue({ id: 1, email: "test@test.com" } as any);

      // MemoService 생성
      const memoService = createMemoService(
        jest.fn() as any,
        jest.fn() as any,
        mockFindUserById,
        mockFindById,
        jest.fn() as any,
        jest.fn() as any,
      );

      // updateMemo 호출 - 금칙어 포함
      await expect(
        memoService.updateMemo({
          memoId: 1,
          userId: 1,
          title: "금칙어 테스트",
          content: "원래 내용",
        }),
      ).rejects.toThrow(new BusinessException("게시글을 작성할 수 없습니다."));
    });

    it("메모 작성자가 존재하지 않으면 BusinessException을 던진다", async () => {
      // 메모는 존재하지만 작성자가 없는 경우
      const existingMemo = {
        id: 1,
        title: "원래 제목",
        content: "원래 내용",
        userId: 999,
        createdAt: new Date(),
      };

      // Mock 데이터
      const mockFindById = jest
        .fn<IMemoRepo["findById"]>()
        .mockResolvedValue(existingMemo as any);

      const mockFindUserById = jest
        .fn<IUserRepo["findUserById"]>()
        .mockResolvedValue(null);

      // MemoService 생성
      const memoService = createMemoService(
        jest.fn() as any,
        jest.fn() as any,
        mockFindUserById,
        mockFindById,
        jest.fn() as any,
        jest.fn() as any,
      );

      // updateMemo 호출
      await expect(
        memoService.updateMemo({
          memoId: 1,
          userId: 999,
          title: "수정된 제목",
          content: "수정된 내용",
        }),
      ).rejects.toThrow(new BusinessException("존재하지 않는 유저입니다."));

      expect(mockFindUserById).toHaveBeenCalledWith(999);
    });
  });

  describe("deleteMemo", () => {
    it("소유자가 메모를 삭제한다", async () => {
      // 기존 메모 데이터
      const existingMemo = {
        id: 1,
        title: "원래 제목",
        content: "원래 내용",
        userId: 1,
        createdAt: new Date(),
      };

      // Mock 데이터
      const mockFindById = jest
        .fn<IMemoRepo["findById"]>()
        .mockResolvedValue(existingMemo as any);

      const mockDelete = jest
        .fn<IMemoRepo["delete"]>()
        .mockResolvedValue(existingMemo as any);

      // MemoService 생성
      const memoService = createMemoService(
        jest.fn() as any,
        jest.fn() as any,
        jest.fn() as any,
        mockFindById,
        jest.fn() as any,
        mockDelete,
      );

      // deleteMemo 호출
      const result = await memoService.deleteMemo({
        memoId: 1,
        userId: 1,
      });

      // 검증
      expect(result).toEqual(existingMemo);
      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockDelete).toHaveBeenCalledWith(1);
    });
  });
});
