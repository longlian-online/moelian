import * as dao from '~/server/repository/user';
import { Status } from '../lib/prisma';
import type { Role, User } from '../lib/prisma';
import bcrypt from 'bcrypt';
import {
	DATA_NOT_EXISTS,
	UNAUTHORIZED_OPERATION,
	USERNAME_REPEAT,
} from '../types/business_exception';
import dayjs from 'dayjs';

/**
 * 生成随机密码及对应哈希
 */
const passwordGen = async (): Promise<{
	rawPassword: string;
	hashPassword: string;
}> => {
	const password = generateRandomLetters();
	const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt());

	return {
		rawPassword: password,
		hashPassword: passwordHash,
	};
};

export type CreateUserInput = {
	username: string;
	role: Role;
};
/**
 * @description 管理端创建用户，只需最少量的输入参数，其余都随机，用户自行修改
 */
export const adminCreate = async (
	data: CreateUserInput,
): Promise<Pick<User, 'nickname' | 'username' | 'password'>> => {
	if (await hasRepeatUsername(data.username)) {
		throw new USERNAME_REPEAT();
	}

	const { rawPassword, hashPassword } = await passwordGen();

	const user = await dao.create({
		username: data.username,
		nickname: data.username,
		password: hashPassword,
		avatar_id: null,
		role: data.role,
		status: Status.Enable,
	});

	return {
		username: user.username,
		nickname: user.nickname,
		password: rawPassword,
	};
};

/**
 * @description 基于小写字母随机生成指定长度字符串
 * @param length 生成的字符串长度
 * @returns 生成的随机字符串
 */
const generateRandomLetters = (length: number = 6): string => {
	let result = '';
	for (let i = 0; i < length; i++) {
		result += String.fromCharCode(97 + Math.floor(Math.random() * 26)); // 97 = 'a', 122 = 'z'
	}
	return result;
};

/**
 * @param username 用户名
 * @returns 输入用户名在数据库中是否以及存在
 */
const hasRepeatUsername = async (username: string): Promise<boolean> => {
	const user = await dao.findUserByUsername(username);
	return user !== null;
};

export const resetUserPassword = async (id: User['id']): Promise<string> => {
	const user = await dao.findUserByID(id);
	if (!user) {
		throw new DATA_NOT_EXISTS();
	}
	if (user.username === 'admin') {
		throw new UNAUTHORIZED_OPERATION();
	}
	const { rawPassword, hashPassword } = await passwordGen();

	await dao.update(id, { password: hashPassword });
	return rawPassword;
};

export const updateUserStatus = async (id: User['id'], status: Status) => {
	const user = await dao.findUserByID(id);
	if (!user) {
		throw new DATA_NOT_EXISTS();
	}
	if (user.username === 'admin') {
		throw new UNAUTHORIZED_OPERATION();
	}
	await dao.update(id, { status });
};

export const deleteUser = async (id: User['id']): Promise<void> => {
	const user = await dao.findUserByID(id);
	if (!user) {
		throw new DATA_NOT_EXISTS();
	}
	if (user.username === 'admin') {
		throw new UNAUTHORIZED_OPERATION();
	}
	await dao.update(id, { deleted_at: dayjs().toDate() });
};

export const listForAdmin = async (input: dao.ListForAdminInput) => {
	return dao.listForAdmin(input);
};

export const updatePassword = async (id: User['id'], newPassword: string) => {
	const user = await dao.findUserByID(id);
	if (!user) {
		throw new DATA_NOT_EXISTS();
	}
	if (user.username === 'admin') {
		throw new UNAUTHORIZED_OPERATION();
	}

	const passwordHash = await bcrypt.hash(newPassword, await bcrypt.genSalt());
	await dao.update(id, { password: passwordHash });
};
