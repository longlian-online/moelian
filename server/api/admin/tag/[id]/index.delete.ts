import { TagDeleteReq } from '#shared/dto/admin/tag';
import { deleteById } from '~/server/service/tag';
import { getId } from '~/server/utils/handler';

export default defineWrappedResponseHandler(async (event) => {
	const tagId = getId(event);

	const validateQuery = TagDeleteReq.parse({ id: tagId });
	await deleteById(validateQuery.id);

});
