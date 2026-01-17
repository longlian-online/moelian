import type { Prisma, Tag } from '_db';
import type { PageRequestSchema } from '#shared/dto';
import { pagination, useDB } from '~/server/utils/db';

export type ListForAdminInput = {
	equals: Partial<Pick<Tag, 'id'>>;
	like: Partial<Pick<Tag, 'content'>>;
	pagination: PageRequestSchema;
};
export type CreateTagInput = Pick<Tag, 'content'> & { img: Tag['img'] };
export type UpdateTagInput = Partial<Pick<Tag, 'content' | 'img'>>;

/**
 * 标签分页列表查询
 */
export const listForAdmin = async (params: ListForAdminInput) => {
	const where: Prisma.TagWhereInput = {
		...params.equals,
		content: params.like.content
			? { contains: params.like.content }
			: undefined,
		deleted_at: null,
	};

	const [total, list] = await Promise.all([
		useDB().tag.count({ where }),
		useDB().tag.findMany({
			where,
			...pagination(params.pagination),
			orderBy: [{ id: 'desc' }, { content: 'asc' }],
		}),
	]);
	return { total, list };
};

/**
 * 新增标签
 */
export const create = async (data: CreateTagInput) => {
	const now = new Date();
	return useDB().tag.create({
		data: {
			...data,
			created_at: now,
			updated_at: now,
		},
	});
};

/**
 * 修改标签(名称/封面)
 */
export const update = async (id: Tag['id'], data: UpdateTagInput) => {
	return useDB().tag.update({
		where: { id },
		data: {
			...data,
			updated_at: new Date(),
		},
	});
};

/**
 * 根据ID查询标签详情
 */
export const getById = async (id: Tag['id']) => {
	return useDB().tag.findFirst({ where: { id, deleted_at: null } });
};

/**
 * 删除标签
 */
export const deleteTag = async (id: Tag['id']) => {
	return useDB().tag.update({
		where: { id },
		data: { deleted_at: new Date() },
	});
};

/**
 * 根据标签名查重
 */
export const getByContent = async (content: string) => {
	return useDB().tag.findFirst({ where: { content, deleted_at: null } });
};

/**
 * 查询标签是否被作品绑定
 */
export const countTagBindWork = async (id: Tag['id']) => {
	return useDB().work_tags.count({
		where: {
			tag_id: id,
			tag: { deleted_at: null },
		},
	});
};
/**
 * 校验标签
 */
export const countValidTagsByIds = async (ids: number[]) => {
	if (ids.length === 0) return 0;
	return useDB().tag.count({
		where: {
			id: { in: ids },
			deleted_at: null,
		},
	});
};