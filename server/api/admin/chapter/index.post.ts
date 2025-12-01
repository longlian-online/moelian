import { uuidv7 } from 'uuidv7';
import { create } from '~/server/service/chapter';
import { ChapterCreateReq } from '~/shared/dto/admin/chapter';

/**
 * 如果是章节内容上传的话，传章节的 biz_no 字段，其他类型的文件的传文件名
 */
export default defineWrappedResponseHandler(async (event) => {
	const body = await readBody(event);
	const data = ChapterCreateReq.parse(body);

	const work = await create({
		title: data.title,
		work_id: data.workId,
		content_type: data.contentType,
		biz_no: uuidv7(),
	});
	return {
		id: work.id,
		biz_no: work.biz_no,
	};
});
