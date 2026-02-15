import type { Chapter } from '_db';
import { Status } from '_db';
import * as dao from '~/server/repository/chapter';
import {
	DATA_NOT_EXISTS,
	RESOURCE_NOT_READY,
	TITLE_REPEAT,
} from '~/server/types/business_exception';
import logger from '../lib/winston';
import { getWorkByBizNo } from '../repository/work';
import type {
	CreateChapterFormConsumerInput,
	DeleteChapterFromConsumerInput,
	EditChapterFormConsumerInput,
} from '../types/consumer';
import { MessageContentTypeMap } from '../types/consumer';
import { uuidv7 } from 'uuidv7';
import { getDefaultResourceKeyByType, getResourceURLByID } from './resource';
import { ContentType, ResourceType } from '../lib/prisma';
import { getDirAllObjectURLMap, getDirAllObjectURLs } from './cos';
import { getResourceById, getResourceByKey } from '../repository/resource';
import type { WorkContentRes } from '~/shared/dto/web/work';
import { assign, objectify } from 'radash';

export type ListForAdminInput = dao.ListForAdminInput;
export const listForAdmin = async (params: ListForAdminInput) => {
	return dao.listForAdmin(params);
};

export const deleteById = async (id: Chapter['id']) => {
	const chapter = await dao.getById(id);
	if (!chapter) {
		throw new DATA_NOT_EXISTS();
	}
	await dao.deleteChapter({ id }, chapter.content_id, chapter.product_id);
};

export const updateStatus = async (id: Chapter['id'], status: Status) => {
	const chapter = await dao.getById(id);
	if (!chapter) {
		throw new DATA_NOT_EXISTS();
	}

	// 如果是上架，需要判断资源是否准备好
	if (status === Status.Enable && !productReady(chapter)) {
		throw new RESOURCE_NOT_READY();
	}
	await dao.update(id, { status });
};

// 内容是否准备好，漫画和小说的判断逻辑不同，漫画依据 product_id 是否存在，而小说依据 content_id 是否存在
// 因为漫画需要解压，content_id 为压缩包，product_id 为解压后的文件夹，小说不需要解压，源文件即内最终内容
export const productReady = (chapter: Chapter): boolean => {
	let productReady = false;
	if (chapter.content_type === ContentType.Manga) {
		productReady = chapter.product_id !== null;
	}
	if (chapter.content_type === ContentType.Novel) {
		productReady = chapter.content_id !== null;
	}

	return productReady;
};

export type UpdateChapterInput = Pick<Chapter, 'title'>;
export const updateByID = async (
	id: Chapter['id'],
	data: UpdateChapterInput,
) => {
	const chapter = await dao.getById(id);
	if (!chapter) {
		throw new DATA_NOT_EXISTS();
	}

	await update(chapter, data);
};

const update = async (chapter: Chapter, data: UpdateChapterInput) => {
	if (
		data.title != chapter.title &&
		(await dao.count({ title: data.title, work_id: chapter.work_id })) > 0
	) {
		throw new TITLE_REPEAT();
	}
	await dao.update(chapter.id, data);
};

export type UploadContentInput = Omit<dao.UploadContentInput, 'rawContentId'>;
export const uploadContent = async (
	id: Chapter['id'],
	data: UploadContentInput,
) => {
	await dao.uploadContent(id, {
		...data,
		rawContentId: (await dao.getById(id))?.content_id ?? null,
	});
};

export type CreateChapterInput = Omit<dao.CreateChapterInput, 'no'>;
export const create = async (data: CreateChapterInput) => {
	// 标题是否重复
	if ((await dao.count({ title: data.title, work_id: data.work_id })) > 0) {
		throw new TITLE_REPEAT();
	}

	// 获取编号
	const lastChapter = await dao.getLastChapterByWorkID(data.work_id);
	let no = 1;
	if (lastChapter) {
		no = lastChapter.no + 1;
	}

	const work = await dao.create({
		...data,
		no,
		biz_no: uuidv7(),
	});
	return work;
};

// 根据异步消息创建章节
export const createChapterFormConsumer = async (
	data: CreateChapterFormConsumerInput,
) => {
	// 检查 work 是否存在并获取ID
	const work = await getWorkByBizNo(data.work_biz_no);
	if (!work) {
		throw new Error(`${data.biz_no} not exist!`);
	}

	try {
		await create({
			biz_no: data.biz_no,
			work_id: work.id,
			title: data.title,
			content_type: MessageContentTypeMap[data.content_type],
		});
	} catch (e) {
		if (e instanceof TITLE_REPEAT) {
			logger.warn(`chapter title(${data.title}) already exist!`);
			return;
		}
		throw e;
	}
};

export const updateChapterFormConsumer = async (
	data: EditChapterFormConsumerInput,
) => {
	const chapter = await dao.getChapterByBizID(data.biz_no);
	if (!chapter) {
		// chapter 不存在，打印并返回
		throw new Error(`${data.biz_no} not exist!`);
	}

	try {
		await update(chapter, {
			title: data.title,
		});
	} catch (e) {
		if (e instanceof TITLE_REPEAT) {
			logger.warn(`chapter title(${data.title}) already exist!`);
			return;
		}
		throw e;
	}
};

export const deleteChapterFromConsumer = async (
	data: DeleteChapterFromConsumerInput,
) => {
	const chapter = await dao.getChapterByBizID(data.biz_no);
	if (!chapter) {
		throw new DATA_NOT_EXISTS();
	}
	await dao.deleteChapter(
		{ bizNo: data.biz_no },
		chapter.content_id,
		chapter.product_id,
	);
};

export const contentExtractHandler = async (
	key: string,
	type: 'Manga' | 'Novel',
) => {
	const resource = await getResourceByKey(key);
	if (!resource) {
		throw new DATA_NOT_EXISTS();
	}
	const chapter = await dao.getChapterByContentID(resource.id);
	if (!chapter) {
		throw new DATA_NOT_EXISTS();
	}

	let parts = key.split('.');
	if (parts.length !== 2) {
		logger.error('解压回调入参错误');
		return;
	}
	key = parts[0];

	parts = key.split('/');
	if (parts.length !== 2) {
		logger.error('解压回调入参错误');
		return;
	}

	const resourceType = (() => {
		switch (type) {
			case 'Manga':
				return ResourceType.ExtractManga;
			case 'Novel':
				return ResourceType.ExtractNovel;
		}
	})();

	key = `${resourceType}/${parts[1]}`;
	await dao.contentExtractCompleted(chapter.id, { key }, resourceType);
};

// 获取内容，如果是小说，直接返回源文件，如果是漫画，需要列出文件夹下所有文件
export const getContentByID = async (id: Chapter['id'], baseURL: string) => {
	const chapter = await dao.getEnableById(id);
	if (!chapter) {
		throw new DATA_NOT_EXISTS();
	}

	let res: WorkContentRes = {
		type: 'Manga',
		chapters: [],
	};
	switch (chapter.content_type) {
		case 'Manga': {
			res = {
				type: ResourceType.Manga,
				manga: {
					urls: await getMangaContent(chapter.product_id),
				},
				chapters: [],
			};
			break;
		}
		case 'Novel': {
			const content = await getNovelContent(chapter, baseURL);
			res = {
				type: ResourceType.Novel,
				novel: {
					...content,
				},
				chapters: [],
			};
		}
	}

	const chapters = await dao.listChapterForIndex({ workID: chapter.work_id });
	res.chapters = chapters.map((item) => ({
		id: item.id,
		title: item.title,
		no: item.no,
	}));

	return res;
};

const getMangaContent = async (resourceID: number | null) => {
	return getDirResourceWithDefault(resourceID, ResourceType.ExtractManga);
};

/**
 * 获取文件夹类型资源的所有文件链接，当该资源在数据库中无法获取时，返回默认的文件地址列表
 * @param resourceID 资源ID
 * @param resourceType 资源类型（用于在无法获取到资源的地址时返回默认文件地址列表）
 */
const getDirResourceWithDefault = async (
	resourceID: number | null,
	resourceType: ResourceType,
) => {
	let key = getDefaultResourceKeyByType(resourceType);

	if (resourceID) {
		const resource = await getResourceById(resourceID, Status.Enable);
		if (resource) {
			key = resource.key;
		}
	}

	return await getDirAllObjectURLs(key);
};


/**
 * 获取文件夹类型资源的所有文件链接，当该资源在数据库中无法获取时，返回默认的文件地址列表
 * @param resourceID 资源ID
 * @param resourceType 资源类型（用于在无法获取到资源的地址时返回默认文件地址列表）
 */
const getDirResourceMapWithDefault = async (
	resourceID: number | null,
	resourceType: ResourceType,
) => {
	let key = getDefaultResourceKeyByType(resourceType);

	if (resourceID) {
		const resource = await getResourceById(resourceID, Status.Enable);
		if (resource) {
			key = resource.key;
		}
	}

	return await getDirAllObjectURLMap(key);
};

/**
 * 获取小说内容链接
 * 存在两种小说内容的存储类型
 * 1. 旧版存储方式（仅一个DOCX文件）
 * 2. 新版存储方式（资源指向一个文件夹，文件夹下存在一个 index.json 和 相关资源）
 * 新版存储方式的小说将返回一个 record，键为文件名，值为文件地址
 * @param novel
 * @param baseUrl
 */
const getNovelContent = async (novel: Chapter, baseUrl: string) => {
	if (novel.product_id) {
		const urls = await getDirResourceMapWithDefault(
			novel.product_id,
			ResourceType.ExtractNovel,
		);

		const urlMap: Record<string, string> = {};
		for (const url of urls) {
			urlMap[url.key] = url.url
		}

		return {
			urlMap,
		};
	}
	if (novel.content_id) {
		return {
			url: await getResourceURLByID(
				novel.content_id,
				baseUrl,
				ResourceType.Novel,
			),
		};
	}
};

export const workHasChapter = async (workID: number) => {
	return (await dao.count({ work_id: workID })) > 0;
};

export const chapterUpdate = async (data: {
	id: number;
	priority: number;
	title: string;
}) => {
	return await dao.chapterUpdate(data);
};
