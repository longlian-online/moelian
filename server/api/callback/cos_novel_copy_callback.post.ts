import logger from '~/server/lib/winston';
import { mangaExtractHandler } from '~/server/service/chapter';
import { XMLParser } from 'fast-xml-parser';

/**
 * 小说复制完成回调函数
 */
export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	logger.info(body);
	const parser = new XMLParser();
	const req = parser.parse(body);
	logger.info('xml parse', req);
	if (
		req.Response.WorkflowExecution.State !== 'Success' ||
		req.Response.WorkflowExecution.WorkflowName !== '小说复制'
	) {
		logger.error('小说复制回调处理失败');
		return;
	}

	const key = req.Response.WorkflowExecution.Object as string;
	const paths = key.split('/');
	if (paths.length !== 2) {
		logger.warn('请求数据异常');
		return;
	}
	const fileName = paths.at(-1);
	const fileNameParts = fileName!.split('.');
	if (fileNameParts.length !== 2) {
		logger.warn('请求数据异常');
		return;
	}
	try {
		await mangaExtractHandler(fileNameParts[0]);
	} catch (e) {
		logger.error(e);
	}
	return;
});
