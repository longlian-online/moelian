import type { Prisma, Tag, Resource } from '_db';
import type { PageRequestSchema } from '#shared/dto';
import { pagination, useDB } from '~/server/utils/db';
import dayjs from 'dayjs';
import { Status } from '_db';

export type ListForAdminInput = {
	equals: Partial<Pick<Tag, 'id'>>;
	like: Partial<Pick<Tag, 'content'>>;
	pagination: PageRequestSchema;
};
export type CreateTagInput = Pick<Tag, 'content'> & {
	cover_id: Tag['cover_id'];
};
export type UpdateTagInput = Partial<Pick<Tag, 'content' | 'cover_id'>>;

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
			include: { Cover: true },
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
	const now = dayjs().toDate();
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
			updated_at: dayjs().toDate(),
		},
	});
};

/**
 * 根据ID查询标签详情
 */
export const getById = async (id: Tag['id']) => {
	return useDB().tag.findFirst({
		where: { id, deleted_at: null },
		include: { Cover: true },
	});
};

export const deleteTagWithResource = async (
	id: Tag['id'],
	coverId: Resource['id'] | null,
) => {
	const sql: Prisma.PrismaPromise<unknown>[] = [
		useDB().tag.update({
			where: { id },
			data: { deleted_at: dayjs().toDate() },
		}),
	];
	if (coverId) {
		sql.push(
			useDB().resource.update({
				where: { id: coverId },
				data: { status: Status.Disable },
			}),
		);
	}
	return useDB().$transaction(sql);
};
export const deleteTag = async (id: Tag['id']) => {
	return useDB().tag.update({
		where: { id },
		data: { deleted_at: dayjs().toDate() },
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
	return useDB().workTags.count({
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
/**
 * 标签全量查询
 */
export const listAll = async () => {
	return useDB().tag.findMany({
		where: { deleted_at: null },
		include: { Cover: true },
		orderBy: [{ id: 'desc' }],
	});
};