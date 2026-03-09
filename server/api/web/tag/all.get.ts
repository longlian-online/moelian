import { pick, map } from 'radash';
import { getResourceURLByID } from '~/server/service/resource';
import { ResourceType } from '~/server/lib/prisma';
import { listAll } from '~/server/service/tag';

export default defineWrappedResponseHandler(async (event) => {
	const list = await listAll();
	const baseUrl = useRuntimeConfig(event).storage.cos.url;

	const result = await map(list, async (item) => {
		const workTotal = item.workTags?.length || 0;

		return {
			...pick(item, ['id', 'content']),
			cover: await getResourceURLByID(
				item.cover_id,
				baseUrl,
				ResourceType.Cover,
			),
			workTotal: workTotal,
		};
	});

	return result;
});
