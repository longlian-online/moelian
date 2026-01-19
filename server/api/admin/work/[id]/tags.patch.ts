import { WorkUpdateTagsReq } from '#shared/dto/admin/work';
import { updateWorkTags } from '~/server/service/work';
import { getId } from '~/server/utils/handler';

export default defineWrappedResponseHandler(async (event) => {
	const workId = getId(event);

	const body = await readBody(event);
	const { tag_ids } = WorkUpdateTagsReq.parse(body);

	await updateWorkTags(workId, tag_ids);

	return {
		code: 0,
		message: '作品标签更新成功',
	};
});
