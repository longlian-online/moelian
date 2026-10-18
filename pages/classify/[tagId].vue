<template>
	<div class="category-results" :class="{ 'category-results--empty': mangaPending || novelPending || !works.length }">
		<div class="category-filters">
			<v-select
				v-model="selectedType"
				:items="typeOptions"
				label="内容类型"
				variant="outlined"
				density="compact"
				hide-details
				class="category-type-select"
			/>
			<v-select
				v-model="tagSelection"
				:items="tagOptions"
				label="标签筛选"
				placeholder="选择标签"
				persistent-placeholder
				multiple
				chips
				clearable
				variant="outlined"
				density="compact"
				hide-details
				class="category-tags-select"
			>
				<template #selection="{ item, index }">
					<span v-if="index === 0" class="selected-tag">{{ item.title }}</span>
					<span v-if="index === 1" class="selected-tag-count"
						>+{{ tagSelection.length - 1 }}</span
					>
				</template>
			</v-select>
		</div>
		<div
			v-if="mangaPending || novelPending"
			class="category-empty"
			role="status"
		>
			<v-progress-circular indeterminate :size="28" :width="2" />
			<p>正在寻找相关作品…</p>
		</div>
		<div v-else-if="!works.length" class="category-empty" role="status">
			<img src="/moelian-logo.png" alt="moelian" class="category-empty-logo" />
			<h2>暂时没有找到相关作品</h2>
			<p>试试减少标签，或换个关键词吧。</p>
			<v-btn variant="text" color="primary" @click="clearFilters"
				>查看全部作品</v-btn
			>
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
const clearFilters = () =>
	router.push({
		path: route.path,
		query: { ...route.query, tags: '', key: undefined, type: undefined },
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
const typeOptions = [
	{ title: '漫画&小说', value: 'all' },
	{ title: '漫画', value: 'Manga' },
	{ title: '小说', value: 'Novel' },
];
const selectedType = computed({
	get: () =>
		['Manga', 'Novel'].includes(String(route.query.type))
			? String(route.query.type)
			: 'all',
	set: (value) => {
		router.push({
			path: route.path,
			query: { ...route.query, type: value === 'all' ? undefined : value },
		});
	},
});
const tagOptions = computed(
	() => tagData.value?.data?.map((tag) => tag.content) ?? [],
);
const tagSelection = computed({
	get: () => selectedTags.value,
	set: (value: string[] | null) => {
		router.push({
			path: route.path,
			query: { ...route.query, tags: value?.length ? value : '' },
		});
	},
});
const filterKey = computed(() =>
	JSON.stringify([selectedTags.value, route.query.key, selectedType.value]),
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
		...(selectedType.value === 'Novel'
			? []
			: (mangaData.value?.data?.list ?? [])),
		...(selectedType.value === 'Manga'
			? []
			: (novelData.value?.data?.list ?? [])),
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
		(selectedType.value === 'Novel' ? 0 : (mangaData.value?.data?.total ?? 0)) +
		(selectedType.value === 'Manga' ? 0 : (novelData.value?.data?.total ?? 0));
	if (works.value.length >= total) {
		done('empty');
		return;
	}
	const controller = new AbortController();
	request = controller;
	const currentRevision = revision;
	try {
		const responses = await Promise.all(
			(selectedType.value === 'all'
				? ['Manga', 'Novel']
				: [selectedType.value]
			).map((type) =>
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
.category-empty {
	min-height: 60vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16px;
	padding: 40px 20px;
	text-align: center;
	color: #858575;
}
.category-empty-logo {
	width: 150px;
	max-width: 50%;
	margin-bottom: 8px;
	opacity: 0.8;
}
.category-empty h2 {
	font-family: 'Songti SC', 'SimSun', serif;
	font-size: 22px;
	font-weight: 500;
	color: #70594b;
}
.category-empty p {
	font-size: 13px;
}
</style>

<style scoped>
.category-filters {
	display: flex;
	gap: 16px;
	padding: 20px 24px;
	max-width: 1000px;
	margin: 0 auto;
	align-items: center;
}
.category-type-select {
	flex: 0 0 190px;
}
.category-tags-select {
	flex: 1;
	min-width: 0;
}
.category-tags-select :deep(.v-field__input) {
	flex-wrap: nowrap;
	overflow: hidden;
}
.selected-tag {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.selected-tag-count {
	margin-left: 8px;
	flex-shrink: 0;
	font-size: 12px;
}
@media (max-width: 600px) {
	.category-filters {
		padding: 16px 12px;
		gap: 10px;
	}
	.category-type-select {
		flex-basis: 140px;
	}
	.selected-tag {
		max-width: 80px;
	}
}
</style>

<style scoped>
.category-results { position: relative; }
.category-filters {
	position: absolute;
	top: 0;
	left: 50%;
	transform: translateX(-50%);
	z-index: 2;
	width: 100%;
	height: 64px;
	padding: 10px 24px;
	margin: 0;
}
.category-results :deep(.bookshelf) { padding-top: 64px !important; }
.category-results :deep(.bookshelf::before) { height: 64px; }
.category-results--empty { padding-top: 64px; }
.category-results--empty::before {
	content: '';
	position: absolute;
	inset: 0 0 auto;
	height: 64px;
	background: repeating-linear-gradient(1deg, transparent 0 3px, rgba(142,104,56,.055) 4px 5px, transparent 6px 11px), linear-gradient(95deg,#eedec0,#f6e9cc 35%,#e9d8b7 75%,#f3e5c6);
}
.category-filters :deep(.v-field) { color: #705039; }
@media (max-width: 600px) {
	.category-filters { padding: 10px 12px; }
}
</style>
