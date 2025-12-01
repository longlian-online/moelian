import type { WorkDetailRes } from '#shared/dto/web/work';
import { detailForWeb } from '~/server/service/work';
import { getResourceURL } from '~/server/service/resource';
import { ResourceType } from '_db';

export default defineWrappedResponseHandler(
	async (event): Promise<WorkDetailRes> => {
		const id = getId(event);
		const { work, lastChapter, chapters } = await detailForWeb(id);

		const baseUrl = useRuntimeConfig(event).storage.cos.url;
		return {
			author: work.author,
			chapterList: chapters.map((item) => ({
				id: item.id,
				title: item.title,
				no: item.no,
			})),
			chapterUpdatedAt: lastChapter?.created_at ?? null,
			coverUrl: getResourceURL(work.Cover, baseUrl, ResourceType.Cover),
			description: work.description,
			id: work.id,
			lastNo: lastChapter?.no ?? null,
			lastChapterName: lastChapter?.title ?? null,
			lengthType: work.length_type,
			serialType: work.serial_status,
			title: work.title,
		};
	},
);
