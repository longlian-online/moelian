import { z } from 'zod';
import { ContentType, LengthType, Status, SerialStatus } from '_db';
import type { Work } from '_db';
import { PageRequestSchema } from '..';

export const WorkCreateReq = z.object({
	title: z.string().min(1, '标题不能为空').max(64, '标题最多64个字符'),
	typeId: z.number().min(1, '类型不能为空').optional(),
	contentType: z.enum(ContentType, '作品类型不能为空'),
	author: z.string().min(1, '作者不能为空').max(32, '作者名最多32个字符'),
	description: z.string().min(1, '描述不能为空').max(512, '描述最多512个字符'),
	lengthType: z.enum(LengthType, '长度类型不能为空'),
});

export type WorkCreateRes = {
	id: number;
	bizNo: string;
};

export const WorkPutReq = z.object({
	...WorkCreateReq.shape,
	serialStatus: z.enum(SerialStatus),
});

export const WorkCoverPatchReq = z.object({
	coverId: z.number().min(1, '封面错误'),
});

export const WorkStatusPatchReq = z.object({
	status: z.enum(Status),
});

export const WorkAdminListReq = z.strictObject({
	id: z.coerce.number().min(1).optional(),
	contentType: z.enum(ContentType).optional(),
	lengthType: z.enum(LengthType).optional(),
	status: z.enum(Status).optional(),
	typeId: z.coerce.number().min(1).optional(),
	serialStatus: z.enum(SerialStatus).optional(),
	author: z.string().min(1).max(32, '作者名最多32个字符').optional(),
	title: z
		.string()
		.min(1, '标题不能为空')
		.max(64, '标题最多64个字符')
		.optional(),
	tagIds: z.array(z.coerce.number().positive('标签ID必须为正整数')).optional(),
	...PageRequestSchema.shape,
});

export type WorkAdminListReq = z.infer<typeof WorkAdminListReq>;

export type WorkAdminListItem = Pick<
	Work,
	| 'id'
	| 'created_at'
	| 'author'
	| 'content_type'
	| 'length_type'
	| 'serial_status'
	| 'title'
	| 'status'
	| 'description'
	| 'biz_no'
> & {
	cover: string;
	tags: string[];
};
export type WorkAdminListRes = {
	list: WorkAdminListItem[];
	total: number;
};

export const WorkUpdateTagsReq = z.object({
	tag_ids: z
		.array(z.coerce.number().positive('标签ID必须为正整数'))
});
export type WorkCreateReq = z.infer<typeof WorkCreateReq>;
export type WorkPutReq = z.infer<typeof WorkPutReq>;
export type WorkCoverPatchReq = z.infer<typeof WorkCoverPatchReq>;
