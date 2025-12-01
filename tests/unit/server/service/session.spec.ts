import { expect, test, vi, describe } from "vitest";
import { login } from "~/server/service/session";
import {
  USERNAME_OR_PASSWORD_ERROR,
  USER_DISABLE
} from "~/server/types/business_exception";
import bcrypt from "bcrypt";
import { Status, Role } from "_db";
import { findUserByUsernameWithAvatar } from "~/server/repository/user";
import { ResourceType } from "~/server/lib/prisma";

vi.mock("~/server/repository/user");

describe("session service", () => {
  describe("createSession", () => {
    const mockUser = {
      id: 1,
      created_at: new Date(),
      updated_at: new Date(),
      nickname: "Test User",
      role: Role.SuperAdmin,
      password: bcrypt.hashSync("hashed_password", bcrypt.genSaltSync()),
      status: Status.Enable,
      username: "testuser",
      deleted_at: null,
      avatar_id: 1,
      Avatar: {
        name: "1",
        id: 1,
        created_at: new Date(),
        updated_at: new Date(),
        status: Status.Enable,
        type: ResourceType.Avatar,
        key: "123",
        ext: "jpg",
        size: 1,
      }
    };

    test("用户名不存在时抛出USERNAME_OR_PASSWORD_ERROR", async () => {
      vi.mocked(findUserByUsernameWithAvatar).mockResolvedValue(null);

      await expect(
        login({ username: "invalid", password: "password", cosBaseUrl: "xxx" })
      ).rejects.toThrow(USERNAME_OR_PASSWORD_ERROR);
    });

    test("密码不匹配时抛出USERNAME_OR_PASSWORD_ERROR", async () => {
      vi.mocked(findUserByUsernameWithAvatar).mockResolvedValue(mockUser);
      await expect(
        login({ username: "testuser", password: "wrongpassword", cosBaseUrl: "xxx" })
      ).rejects.toThrow(USERNAME_OR_PASSWORD_ERROR);
    });

    test("用户状态为禁用时抛出USER_DISABLE", async () => {
      const disabledUser = { ...mockUser, status: Status.Disable };
      vi.mocked(findUserByUsernameWithAvatar).mockResolvedValue(disabledUser);

      await expect(
        login({
          username: mockUser.username,
          password: "hashed_password",
          cosBaseUrl: "xxx"
        })
      ).rejects.toThrow(USER_DISABLE);
    });

    test("登录成功时返回UserSession", async () => {
      vi.mocked(findUserByUsernameWithAvatar).mockResolvedValue(mockUser);

      const result = await login({
        username: mockUser.username,
        password: "hashed_password",
        cosBaseUrl: "xx"
      });

      expect(result).not.toBeUndefined();
    });
  });
});
