import { TagDeleteReq } from '#shared/dto/admin/tag';
import { deleteById } from '~/server/service/tag';
import { getId } from '~/server/utils/handler';

export default defineWrappedResponseHandler(async (event) => {
	const tagId = getId(event);

	const validateQuery = TagDeleteReq.parse({ id: tagId });
	await deleteById(validateQuery.id);

	return { code: 0, message: '标签删除成功' };
});
