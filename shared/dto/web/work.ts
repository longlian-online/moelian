import { z } from 'zod';
import { WebPage } from '.';
import { ContentType, type LengthType, type SerialStatus } from '_db';

export const WorkListReq = z.object({
	page: WebPage,
	type: z.enum(ContentType),
	key: z.string().max(100).optional(),
});

/**
 * lastXXX 相关字段可能为null, 因为该作品可能还没上传章节
 */
export type WorkListRes = {
	total: number;
	list: {
		id: number;
		title: string;
		coverUrl: string;
		author: string;
		lengthType: LengthType;
		serialType: SerialStatus;
		lastNo: number | null;
		description: string;
		chapterUpdatedAt: Date | null;
		tags: string[];
	}[];
};

/**
 * lastXXX 相关字段可能为null, 因为该作品可能还没上传章节
 */
export type WorkDetailRes = {
	id: number;
	title: string;
	coverUrl: string;
	author: string;
	lengthType: LengthType;
	serialType: SerialStatus;
	lastNo: number | null;
	lastChapterName: string | null;
	description: string;
	chapterUpdatedAt: Date | null;
	chapterList: WorkDetailChapterItem[];
	tags: string[];
};

export type WorkDetailChapterItem = {
	id: number;
	title: string;
	no: number;
};

/**
 * manga 和 novel 是否为空需要根据 type 定
 *
 */
export type WorkContentRes = {
	type: ContentType;
	manga?: {
		urls: string[];
	};
	novel?: {
		url: string;
	};
	chapters: WorkDetailChapterItem[];
};

export type WorkListReq = z.infer<typeof WorkListReq>;
