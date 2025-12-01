import {
	CreateResourceReq,
	type CreateResourceRes,
} from '#shared/dto/admin/resource';
import { create } from '~/server/service/resource';

export default defineWrappedResponseHandler(
	async (event): Promise<CreateResourceRes> => {
		const data = CreateResourceReq.parse(await readBody(event));

		return await create({
			ext: data.ext,
			type: data.type,
			size: data.size,
		});
	},
);
