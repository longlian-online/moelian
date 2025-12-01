import type { Prisma, User } from '~/server/lib/prisma';
import { prisma } from '~/server/lib/prisma';
import type { PageRequestSchema } from '~/shared/dto';

export const findUserByID = async (id: User['id']) => {
	return prisma.user.findFirst({
		where: {
			id,
		},
	});
};

// 基于用户名查找用户
export const findUserByUsername = async (username: string) => {
	const user = await prisma.user.findFirst({
		where: {
			username: username,
			deleted_at: null,
		},
	});

	return user;
};

// 基于用户名查找用户
export const findUserByUsernameWithAvatar = async (username: string) => {
	const user = await prisma.user.findFirst({
		include: {
			Avatar: true,
		},
		where: {
			username: username,
			deleted_at: null,
		},
	});

	return user;
};

export type ListForAdminInput = {
	equals: Partial<Pick<User, 'role' | 'status' | 'id'>>;
	like: Partial<Pick<User, 'nickname' | 'username'>>;
	pagination: PageRequestSchema;
};
export const listForAdmin = async (params: ListForAdminInput) => {
	const mod = useDB().user;
	const where: Prisma.UserWhereInput = {
		...params.equals,
		nickname: {
			contains: params.like.nickname,
		},
		username: {
			contains: params.like.username,
		},
		deleted_at: {
			equals: null,
		},
	};

	const [total, list] = await Promise.all([
		mod.count({ where }),
		mod.findMany({
			where,
			...pagination(params.pagination),
			orderBy: {
				id: 'desc',
			},
		}),
	]);

	return {
		total,
		list,
	};
};

export type CreateUserInput = Pick<
	User,
	'username' | 'nickname' | 'password' | 'avatar_id' | 'role' | 'status'
>;

export const create = async (data: CreateUserInput) => {
	return useDB().user.create({ data });
};

export type UpdateUserInput = Partial<
	Pick<
		User,
		| 'username'
		| 'nickname'
		| 'password'
		| 'avatar_id'
		| 'role'
		| 'status'
		| 'deleted_at'
	>
>;
export const update = async (id: User['id'], data: UpdateUserInput) => {
	return useDB().user.update({ where: { id }, data });
};
