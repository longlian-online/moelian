import { getId } from '~/server/utils/handler';
import { ChapterUpdateReq } from '#shared/dto/admin/chapter';
import { chapterUpdate  } from '~/server/service/chapter';

export default defineWrappedResponseHandler(async (event) => {
	const id = getId(event);
	const body = await readBody(event);
	const data = ChapterUpdateReq.parse(body);

	await chapterUpdate({id, priority: data.priority, title: data.title});
});
