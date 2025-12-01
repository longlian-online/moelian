import { z } from 'zod';
import { ContentType, Status } from '_db';
import { PageRequestSchema } from '..';

export const ChapterCreateReq = z.object({
	title: z.string().min(1, '标题不能为空').max(128, '标题最多128个字符'),
	workId: z.number().min(1, '作品ID不能为空'),
	no: z.number().min(1, '章节号不能为空'),
	contentType: z.enum(ContentType, '内容类型不能为空'),
});

export const ChapterAdminListReq = z.strictObject({
	id: z.coerce.number().min(1).optional(),
	workId: z.coerce.number().min(1).optional(),
	status: z.enum(Status).optional(),
	contentType: z.enum(ContentType).optional(),
	title: z
		.string()
		.min(1, '标题不能为空')
		.max(128, '标题最多128个字符')
		.optional(),
	...PageRequestSchema.shape,
});

export type ChapterAdminListReq = z.infer<typeof ChapterAdminListReq>;

export const ChapterStatusPatchReq = z.object({
	status: z.enum(Status),
});

export const UploadContentReq = z.object({
	contentId: z.number().min(1, '内容ID不能为空'),
	totalPage: z.number().optional(),
});

export type ChapterAdminListItem = {
	id: number;
	bizNo: string;
	workId: number;
	no: number;
	title: string;
	contentType: ContentType;
	status: Status;
	uploaderId: number | null;
	createdAt: Date;
	productReady: boolean;
};
export type ChapterAdminListRes = {
	list: ChapterAdminListItem[];
	total: number;
};
