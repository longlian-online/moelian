<template>
	<v-container
		fluid
		class="shelf-page"
		:class="{ 'shelf-page--mobile': props.mobile }"
	>
		<v-row justify="center" class="content-row">
			<v-col>
				<NetworkErrorState
					v-if="workState.error"
					:retrying="workState.isLoading"
					@retry="refresh()"
					@home="navigateTo('/')"
				/>
				<template v-else-if="workState.isLoading || !workState.data">
					<div class="d-flex align-center flex-wrap" style="flex-wrap: wrap">
						<v-col
							v-for="n in 8"
							:key="n"
							class="mb-4 px-2"
							:cols="props.mobile ? 6 : 12"
							sm="6"
							md="3"
						>
							<v-skeleton-loader
								type="image"
								:height="400"
								class="skeleton-book"
							/>
						</v-col>
					</div>
				</template>

				<template v-else-if="totalItems === 0">
					<v-alert
						type="info"
						icon="mdi-magnify-remove-outline"
						variant="tonal"
						class="mt-10 pa-6"
					>
						<h3 class="text-h6 mb-2">抱歉，没有找到相关作品</h3>
						<p>
							请尝试更换关键词 **「{{ workState.searchKey }}」**
							或清除搜索内容后再次查找。
						</p>
					</v-alert>
				</template>

				<template v-else>
					<WorkInfiniteScroll
						:revision="listRevision"
						class="bookshelf-infinite"
						@load="loadMoreWorks"
					>
						<BookshelfDisplay
							:works="cards"
							:mobile="props.mobile"
							:content-type="props.contentType"
						>
							<nav
								v-if="props.mobile"
								class="mobile-bookshelf-tabs"
								aria-label="作品类型"
							>
								<NuxtLink
									to="/manga"
									class="mobile-bookshelf-tab"
									:class="{
										'mobile-bookshelf-tab--active':
											props.contentType === 'manga',
									}"
									:aria-current="
										props.contentType === 'manga' ? 'page' : undefined
									"
									>漫画</NuxtLink
								>
								<NuxtLink
									to="/novel"
									class="mobile-bookshelf-tab"
									:class="{
										'mobile-bookshelf-tab--active':
											props.contentType === 'novel',
									}"
									:aria-current="
										props.contentType === 'novel' ? 'page' : undefined
									"
									>小说</NuxtLink
								>
							</nav>
						</BookshelfDisplay></WorkInfiniteScroll
					>
				</template>
			</v-col>
		</v-row>
	</v-container>
</template>

<script setup lang="ts">
import { useWorkPagination } from '~/composables/useWorkPagination';
import { fetchWorkPage } from '~/utils/workList';

const props = withDefaults(
	defineProps<{ contentType: 'manga' | 'novel'; mobile?: boolean }>(),
	{ mobile: false },
);
// 仅在书架主页关闭滚动边界回弹，避免固定导航下露出页面底色。
useHead({ htmlAttrs: { class: 'bookshelf-page-active' } });

const route = useRoute();
const webWorkStore = useWebWorkStore();
const workState = computed(() =>
	props.contentType === 'manga'
		? webWorkStore.mangaState
		: webWorkStore.novelState,
);
const totalItems = computed(() => workState.value.data?.total ?? 0);
const {
	works: cards,
	revision: listRevision,
	loadMore: loadMoreWorks,
} = useWorkPagination({
	firstPage: () => workState.value.data,
	resetKey: () => JSON.stringify([props.contentType, route.query]),
	pending: () => workState.value.isLoading,
	requestPage: (page, signal) =>
		fetchWorkPage(
			{
				page,
				type: workState.value.type,
				key: workState.value.searchKey,
				tags: [...workState.value.tags],
				sortType: 'UPDATE',
			},
			signal,
		),
});
const { refresh } = await useAsyncData(
	computed(
		() => `${props.contentType}-list-data-${JSON.stringify(route.query)}`,
	),
	async () => {
		const rawTags = route.query.tags;
		workState.value.tags = (
			Array.isArray(rawTags) ? rawTags : [rawTags]
		).filter((tag): tag is string => Boolean(tag));
		workState.value.searchKey = String(route.query.key ?? '');
		workState.value.inputKey = workState.value.searchKey;
		workState.value.page = 1;
		await webWorkStore.fetchWorkList(workState.value);
		return cards.value;
	},
);
</script>

<style scoped>
.shelf-page {
	padding: 0;
}
.shelf-page > .content-row {
	margin: 0;
}
.shelf-page > .content-row > .v-col {
	padding: 0;
}

/* 骨架屏样式 - 强制覆盖 */
.skeleton-book :deep(.v-skeleton-loader__bone.v-skeleton-loader__image) {
	height: 400px !important;
	min-height: 400px !important;
	max-height: 400px !important;
}

.mobile-bookshelf-tabs {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	z-index: 2;
	display: flex;
	justify-content: center;
	align-items: stretch;
	gap: 24px;
	height: 36px;
}
.mobile-bookshelf-tab {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 74px;
	padding: 0 16px;
	color: #a48b70;
	font-size: 14px;
	font-family: 'Songti SC', 'STSong', serif;
	font-weight: 500;
	letter-spacing: 2px;
	text-decoration: none;
	-webkit-tap-highlight-color: transparent;
}
.mobile-bookshelf-tab--active {
	color: #705039;
	font-weight: 700;
}
.mobile-bookshelf-tab--active::after {
	content: '';
	position: absolute;
	bottom: 2px;
	left: calc(50% - 12px);
	width: 24px;
	height: 3px;
	border-radius: 3px;
	background: #e49c5b;
}
.mobile-bookshelf-tab:focus-visible {
	outline: 2px solid #bd8f5e;
	outline-offset: -3px;
}

.shelf-page--mobile .mobile-bookshelf-tabs {
	height: 44px;
}
.shelf-page--mobile .mobile-bookshelf-tab--active::after {
	bottom: 8px;
}
</style>

<style>
html.bookshelf-page-active,
html.bookshelf-page-active body {
	overscroll-behavior-y: none;
}
</style>
