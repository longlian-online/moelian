import { TagSaveReq } from '#shared/dto/admin/tag';
import { create } from '~/server/service/tag';

export default defineWrappedResponseHandler(async (event) => {
	const body = await readBody(event);
	const validateBody = TagSaveReq.parse(body);
	await create({
		content: validateBody.content,
		img: validateBody.img ?? null,
	});
	return { code: 0, message: '标签创建成功' };
});
