import type { PageRequestSchema } from '~/shared/dto';
import type { Prisma, Resource, Work, ContentType } from '_db';
import { Status } from '_db';
import dayjs from 'dayjs';
import { pagination } from '~/server/utils/db';

export type CreateWorkInput = Omit<
	Work,
	| 'id'
	| 'latest_chapter'
	| 'content_updated_at'
	| 'created_at'
	| 'updated_at'
	| 'deleted_at'
	| 'cover_id'
>;

export const create = async (data: CreateWorkInput) => {
	return useDB().work.create({
		data,
	});
};

export type CountWorkInput = Pick<Work, 'title'>;
export const count = async (params: CountWorkInput) => {
	return useDB().work.count({
		where: {
			title: params.title,
			deleted_at: null,
		},
	});
};

export type ListForAdminInput = {
	equals?: Partial<
		Pick<
			Work,
			| 'id'
			| 'content_type'
			| 'length_type'
			| 'status'
			| 'type_id'
			| 'serial_status'
		>
	>;
	like?: Partial<Pick<Work, 'author' | 'title'>>;
	tagIds?: number[];
	pagination: PageRequestSchema;
};
export const listForAdmin = async (params: ListForAdminInput) => {
	const where: Prisma.WorkWhereInput = {
		...params.equals,
		title: {
			contains: params.like?.title,
		},
		author: {
			contains: params.like?.author,
		},
		deleted_at: {
			equals: null,
		},
	};
	const { tagIds } = params;
	const includeConfig = {
		Cover: true,
		workTags: {
			where: {
				tag: { deleted_at: null },
			},
			select: {
				tag: {
					select: { content: true },
				},
			},
		},
	};

	if (tagIds && tagIds.length > 0) {
		const tagCount = tagIds.length;
		const matchWorkIds = await useDB().workTags.findMany({
			select: { work_id: true },
			where: {
				tag_id: { in: tagIds },
				work: { deleted_at: null },
			},
			distinct: ['work_id', 'tag_id'],
			orderBy: { work_id: 'asc' },
		});
		const workTagCountMap = new Map<number, number>();
		matchWorkIds.forEach((item) => {
			workTagCountMap.set(
				item.work_id,
				(workTagCountMap.get(item.work_id) || 0) + 1,
			);
		});
		const workIds = Array.from(workTagCountMap.entries())
			.filter(([_, count]) => count === tagCount)
			.map(([id]) => id);

		const [total, list] = await Promise.all([
			useDB().work.count({ where: { ...where, id: { in: workIds } } }),
			useDB().work.findMany({
				include: includeConfig,
				where: { ...where, id: { in: workIds } },
				...pagination(params.pagination),
				orderBy: { id: 'desc' },
			}),
		]);
		return { total, list };
	}
	const [total, list] = await Promise.all([
		useDB().work.count({
			where,
		}),
		useDB().work.findMany({
			include: includeConfig,
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

export type UpdateInput = Partial<
	Pick<
		Work,
		| 'title'
		| 'type_id'
		| 'content_type'
		| 'author'
		| 'description'
		| 'length_type'
		| 'cover_id'
		| 'status'
		| 'serial_status'
	>
>;

export const updateById = async (id: Work['id'], data: UpdateInput) => {
	return useDB().work.update({
		where: {
			id,
		},
		data,
	});
};

/**
 * 更新作品封面，同时更新资源状态为已上传
 * @param workId
 * @param coverId
 * @param rawCoverId 原封面,如果没有原封面，则不传
 */
export const updateCover = async (
	workId: Work['id'],
	coverId: Resource['id'],
	rawCoverId: Resource['id'] | null,
) => {
	const sql = [
		useDB().work.update({
			where: { id: workId },
			data: { cover_id: coverId },
		}),
		useDB().resource.update({
			where: { id: coverId },
			data: { status: Status.Enable },
		}),
	];
	if (rawCoverId) {
		sql.push(
			useDB().resource.update({
				where: { id: rawCoverId },
				data: { status: Status.Disable },
			}),
		);
	}
	await useDB().$transaction(sql);
};

export const getWorkCoverById = async (id: Work['id']) => {
	const result = await useDB().work.findFirst({
		where: { id },
		select: { cover_id: true },
	});
	return result?.cover_id ?? null;
};

export const getWorkByID = async (id: Work['id']) => {
	return useDB().work.findFirst({
		where: { id },
	});
};

export const getWorkByBizNo = async (bizID: Work['biz_no']) => {
	return useDB().work.findFirst({
		where: { biz_no: bizID },
	});
};

export const getWorkByTitle = async (title: string) => {
	return useDB().work.findFirst({
		where: { title, deleted_at: { equals: null } },
	});
};

export type ListForWebInput = {
	type: ContentType;
	page: PageRequestSchema;
	key?: string;
};
export const listForWeb = async (params: ListForWebInput) => {
	const where: Prisma.WorkWhereInput = {
		content_type: params.type,
		deleted_at: { equals: null },
		status: Status.Enable,
	};
	if (params.key) {
		where.OR = [
			{ title: { contains: params.key } },
			{ author: { contains: params.key } },
		];
	}
	const [list, total] = await Promise.all([
		useDB().work.findMany({
			include: {
				Cover: true,
			},
			where,
			orderBy: { id: 'desc' },
			...pagination(params.page),
		}),
		useDB().work.count({ where }),
	]);

	return { list, total };
};

export const detailForWeb = async (id: Work['id']) => {
	return useDB().work.findFirst({
		where: { id, status: Status.Enable, deleted_at: { equals: null } },
		include: {
			Cover: true,
		},
	});
};

export const deleteWorkAndResource = async (
	workParams: Partial<Pick<Work, 'id'>> & { bizNo?: string },
	coverId: Resource['id'] | null,
) => {
	if (!workParams.bizNo && !workParams.id) {
		throw new Error('查询参数不能全部为空');
	}
	const sql: Prisma.PrismaPromise<unknown>[] = [
		useDB().work.update({
			where: {
				id: workParams.id,
				biz_no: workParams.bizNo,
			},
			data: {
				deleted_at: dayjs().toDate(),
			},
		}),
	];
	if (coverId) {
		sql.push(
			useDB().resource.update({
				where: {
					id: coverId,
				},
				data: {
					status: Status.Disable,
				},
			}),
		);
	}
	return useDB().$transaction(sql);
};

/**
 * 清空指定作品的所有标签绑定
 */
export const clearWorkTags = async (
	workId: number,
	tx: Prisma.TransactionClient = useDB()
) => {
	return tx.workTags.deleteMany({
		where: { work_id: workId },
	});
};

/**
 * 给作品批量绑定新标签
 */
export const batchBindWorkTags = async (
	workId: number,
	tagIds: number[],
	tx: Prisma.TransactionClient = useDB()
) => {
	if (tagIds.length === 0) return { count: 0 };
	const now = new Date();
	return tx.workTags.createMany({
		data: tagIds.map((tagId) => ({
			work_id: workId,
			tag_id: tagId,
			created_at: now,
		})),
		skipDuplicates: true,
	});
};
