import { TagUpdateReq } from '#shared/dto/admin/tag';
import { updateById } from '~/server/service/tag';
import { PARAMS_ERROR } from '~/server/types/business_exception';

export default defineWrappedResponseHandler(async (event) => {
	const params = event.context.params as Record<string, string>;
	const id = params?.id;
	if (!id || isNaN(Number(id))) throw new PARAMS_ERROR();
	const tagId = Number(id);

	const body = await readBody(event);
	const validateBody = TagUpdateReq.parse({ ...body, id: tagId });
	await updateById(tagId, {
		content: validateBody.content,
		img: validateBody.img,
	});

	return { code: 0, message: '标签修改成功' };
});
