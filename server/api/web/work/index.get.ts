import type { WorkListRes } from '#shared/dto/web/work';
import { WorkListReq } from '#shared/dto/web/work';
import { listForWeb } from '~/server/service/work';
import { getResourceURL } from '~/server/service/resource';
import { ResourceType } from '_db';
import { map } from 'radash';

export default defineWrappedResponseHandler(
	async (event): Promise<WorkListRes> => {
		const data = WorkListReq.parse(await getQuery(event));

		const { list, total } = await listForWeb({
			type: data.type,
			page: {
				page: data.page,
				limit: 24,
			},
			key: data.key,
		});

		const baseUrl = useRuntimeConfig(event).storage.cos.url;
		return {
			total,
			list: await map(list, async (item) => {
				const tags = item.workTags
					.map((workTag) => workTag.tag?.content)
					.filter((content) => content !== undefined);
				return {
					id: item.id,
					title: item.title,
					coverUrl: getResourceURL(item.Cover, baseUrl, ResourceType.Cover),
					author: item.author,
					lengthType: item.length_type,
					serialType: item.serial_status,
					lastNo: item.lastNo,
					description: item.description,
					chapterUpdatedAt: item.chapterUpdatedAt,
					tags: tags,
				};
			}),
		};
	},
);
