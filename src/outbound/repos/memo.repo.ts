import { IMemoRepo } from "../../application/contracts/memo-repo.contract.js";
import { prismaClient } from "./prismaClinet.js";

export const createMemoRepo = (): IMemoRepo => {
  const findAll: IMemoRepo["findAll"] = async (userId: number) => {
    const memos = await prismaClient.article.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { recommendedBy: true } },
        user: { select: { username: true } },
        recommendedBy: { where: { userId }, select: { id: true } },
      },
    });

    return memos.map(({ _count, user, recommendedBy, ...memo }) => ({
      ...memo,
      recommendCount: _count.recommendedBy,
      username: user.username,
      isRecommended: recommendedBy.length > 0,
    }));
  };

  const create: IMemoRepo["create"] = async (params) => {
    const newMemo = await prismaClient.article.create({
      data: {
        title: params.title,
        content: params.content,
        userId: params.userId,
      },
    });
    return newMemo;
  };

  const findById: IMemoRepo["findById"] = async (id: number) => {
    const memo = await prismaClient.article.findUnique({
      where: { id },
    });
    return memo;
  };

  const update: IMemoRepo["update"] = async (params) => {
    const updatedMemo = await prismaClient.article.update({
      where: { id: params.id },
      data: {
        ...(params.title && { title: params.title }),
        ...(params.content && { content: params.content }),
      },
    });
    return updatedMemo;
  };

  const deleteMemo: IMemoRepo["delete"] = async (id: number) => {
    const deletedMemo = await prismaClient.article.delete({
      where: { id },
    });
    return deletedMemo;
  };

  return { findAll, create, findById, update, delete: deleteMemo };
};
