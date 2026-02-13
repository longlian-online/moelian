import logger from '~/server/lib/winston';
import {
	contentExtractHandler,
} from '~/server/service/chapter';
import { XMLParser } from 'fast-xml-parser';

/**
 * 当工作流解压小说完成时触发
 * 修改章节相关的状态,并创建对应的资源记录
 */
export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	logger.info(body);
	const parser = new XMLParser();
	const req = parser.parse(body);
	logger.info('xml parse', req);
	if (
		req.Response.WorkflowExecution.State !== 'Success' ||
		req.Response.WorkflowExecution.WorkflowName !== '小说解压'
	) {
		logger.error('小说解压回调处理失败');
		return;
	}

	const key = req.Response.WorkflowExecution.Object as string;

	try {
		await contentExtractHandler(key, 'Novel');
	} catch (e) {
		logger.error(e);
	}
	return;
});
