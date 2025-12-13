import { Prisma, type Chapter, type Resource } from '_db';
import { Status } from '_db';
import { pick } from 'radash';
import type { PageRequestSchema } from '#shared/dto';
import { ResourceType, type Work } from '../lib/prisma';
import dayjs from 'dayjs';

export type CreateChapterInput = Pick<
	Chapter,
	'content_type' | 'title' | 'no' | 'work_id' | 'biz_no'
>;
export const create = async (data: CreateChapterInput) => {
	return useDB().chapter.create({
		data: {
			...data,
			status: Status.Disable,
		},
	});
};

export type UpdateChapterInput = Partial<
	Pick<
		Chapter,
		'content_type' | 'title' | 'no' | 'work_id' | 'status' | 'deleted_at'
	>
>;
export const update = async (id: Chapter['id'], data: UpdateChapterInput) => {
	return useDB().chapter.update({ where: { id }, data });
};

export type UploadContentInput = Pick<Chapter, 'uploader_id' | 'total_page'> & {
	rawContentId: Resource['id'] | null;
	contentId: Resource['id'];
};
export const uploadContent = async (
	id: Chapter['id'],
	data: UploadContentInput,
) => {
	const sql = [
		useDB().chapter.update({
			where: { id },
			data: {
				...pick(data, ['uploader_id', 'total_page']),
				content_id: data.contentId,
			},
		}),
		useDB().resource.update({
			where: { id: data.contentId },
			data: {
				status: Status.Enable,
			},
		}),
	];
	if (data.rawContentId) {
		sql.push(
			useDB().resource.update({
				where: { id: data.rawContentId },
				data: { status: Status.Disable },
			}),
		);
	}

	await useDB().$transaction(sql);
};

export type ListForAdminInput = {
	equals: Partial<Pick<Chapter, 'id' | 'status' | 'work_id' | 'content_type'>>;
	like: Partial<Pick<Chapter, 'title'>>;
	pagination: PageRequestSchema;
};
export const listForAdmin = async (params: ListForAdminInput) => {
	const where: Prisma.ChapterWhereInput = {
		...params.equals,
		deleted_at: {
			equals: null,
		},
		title: {
			contains: params.like.title,
		},
	};

	const [total, list] = await Promise.all([
		useDB().chapter.count({ where }),
		useDB().chapter.findMany({
			where,
			...pagination(params.pagination),
			orderBy:[
				{
					priority: 'desc',
				},
				{
					id: 'desc',
				}
			]
		}),
	]);

	return {
		total,
		list,
	};
};

export const listChapterForIndex = async (params: { workID: Work['id'] }) => {
	return useDB().chapter.findMany({
		where: {
			work_id: params.workID,
			status: Status.Enable,
			deleted_at: { equals: null },
		},
		orderBy:[
			{
				priority: 'desc',
			},
			{
				id: 'desc',
			}
		]

	});
};

export const getById = async (id: Chapter['id']) => {
	return useDB().chapter.findFirst({ where: { id } });
};

export const getEnableById = async (id: Chapter['id']) => {
	return useDB().chapter.findFirst({
		where: { id, status: Status.Enable, deleted_at: { equals: null } },
	});
};

/**
 * 通过标题获取指定作品的章节
 * @param params 查询参数
 * @returns Chapter
 */
export const getWorkChapterByTitle = async (
	params: Pick<Chapter, 'work_id' | 'title'>,
) => {
	return useDB().chapter.findFirst({
		where: { ...params, deleted_at: { equals: null } },
	});
};

export const getChapterByBizID = async (bizID: Chapter['biz_no']) => {
	return useDB().chapter.findFirst({
		where: { biz_no: bizID },
	});
};

export const getChapterByContentID = async (id: number) => {
	return useDB().chapter.findFirst({
		where: {
			content_id: id,
		},
	});
};

export const count = async (
	params: Partial<Pick<Chapter, 'work_id' | 'title'>>,
) => {
	return useDB().chapter.count({
		where: {
			...params,
			deleted_at: {
				equals: null,
			},
		},
	});
};

export const getLastChapterByWorkID = async (id: Work['id']) => {
	return useDB().chapter.findFirst({
		where: {
			work_id: id,
		},
		orderBy: {
			id: 'desc',
		},
	});
};

export const listLastChapterByWorkIDs = async (ids: Work['id'][]) => {
	return await useDB().$queryRaw<Chapter[]>`
SELECT *
FROM (
        SELECT *, "row_number" () OVER (
                PARTITION BY
                    work_id
                ORDER BY ID DESC
            ) AS rn
        FROM "Chapter"
        WHERE
            "work_id" IN (${Prisma.join(ids)})
            AND "status"='Enable'
            AND "deleted_at" IS NULL
    )
WHERE
    rn = 1
    `;
};

export const getLastChapterByWorkIDs = async (id: Work['id']) => {
	return useDB().chapter.findFirst({
		where: { work_id: id, status: Status.Enable, deleted_at: { equals: null } },
		orderBy: { id: 'desc' },
	});
};

export const deleteChapter = async (
	chapterParams: { bizNo?: string; id?: Work['id'] },
	contentID: Resource['id'] | null,
	productID: Resource['id'] | null,
) => {
	if (!chapterParams.bizNo && !chapterParams.id) {
		throw new Error('查询参数不能全部为空');
	}
	const sql: Prisma.PrismaPromise<unknown>[] = [
		useDB().chapter.update({
			where: {
				id: chapterParams.id,
				biz_no: chapterParams.bizNo,
			},
			data: {
				deleted_at: dayjs().toDate(),
			},
		}),
	];
	// 如果源文件存在，则删除源文件
	if (contentID) {
		sql.push(
			useDB().resource.update({
				where: { id: contentID },
				data: {
					status: Status.Disable,
				},
			}),
		);
	}
	if (productID) {
		sql.push(
			useDB().resource.update({
				where: { id: productID },
				data: {
					status: Status.Disable,
				},
			}),
		);
	}

	return useDB().$transaction(sql);
};

/**
 * 漫画解压完成
 * 创建对应的 Resource 并关联到 Chapter
 */
export const mangaExtractCompleted = async (
	id: Chapter['id'],
	data: { key: string },
) => {
	return useDB().$transaction(async (tx) => {
		const product = await tx.resource.create({
			data: {
				type: ResourceType.ExtractManga,
				key: data.key,
				name: data.key,
				ext: '',
				size: 0,
				status: Status.Enable,
			} as Resource,
		});
		await tx.chapter.update({
			where: { id },
			data: {
				product_id: product.id,
			},
		});
	});
};

export const novelCopyCompleted = async (
	id: Chapter['id'],
	data: { key: string },
) => {
	return useDB().$transaction(async (tx) => {
		const resource = await tx.resource.create({
			data: {
				type: ResourceType.Novel,
				key: data.key,
				name: data.key,
				ext: 'docx',
				size: 0,
				status: Status.Enable,
			} as Resource,
		});
		await tx.chapter.update({
			where: { id },
			data: {
				content_id: resource.id,
			},
		});
	});
};

export const chapterUpdate = async (data: {
	id: number,
	priority: number,
	title: string,
}) => {
	return await useDB().chapter.update({
		where: {
			id: data.id,
		},
		data: {
			priority: data.priority,
			title: data.title,
		},
	})
};