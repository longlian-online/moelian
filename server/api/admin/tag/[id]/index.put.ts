import { TagUpdateReq } from '#shared/dto/admin/tag';
import { updateById } from '~/server/service/tag';
import { getId } from '~/server/utils/handler';
export default defineWrappedResponseHandler(async (event) => {
	const tagId = getId(event);
	const body = await readBody(event);
	const validateBody = TagUpdateReq.parse({ ...body, id: tagId });
	await updateById(tagId, {
		content: validateBody.content,
		cover_id: validateBody.cover_id,
	});

	return { code: 0, message: '标签修改成功' };
});
