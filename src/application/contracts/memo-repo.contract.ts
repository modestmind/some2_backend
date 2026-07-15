import { Article } from "../../generated/prisma/client.js";

export interface IMemoRepo {
  findAll: (userId: number) => Promise<
    (Article & {
      recommendCount: number;
      username: string;
      isRecommended: boolean;
    })[]
  >;
  create: (params: {
    userId: number;
    title: string;
    content: string;
  }) => Promise<Article>;
  findById: (id: number) => Promise<Article | null>;
  update: (params: {
    id: number;
    title?: string;
    content?: string;
  }) => Promise<Article>;
  delete: (id: number) => Promise<Article>;
}
