import { TagDeleteReq } from '#shared/dto/admin/tag';
import { deleteById } from '~/server/service/tag';
import { PARAMS_ERROR } from '~/server/types/business_exception';

export default defineWrappedResponseHandler(async (event) => {
	const params = event.context.params as Record<string, string>;
	const id = params?.id;
	if (!id || isNaN(Number(id))) throw new PARAMS_ERROR();
	const tagId = Number(id);

	const validateQuery = TagDeleteReq.parse({ id: tagId });
	await deleteById(validateQuery.id);

	return { code: 0, message: '标签删除成功' };
});
