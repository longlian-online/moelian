import { prisma } from "~/server/lib/prisma";

export const useDB = () => {
  return prisma;
};

export function pagination(data: { page: number; limit: number }) {
  const { page, limit } = data;
  return {
    skip: (page - 1) * limit,
    take: limit
  };
}
