import { z } from "zod";

export type PageResponse<T> = {
  list: T[];
  total: number;
};

export const PageRequestSchema = z.object({
  page: z.coerce.number().min(1),
  limit: z.coerce
    .number()
    .min(1)
    .max(100)
});

export type PageRequestSchema = z.infer<typeof PageRequestSchema>;

export type PageRequest<T> = PageRequestSchema &
  {
    [K in keyof T]?: T[K];
  };

export function EmptyPageResult() {
  return {
    list: [],
    total: 0
  };
}
export function PageResult<T>(list: T[], total: number) {
  return {
    list,
    total
  } as PageResponse<T>;
}

export * from "./user";
