import { describe, expect, it } from 'vitest';
import { WorkDetailParams } from '~/shared/dto/web/work';
import { getWorkDetailStatus } from '~/utils/workDetailStatus';

describe('作品详情参数与错误分类', () => {
	it.each(['abc', '0', '-1', '1.5', '1e2', '2147483648', '9007199254740992'])(
		'拒绝无效 ID %s',
		(id) => {
			expect(WorkDetailParams.safeParse({ id }).success).toBe(false);
		},
	);
	it('把合法路由参数转换为整数', () => {
		expect(WorkDetailParams.parse({ id: '12' })).toEqual({ id: 12 });
	});
	it('数据不存在映射为 404，系统失败映射为 503', () => {
		expect(getWorkDetailStatus({ code: 40005 }, null, false)).toBe(404);
		expect(getWorkDetailStatus({ code: 50000 }, null, false)).toBe(503);
		expect(getWorkDetailStatus(undefined, { statusCode: 404 }, false)).toBe(
			404,
		);
		expect(getWorkDetailStatus(undefined, new Error('offline'), false)).toBe(
			503,
		);
	});
	it('加载中和成功响应不进入错误页，缺失成功数据仍可重试', () => {
		expect(getWorkDetailStatus(undefined, null, true)).toBe(200);
		expect(
			getWorkDetailStatus({ code: 0, data: { id: 12 } }, null, false),
		).toBe(200);
		expect(getWorkDetailStatus({ code: 0 }, null, false)).toBe(503);
	});
});
