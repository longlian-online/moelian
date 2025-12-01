import logger from '~/server/lib/winston';
import { mangaExtractHandler } from '~/server/service/chapter';
import { XMLParser } from 'fast-xml-parser';
import { ResourceType } from '~/server/lib/prisma';

/**
 * 当工作流解压漫画完成时触发
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
		req.Response.WorkflowExecution.WorkflowName !== '漫画解压'
	) {
		logger.error('漫画解压回调处理失败');
		return;
	}

	const key = req.Response.WorkflowExecution.Object as string;

	try {
		await mangaExtractHandler(key);
	} catch (e) {
		logger.error(e);
	}
	return;
});
