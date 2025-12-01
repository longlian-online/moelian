import { z } from 'zod';
import { ResourceType } from '_db';

export const CreateResourceReq = z.object({
	type: z.enum(ResourceType),
	ext: z.string().min(1).max(16),
	size: z.coerce.number(),
});

export type CreateResourceRes = {
	id: number;
	url: string;
};
