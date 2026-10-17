<template>
	<div class="category-results">
		<div v-if="mangaPending || novelPending" class="category-empty" role="status">
			<v-progress-circular indeterminate :size="28" :width="2" />
			<p>正在寻找相关作品…</p>
		</div>
		<div v-else-if="!works.length" class="category-empty" role="status">
			<img src="/image.png" alt="moelian" class="category-empty-logo" />
			<h2>暂时没有找到相关作品</h2>
			<p>试试减少标签，或换个关键词吧。</p>
			<v-btn variant="text" color="primary" @click="clearFilters">查看全部作品</v-btn>
		</div>
		<VInfiniteScroll
			v-else
			:key="filterKey"
			class="category-infinite"
			:margin="240"
			@load="loadMore"
		>
			<BookshelfDisplay :works="works" :mobile="isMobile" />
			<template #loading
				><div class="category-status">正在加载作品…</div></template
			>
			<template #empty
				><div class="category-status">
					{{
						works.length
							? '已经看到最后一本了'
							: '没有找到相关作品，试试其他标签吧。'
					}}
				</div></template
			>
			<template #error="{ props: retryProps }"
				><v-btn v-bind="retryProps" variant="text"
					>加载失败，点击重试</v-btn
				></template
			>
		</VInfiniteScroll>
	</div>
</template>

<script setup lang="ts">
import { VInfiniteScroll } from 'vuetify/components';
import type { WorkListRes } from '~/shared/dto/web/work';
import type { TagWebItem } from '~/shared/dto/web';
const route = useRoute();
const router = useRouter();
const clearFilters = () => router.push({
	path: route.path,
	query: { ...route.query, tags: '', key: undefined },
});
const { isMobile } = useDevice();
const { data: tagData } = await useApiFetch<TagWebItem[]>('/api/web/tag/all');
const selectedTags = computed(() => {
	if (route.query.tags !== undefined) {
		const raw = route.query.tags;
		return (Array.isArray(raw) ? raw : [raw]).filter((tag): tag is string =>
			Boolean(tag),
		);
	}
	const tag = tagData.value?.data?.find(
		(tag) => tag.id === Number(route.params.tagId),
	);
	return tag ? [tag.content] : [];
});
const filterKey = computed(() =>
	JSON.stringify([selectedTags.value, route.query.key]),
);
const query = computed(() => ({
	page: 1,
	tags: selectedTags.value,
	key: String(route.query.key ?? ''),
	sortType: 'UPDATE',
}));
const { data: mangaData, pending: mangaPending } =
	await useApiFetch<WorkListRes>('/api/web/work', {
		query: computed(() => ({ ...query.value, type: 'Manga' })),
	});
const { data: novelData, pending: novelPending } =
	await useApiFetch<WorkListRes>('/api/web/work', {
		query: computed(() => ({ ...query.value, type: 'Novel' })),
	});
const extraWorks = ref<WorkListRes['list']>([]);
const page = ref(1);
let revision = 0;
let request: AbortController | null = null;
watch(
	filterKey,
	() => {
		revision++;
		request?.abort();
		request = null;
		extraWorks.value = [];
		page.value = 1;
	},
	{ flush: 'sync' },
);
onBeforeUnmount(() => request?.abort());
const works = computed(() =>
	[
		...(mangaData.value?.data?.list ?? []),
		...(novelData.value?.data?.list ?? []),
		...extraWorks.value,
	].sort(
		(a, b) =>
			new Date(b.chapterUpdatedAt ?? 0).getTime() -
			new Date(a.chapterUpdatedAt ?? 0).getTime(),
	),
);
async function loadMore({
	done,
}: {
	done: (status: 'ok' | 'empty' | 'error') => void;
}) {
	if (mangaPending.value || novelPending.value || request) {
		done('ok');
		return;
	}
	const total =
		(mangaData.value?.data?.total ?? 0) + (novelData.value?.data?.total ?? 0);
	if (works.value.length >= total) {
		done('empty');
		return;
	}
	const controller = new AbortController();
	request = controller;
	const currentRevision = revision;
	try {
		const responses = await Promise.all(
			['Manga', 'Novel'].map((type) =>
				$fetch<{ code: number; message: string; data: WorkListRes }>(
					'/api/web/work',
					{
						query: { ...query.value, page: page.value + 1, type },
						signal: controller.signal,
					},
				),
			),
		);
		if (controller.signal.aborted || revision !== currentRevision) {
			done('empty');
			return;
		}
		if (responses.some((response) => response.code !== 0 || !response.data))
			throw new Error('加载失败');
		const ids = new Set(works.value.map((work) => work.id));
		const additions = responses
			.flatMap((response) => response.data.list)
			.filter((work) => !ids.has(work.id));
		extraWorks.value.push(...additions);
		page.value++;
		done(!additions.length || works.value.length >= total ? 'empty' : 'ok');
	} catch {
		done(controller.signal.aborted ? 'empty' : 'error');
	} finally {
		if (request === controller) request = null;
	}
}
useSeoMeta({
	title: () => `${selectedTags.value.join('、') || '全部作品'} - moelian`,
	description: () =>
		`浏览${selectedTags.value.join('、') || '全部'}相关的漫画与小说。`,
});
</script>

<style scoped>
.category-results {
	min-height: 100vh;
	background: #eef0e9;
}
.category-infinite {
	width: 100%;
	overflow: visible;
}
.category-infinite :deep(.v-infinite-scroll__side:first-child) {
	display: none;
}
.category-status {
	padding: 22px 16px;
	text-align: center;
	font-size: 13px;
	color: #808773;
}
</style>

<style scoped>
.category-empty { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 40px 20px; text-align: center; color: #858575; }
.category-empty-logo { width: 150px; max-width: 50%; margin-bottom: 8px; opacity: .8; }
.category-empty h2 { font-family: 'Songti SC', 'SimSun', serif; font-size: 22px; font-weight: 500; color: #70594b; }
.category-empty p { font-size: 13px; }
</style>
