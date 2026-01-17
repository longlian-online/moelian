import { WorkUpdateTagsReq } from '#shared/dto/admin/work';
import { updateWorkTags } from '~/server/service/work';
import { PARAMS_ERROR } from '~/server/types/business_exception';

export default defineWrappedResponseHandler(async (event) => {
	const params = event.context.params as Record<string, string>;
	const workIdStr = params?.id;
	if (!workIdStr || isNaN(Number(workIdStr))) {
		throw new PARAMS_ERROR();
	}
	const workId = Number(workIdStr);

	const body = await readBody(event);
	const { tag_ids } = WorkUpdateTagsReq.parse(body);

	await updateWorkTags(workId, tag_ids);

	return {
		code: 0,
		message: '作品标签更新成功',
	};
});
