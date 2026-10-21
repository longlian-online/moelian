<template>
	<div
		class="category-results"
		:class="{
			'category-results--empty':
				pending || tagPending || error || tagError || !works.length,
		}"
	>
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
		<div v-if="pending || tagPending" class="category-empty" role="status">
			<v-progress-circular indeterminate :size="28" :width="2" />
			<p>正在寻找相关作品…</p>
		</div>
		<NetworkErrorState
			v-else-if="error || tagError"
			:retrying="pending || tagPending"
			@retry="retryResults"
			@home="navigateTo('/')"
		/>
		<div v-else-if="!works.length" class="category-empty" role="status">
			<img :src="publicAssets.logo" alt="moelian" class="category-empty-logo" />
			<h2>暂时没有找到相关作品</h2>
			<p>试试减少标签，或换个关键词吧。</p>
			<v-btn variant="text" color="primary" @click="clearFilters"
				>查看全部作品</v-btn
			>
		</div>
		<WorkInfiniteScroll
			v-else
			:revision="listRevision"
			class="category-infinite"
			@load="loadMore"
		>
			<BookshelfDisplay :works="works" :mobile="isMobile" />
		</WorkInfiniteScroll>
	</div>
</template>

<script setup lang="ts">
import { publicAssets } from '~/utils/assets';
import { useWorkPagination } from '~/composables/useWorkPagination';
import { fetchWorkPage } from '~/utils/workList';
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
const {
	data: tagData,
	pending: tagPending,
	error: tagError,
	refresh: refreshTags,
} = await useApiFetch<TagWebItem[]>('/api/web/tag/all');
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
async function requestPage(
	page: number,
	signal?: AbortSignal,
): Promise<WorkListRes> {
	const types: ('Manga' | 'Novel')[] =
		selectedType.value === 'all'
			? ['Manga', 'Novel']
			: selectedType.value === 'Novel'
				? ['Novel']
				: ['Manga'];
	const snapshot = query.value;
	const results = await Promise.all(
		types.map((type) =>
			fetchWorkPage({ ...snapshot, page, type, sortType: 'UPDATE' }, signal),
		),
	);
	return {
		total: results.reduce((total, result) => total + result.total, 0),
		list: results.flatMap((result) => result.list),
	};
}
// 首屏作为一个整体失败或成功，避免把半份分类结果当成完整结果。
const {
	data: firstPage,
	pending,
	error,
	refresh,
} = await useAsyncData(
	() => `category-works:${filterKey.value}`,
	(_, { signal }) => requestPage(1, signal),
);
const {
	works: loadedWorks,
	revision: listRevision,
	loadMore,
} = useWorkPagination({
	firstPage,
	resetKey: filterKey,
	pending,
	requestPage,
});
const works = computed(() =>
	loadedWorks.value
		.slice()
		.sort(
			(a, b) =>
				new Date(b.chapterUpdatedAt ?? 0).getTime() -
				new Date(a.chapterUpdatedAt ?? 0).getTime(),
		),
);
async function retryResults() {
	if (tagError.value) await refreshTags();
	await refresh();
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
	--work-status-color: #808773;
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
.category-results {
	position: relative;
}
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
.category-results :deep(.bookshelf) {
	padding-top: 64px !important;
}
.category-results :deep(.bookshelf::before) {
	height: 64px;
}
.category-results--empty {
	padding-top: 64px;
}
.category-results--empty::before {
	content: '';
	position: absolute;
	inset: 0 0 auto;
	height: 64px;
	background:
		repeating-linear-gradient(
			1deg,
			transparent 0 3px,
			rgba(142, 104, 56, 0.055) 4px 5px,
			transparent 6px 11px
		),
		linear-gradient(95deg, #eedec0, #f6e9cc 35%, #e9d8b7 75%, #f3e5c6);
}
.category-filters :deep(.v-field) {
	color: #705039;
}
@media (max-width: 600px) {
	.category-filters {
		padding: 10px 12px;
	}
}
</style>
