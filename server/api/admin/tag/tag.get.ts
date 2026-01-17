import type { PageResponse } from '#shared/dto';
import { TagAdminListReq } from '#shared/dto/admin/tag';
import { listForAdmin } from '~/server/service/tag';

export default defineWrappedResponseHandler(
	async (event): Promise<PageResponse<unknown>> => {
		const query = TagAdminListReq.parse(getQuery(event));
		const { list, total } = await listForAdmin({
			equals: { id: query.id },
			like: { content: query.content },
			pagination: { page: query.page, limit: query.limit },
		});

		return {
			list: list.map((item) => ({
				id: item.id,
				content: item.content,
				img: item.img,
			})),
			total,
		};
	},
);
