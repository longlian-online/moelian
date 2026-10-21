import { describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { useWorkPagination } from '~/composables/useWorkPagination';
import type { WorkListRes } from '~/shared/dto/web/work';

const item = (id: number): WorkListRes['list'][number] => ({
	id,
	title: `作品${id}`,
	author: '',
	coverUrl: '',
	description: '',
	lengthType: 'Short',
	serialType: 'Serializing',
	lastNo: null,
	chapterUpdatedAt: null,
	tags: [],
	type: 'Manga',
});
const page = (ids: number[], total = 4): WorkListRes => ({
	total,
	list: ids.map(item),
});
function setup(
	requestPage: (page: number, signal: AbortSignal) => Promise<WorkListRes>,
) {
	const scope = effectScope();
	const firstPage = ref<WorkListRes | null>(page([1, 2]));
	const key = ref('first');
	const pagination = scope.run(() =>
		useWorkPagination({ firstPage, resetKey: key, requestPage }),
	)!;
	return { firstPage, key, pagination, stop: () => scope.stop() };
}
describe('作品追加分页', () => {
	it('追加去重，同页重复条目也只显示一次', async () => {
		const context = setup(async () => page([2, 3, 3, 4]));
		const done = vi.fn();
		await context.pagination.loadMore({ done });
		expect(context.pagination.works.value.map((work) => work.id)).toEqual([
			1, 2, 3, 4,
		]);
		expect(done).toHaveBeenLastCalledWith('empty');
		context.stop();
	});
	it('失败后重试相同页码，成功后继续下一页', async () => {
		const request = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(page([3], 5))
			.mockResolvedValueOnce(page([4], 5));
		const context = setup(request);
		const done = vi.fn();
		await context.pagination.loadMore({ done });
		expect(done).toHaveBeenLastCalledWith('error');
		await context.pagination.loadMore({ done });
		await context.pagination.loadMore({ done });
		expect(request.mock.calls.map((args) => args[0])).toEqual([2, 2, 3]);
		expect(context.pagination.works.value.map((work) => work.id)).toEqual([
			1, 2, 3, 4,
		]);
		context.stop();
	});
	it('筛选切换时取消追加且忽略晚到的旧结果', async () => {
		let finish!: (value: WorkListRes) => void;
		let signal!: AbortSignal;
		const context = setup((_, nextSignal) => {
			signal = nextSignal;
			return new Promise((resolve) => {
				finish = resolve;
			});
		});
		const loading = context.pagination.loadMore({ done: vi.fn() });
		context.key.value = 'second';
		context.firstPage.value = page([9], 1);
		expect(signal.aborted).toBe(true);
		finish(page([3, 4]));
		await loading;
		expect(context.pagination.works.value.map((work) => work.id)).toEqual([9]);
		context.stop();
	});
	it('卸载时取消未完成请求', async () => {
		let signal!: AbortSignal;
		const context = setup((_, nextSignal) => {
			signal = nextSignal;
			return new Promise(() => {});
		});
		void context.pagination.loadMore({ done: vi.fn() });
		context.stop();
		expect(signal.aborted).toBe(true);
	});
});
