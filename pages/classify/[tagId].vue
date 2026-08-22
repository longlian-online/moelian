<template>
	<div :key="String($route.params.tagId)" class="classify-result-page">
		<div class="main-container">
			<!-- 三合一筛选导航栏：依赖异步标签数据，用 ClientOnly 避免 SSR 水合不匹配 -->
			<ClientOnly>
				<nav class="filter-bar">
					<!-- 1. 类型筛选 -->
					<div class="filter-group">
						<div class="flex flex-col flex-grow">
							<span class="filter-label mb-1">内容类型</span>
							<v-select
								v-model="contentType"
								:items="[
									{ title: '漫画 & 小说', value: null },
									{ title: '漫画', value: 'Manga' },
									{ title: '小说', value: 'Novel' },
								]"
								variant="solo"
								hide-details
								@update:model-value="handleContentTypeChange"
							></v-select>
						</div>
					</div>

					<!-- 2. 分类跳转 -->
					<div class="filter-group">
						<div class="flex flex-col flex-grow">
							<span class="filter-label mb-1">标签列表</span>
							<v-select
								v-model="selectedCategoryId"
								:items="categorySelectItems"
								item-value="value"
								item-title="title"
								variant="solo"
								hide-details
								@update:model-value="handleCategoryChange"
							></v-select>
						</div>
					</div>

					<!-- 3. 多选筛选 (缩小范围) -->
					<div class="filter-group">
						<div class="flex flex-col flex-grow">
							<span class="filter-label mb-1">标签筛选</span>
							<v-select
								v-model="selectedTags"
								clearable
								chips
								:items="availableTags"
								multiple
								persistent-placeholder
								placeholder="所有作品"
								variant="solo"
								hide-details
								@update:model-value="refreshWorkList"
							></v-select>
						</div>
					</div>
				</nav>
				<template #fallback>
					<nav class="filter-bar">
						<div class="filter-group">
							<span class="filter-label mb-1">内容类型</span>
							<v-skeleton-loader type="text" />
						</div>
						<div class="filter-group">
							<span class="filter-label mb-1">标签列表</span>
							<v-skeleton-loader type="text" />
						</div>
						<div class="filter-group">
							<span class="filter-label mb-1">标签筛选</span>
							<v-skeleton-loader type="text" />
						</div>
					</nav>
				</template>
			</ClientOnly>

			<!-- 作品网格 -->
			<ClientOnly>
				<div v-if="isPending" class="loading-container">
					<v-progress-circular
						indeterminate
						color="primary"
						size="48"
					></v-progress-circular>
				</div>

				<div
					v-else-if="workList.length === 0"
					class="empty-state"
					style="display: flex"
				>
					<div class="empty-icon">
						<v-img src="/error.png"></v-img>
					</div>
					<h2 class="empty-title">抱歉，玲奈子没有找到相关作品</h2>
					<p class="empty-desc">请尝试调整筛选条件或减少标签选择</p>
				</div>

				<div v-else class="work-grid">
					<div
						v-for="work in workList"
						:key="work.id"
						class="work-card"
						@click="handleWorkClick(work)"
					>
						<div class="card-cover">
							<Book3D
								:cover-url="work.coverUrl"
								:title="work.title"
								:author="work.author"
								:height="280"
								:width="180"
								:spine-width="30"
								:show-title="false"
								:show-spine-text="false"
								:to="`/${work.type === ContentType.Manga ? 'manga' : 'novel'}/${work.id}`"
								@click.stop="handleWorkClick(work)"
							>
								<template #overlay>
									<AnimeTags
										v-if="work.tags && work.tags.length > 0"
										:tags="work.tags"
										size="small"
										position="bottom-left"
									/>
								</template>
							</Book3D>
						</div>
						<div class="card-body">
							<h3 v-tooltip="work.title" v-copy="work.title" class="card-title">
								{{ work.title }}
							</h3>

							<div class="meta-group">
								<div class="meta-line color-pink">
									<span class="m-tag">BY</span>
									<span class="m-val">{{ work.author }}</span>
									<div class="m-line"></div>
								</div>
								<div class="meta-line color-purple">
									<span class="m-tag">LAST</span>
									<span class="m-val">
										{{
											work.lastNo
												? `第 ${work.lastNo} ${work.type === ContentType.Manga ? '话' : '章'}`
												: '暂无章节'
										}}
									</span>
									<div class="m-line"></div>
								</div>
							</div>

							<div
								v-tooltip="work.description"
								v-copy="work.description"
								class="card-excerpt"
							>
								{{ work.description || '暂无简介' }}
							</div>

							<div class="card-footer">
								<div class="index-container">
									<div class="index-head">
										<span class="index-lbl">百合指数</span>
										<span class="index-val">99%</span>
									</div>
									<div class="index-bar">
										<div class="index-fill" style="width: 99%"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<template #fallback>
					<div class="loading-container">
						<v-progress-circular
							indeterminate
							color="primary"
							size="48"
						></v-progress-circular>
					</div>
				</template>
			</ClientOnly>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { WorkListRes } from '~/shared/dto/web/work';
import type { TagWebItem } from '~/shared/dto/web';
import { ContentType } from '_db';
import Book3D from '~/components/common/Book3D.vue';
import AnimeTags from '~/components/common/AnimeTags.vue';

const route = useRoute();
const router = useRouter();

// 从路由参数获取tag ID
const currentTagId = computed(() => {
	const id = route.params.tagId;
	if (typeof id === 'string' && !isNaN(Number(id))) {
		return Number(id);
	}
	return null;
});

// 内容类型筛选（默认全部：漫画&小说）
const contentType = ref<string | null>(null);

// 分类筛选
const selectedCategoryId = ref<number | null>(currentTagId.value);

// 标签多选筛选（默认包含当前标签）
const selectedTags = ref<string[]>([]);

// 监听标签选择变化
watch(selectedTags, (newTags) => {
	// 如果用户清空了所有标签，自动添加“所有作品”
	if (newTags.length === 0) {
		selectedTags.value = ['所有作品'];
	}
	// 如果当前包含“所有作品”，但用户又选了其他真实标签，则移除“所有作品”
	else if (newTags.length > 1 && newTags.includes('所有作品')) {
		selectedTags.value = newTags.filter((t) => t !== '所有作品');
	}
	refreshWorkList();
});

// 获取所有标签列表
const { data: allTagsData } = useApiFetch<TagWebItem[]>('/api/web/tag/all');

const allTags = ref<TagWebItem[]>([]);
const currentTagName = ref<string>('');

watch(
	() => allTagsData.value?.data,
	(newData) => {
		if (newData && Array.isArray(newData)) {
			allTags.value = newData;

			// 设置当前标签名称和默认选中的标签
			if (currentTagId.value) {
				const tag = newData.find((t) => t.id === currentTagId.value);
				if (tag) {
					currentTagName.value = tag.content;
					// 默认选中当前标签
					if (!selectedTags.value.includes(tag.content)) {
						selectedTags.value = [tag.content];
					}
				}
			} else {
				currentTagName.value = '全部分类';
				// 如果没有当前标签且没选任何标签，设为所有作品
				if (selectedTags.value.length === 0) {
					selectedTags.value = ['所有作品'];
				}
			}
		}
	},
	{ immediate: true },
);

// 可用的标签列表（用于多选）
const availableTags = computed(() => {
	const tags = allTags.value.map((tag) => tag.content);
	return ['所有作品', ...tags];
});

// 分类选择器的选项
const categorySelectItems = computed(() => {
	return allTags.value.map((tag) => ({
		title: tag.id === currentTagId.value ? `当前：${tag.content}` : tag.content,
		value: tag.id,
	}));
});

// 处理内容类型变化
const handleContentTypeChange = () => {
	refreshWorkList();
};

// 处理分类变化（跳转路由）
const handleCategoryChange = () => {
	if (selectedCategoryId.value) {
		router.push(`/classify/${selectedCategoryId.value}`);
	} else {
		router.push('/classify/all');
	}
};

// 监听路由变化，更新选中的分类
watch(
	() => route.params.tagId,
	(newTagId) => {
		const id =
			typeof newTagId === 'string' && !isNaN(Number(newTagId))
				? Number(newTagId)
				: null;
		selectedCategoryId.value = id;

		// 更新当前标签名称和默认选中的标签
		if (id) {
			const tag = allTags.value.find((t) => t.id === id);
			if (tag) {
				currentTagName.value = tag.content;
				// 如果当前标签不在选中列表中，添加它
				if (!selectedTags.value.includes(tag.content)) {
					selectedTags.value = [tag.content, ...selectedTags.value];
				}
			}
		}
		refreshWorkList();
	},
);

// 监听标签选择变化
watch(selectedTags, () => {
	refreshWorkList();
});

// 构建查询参数（漫画）
const mangaQueryParams = computed(() => {
	const params: Record<string, unknown> = {
		page: 1,
		limit: 10,
		type: ContentType.Manga,
	};

	// 添加标签筛选（排除虚拟的“所有作品”标签）
	const realTags = selectedTags.value.filter((t) => t !== '所有作品');
	if (realTags.length > 0) {
		params.tags = realTags;
	}

	return params;
});

// 构建查询参数（小说）
const novelQueryParams = computed(() => {
	const params: Record<string, unknown> = {
		page: 1,
		limit: 10,
		type: ContentType.Novel,
	};

	// 添加标签筛选
	const realTags = selectedTags.value.filter((t) => t !== '所有作品');
	if (realTags.length > 0) {
		params.tags = realTags;
	}

	return params;
});

// 获取作品列表（漫画）
const {
	data: mangaWorkListData,
	pending: isPendingManga,
	refresh: refreshManga,
} = useApiFetch<WorkListRes>('/api/web/work', {
	query: mangaQueryParams,
});

// 获取作品列表（小说）
const {
	data: novelWorkListData,
	pending: isPendingNovel,
	refresh: refreshNovel,
} = useApiFetch<WorkListRes>('/api/web/work', {
	query: novelQueryParams,
});

const isPending = computed(() => isPendingManga.value || isPendingNovel.value);

// 合并作品列表，并添加 type 字段（API 返回 type，合并时需补充）
const workList = computed(() => {
	let list: WorkListRes['list'] = [];

	if (contentType.value === ContentType.Manga) {
		const mangaList = mangaWorkListData.value?.data?.list || [];
		list = mangaList.map((work) => ({
			...work,
			type: ContentType.Manga,
		}));
	} else if (contentType.value === ContentType.Novel) {
		const novelList = novelWorkListData.value?.data?.list || [];
		list = novelList.map((work) => ({
			...work,
			type: ContentType.Novel,
		}));
	} else {
		// 全部：合并漫画和小说
		const mangaList = mangaWorkListData.value?.data?.list || [];
		const novelList = novelWorkListData.value?.data?.list || [];
		list = [
			...mangaList.map((work) => ({ ...work, type: ContentType.Manga })),
			...novelList.map((work) => ({ ...work, type: ContentType.Novel })),
		];
	}

	return list;
});

// 只在需要时请求小说列表
// const shouldFetchNovel = computed(() => {
// 	return !contentType.value || contentType.value === ContentType.Novel;
// });

// 刷新作品列表
const refreshWorkList = () => {
	refreshManga();
	if (!contentType.value || contentType.value === ContentType.Novel) {
		refreshNovel();
	}
};

// 处理作品点击
const handleWorkClick = (work: WorkListRes['list'][0]) => {
	const routeType = work.type === ContentType.Manga ? 'manga' : 'novel';
	router.push(`/${routeType}/${work.id}`);
};

useHead({
	title: `${currentTagName.value || '分类'} - 夢怜龍華`,
	meta: [
		{
			name: 'description',
			content: `浏览${currentTagName.value || '分类'}相关的作品`,
		},
	],
});
</script>

<style scoped>
.classify-result-page {
	font-family: 'Noto Sans SC', sans-serif;
	background-color: #fdfaf8;
	color: #5a463d;
	min-height: 100vh;
}

.main-container {
	max-width: 1280px;
	margin: 0 auto;
	padding: 30px 20px;
}

/* --- 顶层筛选栏样式 --- */
.filter-bar {
	background: white;
	border-radius: 24px;
	padding: 20px 30px;
	border: 1px solid #f2ece6;
	box-shadow: 0 10px 30px -15px rgba(125, 90, 90, 0.1);
	margin-bottom: 40px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20px;
	flex-wrap: wrap;
}

.filter-group {
	display: flex;
	align-items: center;
	gap: 12px;
	flex: 1;
	min-width: 280px;
}

.filter-label {
	font-size: 11px;
	font-weight: 900;
	color: #ff9a9e;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	white-space: nowrap;
}

/* v-select 样式覆盖，使其看起来像 custom-select */
.filter-group :deep(.v-select) {
	flex: 1;
}

.filter-group :deep(.v-field) {
	background: #fdfaf8;
	border: 2px solid #f2ece6;
	border-radius: 12px;
	transition: all 0.3s;
	box-shadow: none;
}

.filter-group :deep(.v-field--focused) {
	border-color: #ffcad4;
	background: white;
}

.filter-group :deep(.v-field__input) {
	padding: 8px 16px;
	font-size: 14px;
	font-weight: 700;
	color: #7d5a5a;
	min-height: auto;
}

.filter-group :deep(.v-label) {
	display: none;
}

.filter-group :deep(.v-field__append-inner) {
	padding-right: 12px;
}

/* 多选标签样式 - 使其看起来像 multi-tag-box */
.filter-group :deep(.v-select--chips .v-field) {
	padding: 4px;
	min-height: 44px;
}

.filter-group :deep(.v-select--chips .v-field__input) {
	padding: 4px;
	min-height: 44px;
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}

.filter-group :deep(.v-chip) {
	background: #fff0f3;
	color: #ff758c;
	font-size: 11px;
	font-weight: 800;
	padding: 4px 10px;
	border-radius: 8px;
	border: 1px solid #ffcad4;
	height: auto;
	margin: 0;
}

.filter-group :deep(.v-chip__close) {
	color: #ff758c;
	opacity: 1;
	margin-left: 4px;
}

.filter-group :deep(.v-chip__close:hover) {
	opacity: 0.8;
}

/* --- 作品网格布局 --- */
.work-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
	gap: 24px;
}

/* 卡片设计升级：更紧凑且精致 */
.work-card {
	background: white;
	border-radius: 24px;
	border: 1px solid #f2ece6;
	box-shadow: 0 12px 24px -10px rgba(125, 90, 90, 0.08);
	display: flex;
	overflow: hidden;
	transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
	cursor: pointer;
	height: 280px;
}

.work-card:hover {
	transform: translateY(-8px);
	box-shadow: 0 20px 40px -15px rgba(255, 117, 140, 0.18);
	border-color: #ffcad4;
}

.card-cover {
	width: 180px;
	height: 280px;
	position: relative;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.card-body {
	padding: 18px;
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.card-title {
	font-size: 1.15rem;
	font-weight: 900;
	color: #5a463d;
	margin-bottom: 10px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.card-title:hover {
	color: #ff9a9e;
	cursor: pointer;
}

/* 延续品牌元数据提示符风格 */
.meta-group {
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-bottom: 12px;
}

.meta-line {
	display: flex;
	align-items: baseline;
	gap: 6px;
	position: relative;
}

.m-tag {
	font-size: 8px;
	font-weight: 900;
	text-transform: uppercase;
}

.m-val {
	font-size: 12px;
	font-weight: 700;
	color: #7d5a5a;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.m-line {
	position: absolute;
	bottom: -1px;
	left: 0;
	width: 80%;
	height: 2px;
	border-radius: 99px;
}

.color-pink .m-tag {
	color: #ff9a9e;
}

.color-pink .m-line {
	background: linear-gradient(to right, #ff9a9e, transparent);
}

.color-purple .m-tag {
	color: #a78bfa;
}

.color-purple .m-line {
	background: linear-gradient(to right, #a78bfa, transparent);
}

.card-excerpt {
	font-size: 12px;
	color: #9a8471;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 5;
	line-clamp: 5;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
	margin-bottom: 10px;
	background: #fdfaf8;
	padding: 6px;
	border-radius: 8px;
	flex: 1;
	max-height: calc(1.5rem * 4);
}

.card-footer {
	margin-top: auto;
}

.index-container {
	background: #fefcf9;
	padding: 6px 10px;
	border-radius: 12px;
	border: 1px solid #f2ece6;
}

.index-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 3px;
}

.index-lbl {
	font-size: 8px;
	font-weight: 900;
	color: #9a8471;
}

.index-val {
	font-size: 10px;
	font-weight: 900;
	color: #ff758c;
}

.index-bar {
	height: 4px;
	width: 100%;
	background: #f2ece6;
	border-radius: 99px;
	overflow: hidden;
}

.index-fill {
	height: 100%;
	background: linear-gradient(to right, #ff9a9e, #ff758c);
	width: 80%;
}

/* --- 空状态样式 --- */
.empty-state {
	display: none;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80px 20px;
	text-align: center;
}

.empty-icon {
	width: 240px;
	height: 240px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-title {
	font-size: 1.5rem;
	font-weight: 900;
	color: #5a463d;
	margin-bottom: 8px;
}

.empty-desc {
	color: #c9c1ab;
	font-weight: 700;
}

.loading-container {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 80px 20px;
}

@media (max-width: 640px) {
	.work-grid {
		grid-template-columns: 1fr;
	}

	.filter-bar {
		padding: 15px;
		flex-direction: column;
		gap: 12px;
	}

	.filter-group {
		width: 100%;
		min-width: 100%;
		flex: 1 1 100%;
		gap: 6px;
	}

	.filter-group .flex {
		width: 100%;
	}

	.filter-group :deep(.v-select) {
		width: 100%;
	}

	.filter-label {
		font-size: 10px;
		margin-bottom: 4px;
	}
}
</style>
