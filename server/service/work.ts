import type { Resource, Work } from '_db';
import * as dao from '../repository/work';
import * as tagDao from '~/server/repository/tag';
import {
	DATA_NOT_EXISTS,
	PARAMS_ERROR,
	TITLE_REPEAT,
	WORK_HAS_CHAPTER,
} from '../types/business_exception';
import {
	getLastChapterByWorkID,
	listChapterForIndex,
	listLastChapterByWorkIDs,
} from '~/server/repository/chapter';
import type {
	CreateWorkFormConsumerInput,
	DeleteWorkFromConsumerInput,
	EditWorkFromConsumerInput,
} from '../types/consumer';
import {
	MessageContentTypeMap,
	MessageLengthTypeMap,
	MessageSerialStatusMap,
} from '../types/consumer';
import { Status } from '../lib/prisma';
import logger from '../lib/winston';
import { workHasChapter } from './chapter';

type CreateWorkInput = dao.CreateWorkInput;

export const create = async (data: CreateWorkInput) => {
	await checkTitle(data.title);

	const work = await dao.create(data);
	return work;
};

// 检查标题是否重复
const hasRepeatTitle = async (title: string) => {
	const count = await dao.count({ title });
	return count !== 0;
};

const checkTitle = async (title: string) => {
	const hasRepeated = await hasRepeatTitle(title);
	if (hasRepeated) {
		throw new TITLE_REPEAT();
	}
};

export const deleteById = async (id: Work['id']) => {
	const work = await dao.getWorkByID(id);
	if (!work) {
		throw new DATA_NOT_EXISTS();
	}

	if (await workHasChapter(id)) {
		throw new WORK_HAS_CHAPTER();
	}

	await dao.deleteWorkAndResource({ id: id }, work.cover_id);
};

type ListForAdminInput = dao.ListForAdminInput;
export const listForAdmin = async (input: ListForAdminInput) => {
	return await dao.listForAdmin(input);
};

type UpdateInput = Required<Omit<dao.UpdateInput, 'cover_id' | 'status'>>;
export const updateByID = async (id: Work['id'], input: UpdateInput) => {
	const work = await dao.getWorkByID(id);
	if (!work) {
		throw new DATA_NOT_EXISTS();
	}

	await update(work, input);
};

export const update = async (work: Work, data: UpdateInput) => {
	if (
		data.title != work.title &&
		(await dao.count({ title: data.title })) > 0
	) {
		throw new TITLE_REPEAT();
	}
	await dao.updateById(work.id, data);
};

export const updateCover = async (id: Work['id'], coverId: Resource['id']) => {
	const rwaCoverId = await dao.getWorkCoverById(id);
	await dao.updateCover(id, coverId, rwaCoverId);
};

export const updateStatus = async (id: Work['id'], status: Work['status']) => {
	await dao.updateById(id, { status });
};

export type ListForWebInput = dao.ListForWebInput;
export const listForWeb = async (input: ListForWebInput) => {
	const { list, total } = await dao.listForWeb(input);
	if (total === 0) {
		return {
			list: [],
			total: 0,
		};
	}
	const workIDs = list.map((item) => item.id);
	const chapters = await listLastChapterByWorkIDs(workIDs);

	return {
		list: list.map((item) => {
			const chapter = chapters.find((chapter) => chapter.work_id === item.id);
			return {
				...item,
				lastNo: chapter?.no ?? null,
				chapterUpdatedAt: chapter?.created_at ?? null,
			};
		}),
		total,
	};
};

export const detailForWeb = async (id: Work['id']) => {
	const work = await dao.detailForWeb(id);
	if (!work) {
		throw new DATA_NOT_EXISTS();
	}
	const lastChapter = await getLastChapterByWorkID(work.id);

	const chapters = await listChapterForIndex({ workID: id });

	return {
		work,
		lastChapter: lastChapter,
		chapters,
	};
};

// 根据异步消息创建作品
export const createWorkFormConsumer = async (
	data: CreateWorkFormConsumerInput,
) => {
	const work = await dao.getWorkByBizNo(data.biz_no);
	if (work) {
		logger.warn(
			`create work form consumer fail,work biz_no (${work.biz_no}) already exist!`,
		);
		return;
	}

	try {
		await create({
			biz_no: data.biz_no,
			title: data.title,
			type_id: null,
			content_type: MessageContentTypeMap[data.content_type],
			author: data.author,
			description: data.description,
			status: Status.Disable,
			serial_status: MessageSerialStatusMap[data.serial_status],
			length_type: MessageLengthTypeMap[data.length_type],
			creator_id: null,
		});
	} catch (e) {
		if (e instanceof TITLE_REPEAT) {
			logger.warn(`work title(${data.title}) already exist!`);
			return;
		}
		throw e;
	}
};

export const updateWorkFormConsumer = async (
	data: EditWorkFromConsumerInput,
) => {
	const work = await dao.getWorkByBizNo(data.biz_no);
	if (!work) {
		logger.warn(`work title(${data.biz_no}) not exist!`);
		return;
	}

	try {
		await update(work, {
			title: data.title,
			type_id: null,
			content_type: MessageContentTypeMap[data.content_type],
			author: data.author,
			description: data.description,
			length_type: MessageLengthTypeMap[data.length_type],
			serial_status: work.serial_status,
		});
	} catch (e) {
		if (e instanceof TITLE_REPEAT) {
			logger.warn(`work title(${data.title}) already exist!`);
			return;
		}
		throw e;
	}
};

export const deleteWorkFromConsumer = async (
	data: DeleteWorkFromConsumerInput,
) => {
	const work = await dao.getWorkByBizNo(data.biz_no);
	if (!work) {
		logger.warn(`work(biz_no:${data.biz_no}) not exist!`);
		return;
	}
	await dao.deleteWorkAndResource({ bizNo: data.biz_no }, work.cover_id);
};

/**
 * 逻辑：1.校验作品是否存在 2.清空旧标签 3.绑定新标签
 */
export const updateWorkTags = async (workId: number, tagIds: number[]) => {
	const work = await dao.getWorkByID(workId);
	if (!work) throw new DATA_NOT_EXISTS();
	//校验 tagIds 是否存在且未删除
	const validCount = await tagDao.countValidTagsByIds(tagIds);
	if (validCount !== tagIds.length) throw new PARAMS_ERROR();
	await useDB().$transaction(async (tx) => {
		await dao.clearWorkTags(workId, tx);
		await dao.batchBindWorkTags(workId, tagIds, tx);
	});
};
