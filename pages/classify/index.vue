<template>
	<div class="category-page">
		<div class="gallery-container">
			<!-- 页面顶部 -->
			<header class="page-header">
				<!-- <span class="page-subtitle">Collection Categories</span> -->
				<h1 class="page-title">作品分类</h1>
			</header>

			<!-- 分类列表 -->
			<ClientOnly>
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
									<v-img
										src="/error-default.jpg"
										cover
										height="100%"
										width="100%"
									/>
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
							<div class="tag-section tag-left">
								<span class="tag-label">TAG</span>
								<span class="tag-value">{{ tag.content }}</span>
								<div class="tag-underline tag-underline-left"></div>
							</div>
							<div class="tag-section tag-right">
								<span class="tag-label">TOTAL</span>
								<span class="tag-value">{{ tag.workCount || 0 }}</span>
								<div class="tag-underline tag-underline-right"></div>
							</div>
						</div>
					</div>
				</div>

				<template #fallback>
					<div class="loading-container">
						<v-progress-circular
							indeterminate
							color="primary"
						></v-progress-circular>
					</div>
				</template>
			</ClientOnly>
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

// 获取标签列表
const { data: tagListData, pending: isPending } =
	useApiFetch('/api/web/tag/all');

// 标签列表
const tagList = ref([]);

// 更新标签列表
watch(
	() => tagListData.value?.data,
	(newData) => {
		if (!newData || !Array.isArray(newData)) {
			tagList.value = [];
			return;
		}

		tagList.value = newData.map((tag) => ({
			id: tag.id,
			content: tag.content,
			cover: tag.cover,
			workCount: 0, // 占位符，后续由后端提供
		}));
	},
	{ immediate: true },
);

// 处理标签点击
const handleTagClick = (tag) => {
	navigateTo(`/classify/${tag.id}`);
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
	flex-direction: row;
	align-items: flex-start;
	justify-content: space-between;
	gap: 24px;
}

/* 左右两侧统一样式 */
.tag-section {
	display: flex;
	flex-direction: column;
	gap: 0;
	flex: 1;
}

.tag-left {
	align-items: flex-start;
}

.tag-right {
	align-items: flex-end;
	text-align: right;
}

/* 统一的标签文字样式 */
.tag-label {
	font-size: 10px;
	font-weight: 900;
	color: #ff9a9e;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	display: block;
	line-height: 1;
	margin-bottom: 4px;
}

/* 统一的值样式 */
.tag-value {
	font-size: 1.5rem;
	font-weight: 800;
	color: #5a463d;
	line-height: 1.2;
	display: block;
	margin-top: 0;
	letter-spacing: 0;
}

/* 统一的下划线样式 */
.tag-underline {
	margin-top: 6px;
	width: 60px;
	height: 4px;
	border-radius: 999px;
	transition: width 0.4s ease;
}

.tag-underline-left {
	background: linear-gradient(to right, #ff9a9e, transparent);
}

.tag-underline-right {
	background: linear-gradient(to right, #7ee8fa, #80ff72);
	margin-left: auto;
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

.tag-card:hover .tag-underline {
	width: 100%;
}

.tag-card:hover .tag-underline-left {
	background: linear-gradient(to right, #ff9a9e, #fecfef);
}

.tag-card:hover .tag-underline-right {
	background: linear-gradient(to right, #7ee8fa, #80ff72);
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
		gap: 16px;
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
	}

	.tag-section {
		flex: 1;
	}

	.tag-right {
		align-items: flex-end;
		text-align: right;
	}

	.tag-value {
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
