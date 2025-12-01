import { expect, test, vi, describe } from "vitest";
import { adminCreate } from "~/server/service/user";
import type { CreateUserInput } from "~/server/service/user";
import { USERNAME_REPEAT } from "~/server/types/business_exception";
import { Status, Role } from "~/server/lib/prisma";

vi.mock("~/server/repository/user");

describe("user service", () => {
  describe("adminCreate", () => {
    const mockCreateInput: CreateUserInput = {
      username: "testuser",
      role: Role.Normal
    };

    const mockUser = {
      id: 1,
      created_at: new Date(),
      updated_at: new Date(),
      nickname: "testuser",
      role: Role.Normal,
      password: "hashed_password",
      status: Status.Enable,
      username: "testuser",
      deleted_at: null,
      avatar_id: null
    };

    test("用户名重复时抛出USERNAME_REPEAT", async () => {
      const { findUserByUsername: findUserByUsername, create } = await import("~/server/repository/user");
      vi.mocked(findUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(create).mockResolvedValue(mockUser);

      await expect(adminCreate(mockCreateInput)).rejects.toThrow(USERNAME_REPEAT);
    });

    test("用户名不重复时创建成功", async () => {
      const { findUserByUsername: findUserByUsername, create } = await import("~/server/repository/user");
      vi.mocked(findUserByUsername).mockResolvedValue(null);
      vi.mocked(create).mockResolvedValue(mockUser);

      const result = await adminCreate(mockCreateInput);

      expect(result.username).toBe(mockUser.username);
      expect(result.nickname).toBe(mockUser.nickname);
      expect(result.password).toBeDefined();
      expect(typeof result.password).toBe("string");
      expect(result.password.length).toBeGreaterThan(0);

      expect(create).toHaveBeenCalledWith({
        username: mockCreateInput.username,
        nickname: mockCreateInput.username,
        password: expect.any(String),
        avatar_id: null,
        role: mockCreateInput.role,
        status: Status.Enable
      });
    });
  });
});