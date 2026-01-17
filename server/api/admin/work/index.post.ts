import { create } from '~/server/service/work';
import { WorkCreateReq, type WorkCreateRes } from '~/shared/dto/admin/work';
import { Status, SerialStatus } from '_db';
import { uuidv7 } from 'uuidv7';

export default defineWrappedResponseHandler(async (event):Promise<WorkCreateRes> => {
	const { user } = await requireUserSession(event);
	const body = await readBody(event);
	const data = WorkCreateReq.parse(body);

	const work = await create({
		biz_no: uuidv7(),
		title: data.title,
		type_id: data.typeId ?? null,
		content_type: data.contentType,
		author: data.author,
		description: data.description,
		length_type: data.lengthType,
		status: Status.Disable,
		serial_status: SerialStatus.Serializing,
		creator_id: user.id,
		tagId: null,
	});

	return {
		id: work.id,
		bizNo: work.biz_no,
	};
});
