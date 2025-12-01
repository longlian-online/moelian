import { updateByID } from '~/server/service/work';
import { PARAMS_ERROR } from '~/server/types/business_exception';
import { WorkPutReq } from '~/shared/dto/admin/work';

export default defineWrappedResponseHandler(async (event) => {
	const body = await readBody(event);
	const data = WorkPutReq.parse(body);

	const params = getRouterParams(event);
	const id = Number(params['id']);
	if (!id) {
		throw new PARAMS_ERROR();
	}

	await updateByID(id, {
		title: data.title,
		type_id: data.typeId ?? null,
		content_type: data.contentType,
		author: data.author,
		description: data.description,
		length_type: data.lengthType,
		serial_status: data.serialStatus,
	});
});
