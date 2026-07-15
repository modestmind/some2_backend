import { IMemoRepo } from "../contracts/memo-repo.contract.js";
import { IUserRepo } from "../contracts/user-repo.contract.js";
import { BusinessException } from "../../shared/exceptions/business.exception.js";
import { containsForbiddenKeyword } from "../domain/memo.js";

export const createMemoService = (
  findAll: IMemoRepo["findAll"],
  create: IMemoRepo["create"],
  findUserById: IUserRepo["findUserById"],
  findById: IMemoRepo["findById"],
  update: IMemoRepo["update"],
  deleteMemoRepo: IMemoRepo["delete"],
) => {
  // 존재하는 모든 메모를 추천 개수, 내 추천 여부와 함께 조회
  const getAllMemos = async (userId: number) => {
    const memos = await findAll(userId);
    return memos;
  };

  // 새로운 메모 생성
  const createMemo = async (params: {
    userId: number;
    title: string;
    content: string;
  }) => {
    // 금칙어 검증
    if (containsForbiddenKeyword(params.title, params.content)) {
      throw new BusinessException("게시글을 작성할 수 없습니다.");
    }

    // 사용자 존재 확인
    const user = await findUserById(params.userId);
    if (!user) {
      throw new BusinessException("존재하지 않는 유저입니다.");
    }

    const newMemo = await create(params);
    return newMemo;
  };

  // 메모 업데이트
  const updateMemo = async (params: {
    memoId: number;
    userId: number;
    title?: string;
    content?: string;
  }) => {
    // 메모 존재 확인
    const memo = await findById(params.memoId);
    if (!memo) {
      throw new BusinessException("존재하지 않는 메모입니다.");
    }

    // 소유자 확인
    if (memo.userId !== params.userId) {
      throw new BusinessException("메모를 수정할 권한이 없습니다.");
    }

    // 메모 작성자 존재 확인
    const memoAuthor = await findUserById(memo.userId);
    if (!memoAuthor) {
      throw new BusinessException("존재하지 않는 유저입니다.");
    }

    // 금칙어 검증
    const title = params.title ?? memo.title;
    const content = params.content ?? memo.content;
    if (containsForbiddenKeyword(title, content)) {
      throw new BusinessException("게시글을 작성할 수 없습니다.");
    }

    // 메모 업데이트
    const updatedMemo = await update({
      id: params.memoId,
      title: params.title,
      content: params.content,
    });
    return updatedMemo;
  };

  // 메모 삭제
  const deleteMemo = async (params: { memoId: number; userId: number }) => {
    // 메모 존재 확인
    const memo = await findById(params.memoId);
    if (!memo) {
      throw new BusinessException("존재하지 않는 메모입니다.");
    }

    // 소유자 확인
    if (memo.userId !== params.userId) {
      throw new BusinessException("메모를 삭제할 권한이 없습니다.");
    }

    const deletedMemo = await deleteMemoRepo(params.memoId);
    return deletedMemo;
  };

  return { getAllMemos, createMemo, updateMemo, deleteMemo };
};

export type MemoServiceType = ReturnType<typeof createMemoService>;
