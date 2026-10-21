import type { WorkListReq, WorkListRes } from '~/shared/dto/web/work';
import type { ApiResponse } from '~/shared/types/api';

export async function fetchWorkPage(
	query: WorkListReq,
	signal?: AbortSignal,
): Promise<WorkListRes> {
	const response = await $fetch<ApiResponse<WorkListRes>>('/api/web/work', {
		query,
		signal,
	});
	if (response.code !== 0 || !response.data)
		throw new Error(response.message || '作品加载失败');
	return response.data;
}
