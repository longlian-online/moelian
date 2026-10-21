import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useWebWorkStore } from '~/stores/web-works';

const { fetchPage } = vi.hoisted(() => ({ fetchPage: vi.fn() }));
vi.stubGlobal('$fetch', fetchPage);

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}
const response = (total: number) => ({
	code: 0,
	message: 'OK',
	data: { total, list: [] },
});
beforeEach(() => {
	setActivePinia(createPinia());
	fetchPage.mockReset();
});

describe('书架首屏请求', () => {
	it('旧响应晚到时仍保留最新搜索结果', async () => {
		const old = deferred<ReturnType<typeof response>>();
		const latest = deferred<ReturnType<typeof response>>();
		fetchPage
			.mockReturnValueOnce(old.promise)
			.mockReturnValueOnce(latest.promise);
		const store = useWebWorkStore();
		store.mangaState.searchKey = '旧搜索';
		const first = store.getAllManga();
		store.mangaState.searchKey = '新搜索';
		const second = store.getAllManga();
		latest.resolve(response(2));
		await second;
		old.resolve(response(1));
		await first;
		expect(store.mangaState.data?.total).toBe(2);
	});
	it('旧请求完成时不会提前结束新请求的加载状态', async () => {
		const old = deferred<ReturnType<typeof response>>();
		const latest = deferred<ReturnType<typeof response>>();
		fetchPage
			.mockReturnValueOnce(old.promise)
			.mockReturnValueOnce(latest.promise);
		const store = useWebWorkStore();
		const first = store.getAllManga();
		const second = store.getAllManga();
		old.resolve(response(1));
		await first;
		expect(store.mangaState.isLoading).toBe(true);
		latest.resolve(response(2));
		await second;
	});
	it('业务失败保留为错误，重试成功后清除错误', async () => {
		fetchPage
			.mockResolvedValueOnce({ code: 50000, message: '暂时不可用' })
			.mockResolvedValueOnce(response(3));
		const store = useWebWorkStore();
		await store.getAllManga();
		expect(store.mangaState.error).toBeTruthy();
		expect(store.mangaState.data).toBeNull();
		await store.getAllManga();
		expect(store.mangaState.error).toBeNull();
		expect(store.mangaState.data?.total).toBe(3);
	});
});
