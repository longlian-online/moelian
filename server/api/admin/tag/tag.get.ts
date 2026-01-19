import type { PageResponse } from '#shared/dto';
import { TagAdminListReq } from '#shared/dto/admin/tag';
import { listForAdmin } from '~/server/service/tag';
import { pick, map } from 'radash';
import { getResourceURLByID } from '~/server/service/resource';
import { ResourceType } from '~/server/lib/prisma';

export default defineWrappedResponseHandler(
	async (event): Promise<PageResponse<unknown>> => {
		const query = getQuery(event);
		const data = TagAdminListReq.parse(query);
		const { list, total } = await listForAdmin({
			equals: { id: data.id },
			like: { content: data.content },
			pagination: { page: data.page, limit: data.limit },
		});
		const baseUrl = useRuntimeConfig(event).storage.cos.url;
		return {
			total: total,
			list: await map(list, async (item) => {
				return {
					...pick(item, ['id', 'content', 'created_at', 'updated_at']),
					cover: await getResourceURLByID(
						item.cover_id,
						baseUrl,
						ResourceType.Cover,
					),
				};
			}),
		};
	},
);
