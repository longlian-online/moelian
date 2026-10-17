<template>
	<v-container
		fluid
		class="shelf-page"
		:class="{ 'shelf-page--mobile': props.mobile }"
	>
		<v-row justify="center" class="content-row">
			<v-col>
				<!-- 加载状态 -->
				<template v-if="!workState.data">
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
					<VInfiniteScroll
						:key="`${props.contentType}-${listRevision}`"
						class="bookshelf-infinite"
						:margin="240"
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
						</BookshelfDisplay>
						<template #loading>
							<div class="bookshelf-load-status">
								<v-progress-circular indeterminate :size="20" :width="2" />
								正在加载更多作品…
							</div>
						</template>
						<template #empty
							><div class="bookshelf-load-status">
								已经看到最后一本了
							</div></template
						>
						<template #error="{ props: retryProps }">
							<v-btn
								v-bind="retryProps"
								variant="text"
								class="bookshelf-load-status"
								>加载失败，点击重试</v-btn
							>
						</template>
					</VInfiniteScroll>
				</template>
			</v-col>
		</v-row>
	</v-container>
</template>

<script setup lang="ts">
import { VInfiniteScroll } from 'vuetify/components';
import type { WorkListRes } from '~/shared/dto/web/work';
export type WorkItemType = WorkListRes['list'][number];

const props = withDefaults(
	defineProps<{ contentType: 'manga' | 'novel'; mobile?: boolean }>(),
	{ mobile: false },
);
// 仅在书架主页关闭滚动边界回弹，避免固定导航下露出页面底色。
useHead({ htmlAttrs: { class: 'bookshelf-page-active' } });

const webWorkStore = useWebWorkStore();
const workState = computed(() =>
	props.contentType === 'manga'
		? webWorkStore.mangaState
		: webWorkStore.novelState,
);
const totalItems = computed(() => workState.value.data?.total ?? 0);
const appendedWorks = ref<WorkItemType[]>([]);
const loadedPage = ref(1);
const listRevision = ref(0);
const exhausted = ref(false);
let appendRequest: AbortController | null = null;
const cards = computed<WorkItemType[]>(() => [
	...(workState.value.data?.list ?? []),
	...appendedWorks.value,
]);

// 搜索、切换类型或首屏重新请求后，丢弃旧结果和未完成的追加请求。
watch(
	[
		() => workState.value.data,
		() => workState.value.searchKey,
		() => props.contentType,
	],
	() => {
		appendRequest?.abort();
		appendRequest = null;
		appendedWorks.value = [];
		loadedPage.value = 1;
		exhausted.value = false;
		listRevision.value++;
	},
	{ flush: 'sync' },
);
onBeforeUnmount(() => appendRequest?.abort());

type LoadStatus = 'ok' | 'empty' | 'error';
async function loadMoreWorks({ done }: { done: (status: LoadStatus) => void }) {
	if (
		workState.value.isLoading ||
		exhausted.value ||
		cards.value.length >= totalItems.value
	) {
		done('empty');
		return;
	}
	if (appendRequest) {
		done('ok');
		return;
	}
	const revision = listRevision.value;
	const controller = new AbortController();
	appendRequest = controller;
	const nextPage = loadedPage.value + 1;
	try {
		const response = await $fetch<{
			code: number;
			message: string;
			data?: WorkListRes;
		}>('/api/web/work', {
			query: {
				page: nextPage,
				type: workState.value.type,
				key: workState.value.searchKey,
				sortType: 'UPDATE',
			},
			signal: controller.signal,
		});
		if (revision !== listRevision.value || controller.signal.aborted) {
			done('empty');
			return;
		}
		if (response.code !== 0 || !response.data)
			throw new Error(response.message || '加载失败');
		const existingIds = new Set(cards.value.map((work) => work.id));
		appendedWorks.value.push(
			...response.data.list.filter((work) => !existingIds.has(work.id)),
		);
		loadedPage.value = nextPage;
		exhausted.value =
			response.data.list.length === 0 || nextPage * 24 >= response.data.total;
		done(exhausted.value ? 'empty' : 'ok');
	} catch {
		done(controller.signal.aborted ? 'empty' : 'error');
	} finally {
		if (appendRequest === controller) appendRequest = null;
	}
}
const { error } = await useAsyncData(
	computed(() => `${props.contentType}-list-data`),
	async () => {
		workState.value.page = 1;
		await webWorkStore.fetchWorkList(workState.value);
		return cards.value;
	},
);

if (error.value) {
	console.error('作品列表数据加载失败:', error.value);
}
</script>

<style scoped>
.bookshelf-infinite {
	width: 100%;
	min-width: 0;
	overflow: visible;
}
.bookshelf-infinite > .bookshelf {
	width: 100%;
	flex-shrink: 0;
	margin-inline: 0 !important;
}
/* 单向加载不需要顶部状态区，避免多出一条空白。 */
.bookshelf-infinite :deep(.v-infinite-scroll__side:first-child) {
	display: none;
}
.bookshelf-load-status {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 18px 12px;
	color: #707766;
	font-size: 13px;
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

.shelf-page--mobile .mobile-bookshelf-tabs { height: 44px; }
.shelf-page--mobile .mobile-bookshelf-tab--active::after { bottom: 8px; }
</style>

<style>
html.bookshelf-page-active,
html.bookshelf-page-active body {
	overscroll-behavior-y: none;
}
.v-overlay__content.shelf-work-tooltip {
	background: #fffaf2;
	color: #705247;
	border: 1px solid #e7d4bc;
	border-radius: 8px;
	padding: 12px 16px;
	box-shadow: 0 5px 18px rgba(78, 53, 35, 0.15);
	font-size: 13px;
	line-height: 1.8;
}
.shelf-work-tooltip .shelf-tooltip-title {
	font-weight: 700;
	font-size: 15px;
	line-height: 1.5;
	margin-bottom: 4px;
	overflow-wrap: anywhere;
}
/* 全局样式 - 强制骨架屏高度 */
.skeleton-book .v-skeleton-loader__bone.v-skeleton-loader__image {
	height: 400px !important;
	min-height: 400px !important;
	max-height: 400px !important;
}

.skeleton-book .v-skeleton-loader__bone {
	height: 400px !important;
}

/* Book3D 组件居中显示 - 移除强制铺满的全局样式 */
</style>
