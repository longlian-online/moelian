import { UploadContentReq } from '#shared/dto/admin/chapter';
import { uploadContent } from '~/server/service/chapter';

export default defineWrappedResponseHandler(async (event) => {
	const { user } = await requireUserSession(event);
	const id = getId(event);
	const body = await readBody(event);

	const data = UploadContentReq.parse(body);
	await uploadContent(id, {
		total_page: data.totalPage??null,
		contentId: data.contentId,
		uploader_id: user.id,
	});
});
