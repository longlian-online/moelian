import { ErrorMap } from '~/shared/errors';

/** 公共详情将业务不存在与暂时不可用分开，不向 HTML 泄露内部错误。 */
export function getWorkDetailStatus(
	response: { code: number; data?: unknown } | null | undefined,
	error: unknown,
	pending: boolean,
): 200 | 404 | 503 {
	if (pending) return 200;
	if (
		response?.code === ErrorMap.DATA_NOT_EXISTS.code ||
		(error &&
			typeof error === 'object' &&
			'statusCode' in error &&
			error.statusCode === 404)
	)
		return 404;
	return !error && response?.code === 0 && response.data != null ? 200 : 503;
}
