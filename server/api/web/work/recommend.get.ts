import type { WorkListRes } from '#shared/dto/web/work';
import { RecommendReq } from '#shared/dto/web/work';
import { recommendWorks } from '~/server/service/work';
import { getResourceURL } from '~/server/service/resource';
import { ResourceType } from '_db';
import { map } from 'radash';

export default defineWrappedResponseHandler(
	async (event): Promise<WorkListRes> => {
		const data = RecommendReq.parse(await getQuery(event));

		const list = await recommendWorks({
			workId: data.id,
			limit: data.limit,
		});
		const baseUrl = useRuntimeConfig(event).storage.cos.url;

		return {
			total: list.length,
			list: await map(list, async (item) => {
				const tags = item.workTags.map((wt) => wt.tag?.content).filter(Boolean);
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
					tags,
					type: item.content_type,
				};
			}),
		};
	},
);
