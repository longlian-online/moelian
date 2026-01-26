<template>
	<div class="category-page">
		<div class="gallery-container">
			<!-- 页面顶部 -->
			<header class="page-header">
				<h1 class="page-title">作品分类</h1>
			</header>

			<!-- 分类列表 -->
			<div v-if="isPending" class="loading-container">
				<v-progress-circular
					indeterminate
					color="primary"
				></v-progress-circular>
			</div>

			<div v-else-if="tagList.length === 0" class="empty-container">
				<v-icon icon="mdi-tag-off" size="64" color="grey"></v-icon>
				<p class="empty-text">暂无分类</p>
			</div>

			<div v-else class="tag-grid">
				<div
					v-for="tag in tagList"
					:key="tag.id"
					class="tag-card"
					@click="handleTagClick(tag)"
				>
					<div class="tag-cover-box">
						<v-img
							v-if="tag.cover"
							:src="tag.cover"
							:alt="tag.content"
							class="tag-cover-img"
							cover
						>
							<template #placeholder>
								<div
									class="d-flex align-center justify-center fill-height bg-grey-lighten-2"
								>
									<v-progress-circular
										indeterminate
										size="24"
										color="primary"
									></v-progress-circular>
								</div>
							</template>
							<template #error>
								<div
									class="d-flex align-center justify-center fill-height bg-grey-lighten-2"
								>
									<v-icon
										icon="mdi-image-off-outline"
										size="48"
										color="grey"
									></v-icon>
								</div>
							</template>
						</v-img>
						<div v-else class="tag-cover-placeholder">
							<v-icon
								icon="mdi-image-off-outline"
								size="48"
								color="grey"
							></v-icon>
						</div>
					</div>
					<div class="tag-content-area">
						<div class="tag-main-info">
							<span class="style-label">TAG</span>
							<span class="style-name">{{ tag.content }}</span>
							<div class="style-underline"></div>
						</div>
						<div class="tag-footer">
							<span class="tag-count">{{ tag.workCount || 0 }} 作品</span>
						</div>
					</div>
				</div>
			</div>

			<!-- 分页 -->
			<div v-if="totalPages > 1" class="pagination-container">
				<v-pagination
					v-model="currentPage"
					:length="totalPages"
					:total-visible="7"
					color="primary"
					@update:model-value="handlePageChange"
				></v-pagination>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
useHead({
	title: '作品分类 - 夢怜龍華',
	meta: [
		{
			name: 'description',
			content: '浏览所有作品分类，发现不同类型的作品。',
		},
	],
});

interface TagItem {
	id: number;
	content: string;
	cover: string | null;
	workCount?: number;
}

const page = ref(1);
const limit = ref(10);
const currentPage = ref(1);

// 获取标签列表
const {
	data: tagListData,
	pending: isPending,
	refresh,
} = useApiFetch<{
	total: number;
	list: Array<{
		id: number;
		content: string;
		cover: string | null;
		created_at: string;
		updated_at: string | null;
	}>;
}>('/api/admin/tag', {
	query: computed(() => ({
		page: page.value,
		limit: limit.value,
	})),
});

// 标签列表
const tagList = ref<TagItem[]>([]);

// 总页数
const totalPages = computed(() => {
	if (!tagListData.value?.data?.total) return 1;
	return Math.ceil(tagListData.value.data.total / limit.value);
});

// 获取每个标签的作品数量
const fetchWorkCounts = async (tagIds: number[]) => {
	if (tagIds.length === 0) return {};

	const counts: Record<number, number> = {};

	// 批量查询每个标签的作品数量
	await Promise.all(
		tagIds.map(async (tagId) => {
			try {
				const response = await $fetch<{
					total: number;
					list: unknown[];
				}>('/api/admin/work', {
					query: {
						tagIds: [tagId],
						page: 1,
						limit: 1,
					},
				});
				counts[tagId] = response?.total || 0;
			} catch (error) {
				console.error(`Failed to fetch work count for tag ${tagId}:`, error);
				counts[tagId] = 0;
			}
		}),
	);

	return counts;
};

// 更新标签列表并获取作品数量
watch(
	() => tagListData.value?.data,
	async (newData) => {
		if (!newData?.list) {
			tagList.value = [];
			return;
		}

		const tagIds = newData.list.map((tag) => tag.id);
		const workCounts = await fetchWorkCounts(tagIds);

		tagList.value = newData.list.map((tag) => ({
			id: tag.id,
			content: tag.content,
			cover: tag.cover,
			workCount: workCounts[tag.id] || 0,
		}));
	},
	{ immediate: true },
);

// 处理分页变化
const handlePageChange = (newPage: number) => {
	page.value = newPage;
	currentPage.value = newPage;
	refresh();
};

// 处理标签点击
const handleTagClick = (tag: TagItem) => {
	// 可以导航到该标签的作品列表页面
	// 例如：navigateTo(`/works?tagId=${tag.id}`)
	console.log('Tag clicked:', tag);
};
</script>

<style scoped>
.category-page {
	font-family: 'Noto Sans SC', sans-serif;
	background-color: #fdfaf8;
	color: #5a463d;
	min-height: 100vh;
}

.gallery-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 60px 20px;
}

/* 页面大标题 */
.page-header {
	margin-bottom: 50px;
	text-align: left;
	padding-left: 10px;
}

.page-title {
	font-size: 2.25rem;
	font-weight: 900;
	color: #5a463d;
	letter-spacing: -0.02em;
	margin: 0;
}

.page-subtitle {
	font-size: 0.8rem;
	font-weight: 900;
	color: #ff9a9e;
	text-transform: uppercase;
	letter-spacing: 0.2em;
	margin-bottom: 4px;
	display: block;
}

/* 网格布局 */
.tag-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 30px;
}

/* 标签卡片 */
.tag-card {
	background: white;
	border-radius: 24px;
	overflow: hidden;
	border: 1px solid #f2ece6;
	box-shadow: 0 15px 35px -12px rgba(125, 90, 90, 0.1);
	transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
	cursor: pointer;
}

/* 封面容器 */
.tag-cover-box {
	position: relative;
	width: 100%;
	aspect-ratio: 16 / 9;
	overflow: hidden;
	background-color: #f2ece6;
}

.tag-cover-img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.8s ease;
}

.tag-cover-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f2ece6;
}

/* 卡片信息区 */
.tag-content-area {
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

/* 统一的提示符样式 (TAG 风格) */
.style-label {
	font-size: 10px;
	font-weight: 900;
	color: #ff9a9e;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	display: block;
	line-height: 1;
}

.style-name {
	font-size: 1.5rem;
	font-weight: 800;
	color: #5a463d;
	line-height: 1.2;
	display: block;
}

.style-underline {
	margin-top: 6px;
	width: 60px;
	height: 4px;
	background: linear-gradient(to right, #ff9a9e, transparent);
	border-radius: 999px;
	transition: width 0.4s ease;
}

/* 底部统计展示区 */
.tag-footer {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	margin-top: 8px;
}

.tag-count {
	font-size: 0.75rem;
	font-weight: 800;
	color: #c9c1ab;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	display: flex;
	align-items: center;
	gap: 6px;
}

/* 添加一个精致的小点缀代替箭头 */
.tag-count::before {
	content: '';
	width: 6px;
	height: 6px;
	background-color: #ffcad4;
	border-radius: 999px;
	display: inline-block;
}

/* 悬停动效 */
.tag-card:hover {
	transform: translateY(-8px);
	box-shadow: 0 25px 50px -15px rgba(255, 117, 140, 0.2);
	border-color: #ffcad4;
}

.tag-card:hover .tag-cover-img {
	transform: scale(1.1);
}

.tag-card:hover .style-underline {
	width: 100%;
	background: linear-gradient(to right, #ff9a9e, #fecfef);
}

/* 加载和空状态 */
.loading-container,
.empty-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80px 20px;
	gap: 16px;
}

.empty-text {
	font-size: 1.2rem;
	color: #c9c1ab;
	font-weight: 500;
}

/* 分页容器 */
.pagination-container {
	display: flex;
	justify-content: center;
	margin-top: 50px;
	padding: 20px 0;
}

/* 移动端适配 */
@media (max-width: 640px) {
	.tag-grid {
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}

	.tag-content-area {
		padding: 16px;
	}

	.style-name {
		font-size: 1.2rem;
	}

	.gallery-container {
		padding: 30px 15px;
	}

	.page-title {
		font-size: 1.75rem;
	}
}
</style>
