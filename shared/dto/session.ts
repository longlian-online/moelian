import { z } from "zod";
import type { Role } from "~/server/lib/prisma";

export const SessionCreateReq = z.object({
  username: z
    .string()
    .min(1, "用户名不能为空")
    .max(16, "用户名不能超过16个字符"),
  password: z
    .string()
    .min(1, "密码不能为空")
    .max(32, "密码不能超过32个字符")
});

export type SessionCreateRes = {
  id: number,
  nickname: string,
  role: Role
  avatar: string
}


