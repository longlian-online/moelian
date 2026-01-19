import type { Tag } from '_db';
import * as dao from '~/server/repository/tag';
import {
	DATA_NOT_EXISTS,
	TITLE_REPEAT,
	UNAUTHORIZED_OPERATION,
} from '~/server/types/business_exception';

export type ListForAdminInput = dao.ListForAdminInput;
export type CreateTagInput = dao.CreateTagInput;
export type UpdateTagInput = dao.UpdateTagInput;

export const listForAdmin = async (params: ListForAdminInput) => {
	return await dao.listForAdmin(params);
};

export const create = async (data: CreateTagInput) => {
	const existTag = await dao.getByContent(data.content);
	if (existTag) throw new TITLE_REPEAT();
	return await dao.create(data);
};

export const updateById = async (id: Tag['id'], data: UpdateTagInput) => {
	const tag = await dao.getById(id);
	if (!tag) throw new DATA_NOT_EXISTS();
	if (data.content && data.content !== tag.content) {
		const existTag = await dao.getByContent(data.content);
		if (existTag) throw new TITLE_REPEAT();
	}
	return await dao.update(id, data);
};

/**
 * 有关联 → 禁止删除，提示先解绑；无关联 → 直接删除
 */
export const deleteById = async (id: Tag['id']) => {
	const tag = await dao.getById(id);
	if (!tag) throw new DATA_NOT_EXISTS();

	const bindCount = await dao.countTagBindWork(id);
	if (bindCount > 0) {
		throw new UNAUTHORIZED_OPERATION();
	}
	return await dao.deleteTagWithResource(id, tag.cover_id);
};