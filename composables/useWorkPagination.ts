import {
	computed,
	onScopeDispose,
	ref,
	toValue,
	watch,
	type MaybeRefOrGetter,
} from 'vue';
import type { WorkListRes } from '~/shared/dto/web/work';
import type { WorkLoadEvent } from '~/shared/types/work-pagination';

export function useWorkPagination(options: {
	firstPage: MaybeRefOrGetter<WorkListRes | null | undefined>;
	resetKey: MaybeRefOrGetter<unknown>;
	pending?: MaybeRefOrGetter<boolean>;
	requestPage: (page: number, signal: AbortSignal) => Promise<WorkListRes>;
}) {
	const additions = ref<WorkListRes['list']>([]);
	const revision = ref(0);
	let page = 1;
	let exhausted = false;
	let request: AbortController | null = null;
	const works = computed(() => [
		...(toValue(options.firstPage)?.list ?? []),
		...additions.value,
	]);
	const reset = () => {
		request?.abort();
		request = null;
		additions.value = [];
		page = 1;
		exhausted = false;
		revision.value++;
	};
	watch(
		[() => toValue(options.firstPage), () => toValue(options.resetKey)],
		reset,
		{ flush: 'sync' },
	);
	onScopeDispose(() => {
		request?.abort();
	});

	async function loadMore({ done }: WorkLoadEvent) {
		if (toValue(options.pending) || request) {
			done('ok');
			return;
		}
		const first = toValue(options.firstPage);
		if (!first || exhausted || works.value.length >= first.total) {
			done('empty');
			return;
		}
		const controller = new AbortController();
		request = controller;
		try {
			const result = await options.requestPage(page + 1, controller.signal);
			if (controller.signal.aborted || request !== controller) {
				done('empty');
				return;
			}
			const ids = new Set(works.value.map((work) => work.id));
			const next = result.list.filter((work) => {
				if (ids.has(work.id)) return false;
				ids.add(work.id);
				return true;
			});
			additions.value.push(...next);
			page++;
			exhausted =
				result.list.length === 0 || works.value.length >= result.total;
			done(exhausted ? 'empty' : 'ok');
		} catch {
			done(controller.signal.aborted ? 'empty' : 'error');
		} finally {
			if (request === controller) request = null;
		}
	}
	return { works, revision, loadMore };
}
