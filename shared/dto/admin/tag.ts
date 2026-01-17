import { z } from 'zod';
import { PageRequestSchema } from '#shared/dto';

export const TagAdminListReq = PageRequestSchema.extend({
	id: z.coerce.number().optional(),
	content: z.string().optional(),
});

export const TagSaveReq = z.object({
	content: z.string().min(1, '标签名称不能为空'),
	img: z.string().optional(),
});

export const TagUpdateReq = TagSaveReq.extend({
	id: z.coerce.number().positive('标签ID必须为正整数'),
});

export const TagDeleteReq = z.object({
	id: z.coerce.number().positive('标签ID必须为正整数'),
});
