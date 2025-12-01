import { z } from 'zod';
import { PageRequestSchema, PasswordSchema, UsernameSchema } from '../';
import { Role, Status } from '_db';
import type { User } from '_db';

export const CreateUserReq = z.object({
	username: UsernameSchema,
	role: z.enum(Role),
});

export type CreateUserRes = {
	username: string;
	nickname: string;
	password: string;
};

export const UserAdminListReq = z.strictObject({
	nickname: z.string().optional(),
	username: z.string().optional(),
	role: z.enum(Role).optional(),
	status: z.enum(Status).optional(),
	id: z.coerce.number().min(1).optional(),
	...PageRequestSchema.shape,
});
export type UserAdminListReq = z.infer<typeof UserAdminListReq>;

export type UserAdminListItem = Omit<
	User,
	'updated_at' | 'deleted_at' | 'password' | 'avatar_id'
> & { avatar: string };
export type UserAdminListRes = {
	list: UserAdminListItem[];
	total: number;
};

export type ResetPasswordRes = {
	newPassword: string;
};

export const UpdateUserStatusReq = z.object({
	status: z.enum(Status),
});

export const UpdatePasswordReq = z.object({
	newPassword: PasswordSchema,
});
export type UpdatePasswordReq = z.infer<typeof UpdatePasswordReq>;
