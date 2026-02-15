<template>
	<v-container max-width="1200px">
		<v-row justify="center" class="content-row">
			<v-col>
				<!-- 加载状态 -->
				<template
					v-if="
						webWorkStore.mangaList.length === 0 && !webWorkStore.mangaTotalItems
					"
				>
					<div class="d-flex align-center flex-wrap" style="flex-wrap: wrap">
						<v-col
							v-for="n in 8"
							:key="n"
							class="mb-4 px-2"
							cols="12"
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

				<template v-else-if="webWorkStore.mangaTotalItems === 0">
					<v-alert
						type="info"
						icon="mdi-magnify-remove-outline"
						variant="tonal"
						class="mt-10 pa-6"
					>
						<h3 class="text-h6 mb-2">抱歉，没有找到相关作品</h3>
						<p>
							请尝试更换关键词 **「{{ webWorkStore.mangaState.searchKey }}」**
							或清除搜索内容后再次查找。
						</p>
					</v-alert>
				</template>

				<template v-else>
					<v-card class="mx-auto my-card-container" flat hover>
						<v-row dense class="cards-grid" no-gutters>
							<v-col
								v-for="card in cards"
								:key="card.id"
								class="mb-4 book-col"
								cols="12"
								sm="6"
								md="3"
								lg="3"
								xl="3"
								style="padding: 0 2px"
							>
								<v-card ripple class="my-card">
									<v-lazy
										:options="{ threshold: 0.1 }"
										min-height="400"
										transition="fade-transition"
										style="margin: 0 12px"
									>
										<Book3D
											:cover-url="card.coverUrl"
											:title="card.title"
											:author="card.author"
											:spine-width="50"
											:width="260"
											:height="400"
											:show-title="false"
											@click="handleBookClick(card.id)"
										>
											<template #overlay>
												<!-- 左上角分类标签 -->
												<AnimeTags :tags="card.tags" position="bottom-left" />
											</template>
										</Book3D>
									</v-lazy>

									<!-- 百合二次元风格卡片信息区 -->
									<div class="yuri-card-info">
										<!-- 标题 -->
										<h3
											v-copy="card.title"
											v-tooltip="card.title"
											class="yuri-title truncate"
										>
											{{ card.title }}
										</h3>

										<!-- 作者与标签整合行：作者在左，标签在右 -->
										<div class="yuri-author-tags-row">
											<!-- 左侧：作者信息 -->
											<div class="yuri-author-info">
												<div class="yuri-author-line">
													<span class="yuri-by-text">By</span>
													<span
														v-copy="card.author"
														v-tooltip="'点击搜索作者/右键复制'"
														class="yuri-author-name truncate"
														@click="handleAuthorClick(card.author)"
													>
														{{ card.author }}
													</span>
												</div>
												<!-- 作者下方的装饰长线：宽度修改为 w-full -->
												<div class="yuri-author-underline"></div>
											</div>

											<!-- 右侧：标签组 -->
											<div class="yuri-tags-group">
												<span class="yuri-tag length-tag">
													{{
														card.lengthType === 'Long'
															? '长篇'
															: card.lengthType === 'Medium'
																? '中篇'
																: '短篇'
													}}
												</span>
												<span
													class="yuri-tag"
													:class="
														card.serialType === 'Serializing'
															? 'serializing-tag'
															: 'finished-tag'
													"
												>
													{{
														card.serialType === 'Serializing'
															? '连载中'
															: '已完结'
													}}
												</span>
											</div>
										</div>

										<!-- 百合浓度：独立展示区 -->
										<div class="yuri-concentration-section">
											<div class="yuri-concentration-header">
												<div class="yuri-concentration-label">
													<svg
														class="yuri-heart-icon"
														fill="currentColor"
														viewBox="0 0 20 20"
														width="14"
														height="14"
													>
														<path
															fillRule="evenodd"
															d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
															clipRule="evenodd"
														/>
													</svg>
													<span class="yuri-concentration-text">百合指数</span>
												</div>
												<span class="yuri-concentration-value">{{
													card?.lastNo || '1000'
												}}</span>
											</div>
											<!-- 渐变进度条 -->
											<div class="yuri-progress-bar">
												<div
													class="yuri-progress-fill"
													:style="{
														width:
															typeof card?.lastNo === 'number'
																? `${Math.min(100, Math.max(0, card.lastNo))}%`
																: card?.lastNo || '100%',
													}"
												></div>
											</div>
										</div>
									</div>
								</v-card>
							</v-col>
						</v-row>
					</v-card>
				</template>
			</v-col>
		</v-row>
		<v-pagination
			v-model="page"
			:length="webWorkStore.mangaPageCount"
		></v-pagination>
	</v-container>
</template>

<script setup lang="ts">
import type { WorkListRes } from '~/shared/dto/web/work';
export type WorkItemType = WorkListRes['list'][number];

const webWorkStore = useWebWorkStore();
const router = useRouter();
const page = computed({
	get: () => webWorkStore.mangaState.page,
	set: (value) => {
		webWorkStore.mangaState.page = value;
	},
});
const cards = computed<WorkItemType[]>(() => webWorkStore.mangaList);

const handleBookClick = (bookId: number) => {
	router.push(`/manga/${bookId}`);
};

const handleAuthorClick = (author: string) => {
	// 设置搜索关键词为作者名并触发搜索
	webWorkStore.mangaInputKey = author;
	webWorkStore.triggerMangaSearch();
};

const { error } = useAsyncData(
	'manga-list-data',
	async () => {
		await webWorkStore.fetchWorkList(webWorkStore.mangaState);
		return webWorkStore.mangaList;
	},
	{
		watch: [() => page.value],
	},
);

if (error.value) {
	console.error('漫画列表数据加载失败:', error.value);
}
</script>

<style scoped>
/* 骨架屏样式 - 强制覆盖 */
.skeleton-book :deep(.v-skeleton-loader__bone.v-skeleton-loader__image) {
	height: 400px !important;
	min-height: 400px !important;
	max-height: 400px !important;
}

/* 基础容器 */
.my-card-container {
	padding: 0 !important;
}

.my-card {
	background: white !important;
	box-shadow: 0 20px 40px -10px rgba(125, 90, 90, 0.15) !important;
	overflow: hidden !important;
	width: 100%;
	display: flex;
	flex-direction: column;
	border-radius: 16px;
	/* 移除整体边框，只在信息区域添加边框 */
	transition: all 0.3s ease;
}

/* 卡片列间距调整 - 增加间距 */
.book-col {
	padding: 0 16px !important;
	margin-bottom: 32px !important;
}

/* 确保 v-lazy 容器铺满 */
.my-card :deep(.v-lazy) {
	width: 100% !important;
	display: block;
}

/* Book3D 组件居中显示 */
.my-card :deep(.book-3d-container) {
	width: 100% !important;
	height: 400px !important;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 0 !important;
	margin: 0 !important;
	overflow: hidden;
	box-sizing: border-box;
}

/* Book3D wrapper 保持原尺寸，居中显示 */
.my-card :deep(.book-3d-wrapper) {
	/* 移除强制铺满，让组件使用自己的宽度计算，居中显示 */
	height: 100% !important;
}

.my-card :deep(.book-cover-main) {
	width: 100% !important;
	height: 100% !important;
	/* 封面主体铺满 */
}

/* 确保封面图片铺满 */
.my-card :deep(.book-cover-image) {
	width: 100% !important;
	height: 100% !important;
}

/* 百合二次元风格卡片信息区样式 */
.yuri-card-info {
	padding: 20px;
	background: white;
	border-top: 1px solid #f2ece6; /* 只在信息区域顶部添加边框，分隔封面和信息 */
	width: 100%;
	box-sizing: border-box;
	/* 确保信息区域宽度和封面容器一致 */
	max-width: 100%;
}

.yuri-title {
	font-size: 18px;
	font-weight: 700;
	color: #5a463d;
	margin-bottom: 16px;
	letter-spacing: -0.01em;
	line-height: 1.3;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.yuri-title:hover {
	color: #ff758c;
}

.yuri-author-tags-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24px;
}

.yuri-author-info {
	position: relative;
	flex: 1;
	min-width: 0;
}

.yuri-author-line {
	display: flex;
	align-items: baseline;
	gap: 6px;
}

.yuri-by-text {
	font-size: 10px;
	font-weight: 900;
	color: #ff9a9e;
	text-transform: uppercase;
	letter-spacing: -0.02em;
}

.yuri-author-name {
	font-size: 14px;
	font-weight: 700;
	color: #7d5a5a;
	cursor: pointer;
	transition: color 0.2s ease;
	max-width: 80px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.yuri-author-name:hover {
	color: #ff758c;
}

.yuri-author-underline {
	margin-top: 4px;
	width: 100%;
	height: 2px;
	background: linear-gradient(to right, #ff9a9e, transparent);
	border-radius: 9999px;
}

.yuri-tags-group {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
	justify-content: flex-end;
}

.yuri-tag {
	padding: 4px 8px;
	border-radius: 6px;
	font-size: 9px;
	font-weight: 700;
	white-space: nowrap;
	border: 1px solid;
}

.length-tag {
	background: #fcf8f2;
	color: #c9c1ab;
	border-color: #e8dfd5;
}

.serializing-tag {
	background: #fff0f3;
	color: #ff758c;
	border-color: #ffcad4;
}

.finished-tag {
	background: #f0fff4;
	color: #2ed573;
	border-color: #b7ebc6;
}

.yuri-concentration-section {
	padding-top: 16px;
	border-top: 1px solid #f2ece6;
}

.yuri-concentration-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.yuri-concentration-label {
	display: flex;
	align-items: center;
	gap: 6px;
}

.yuri-heart-icon {
	width: 14px;
	height: 14px;
	color: #ff758c;
}

.yuri-concentration-text {
	font-size: 11px;
	font-weight: 800;
	color: #9a8471;
	text-transform: uppercase;
	letter-spacing: 0.1em;
}

.yuri-concentration-value {
	font-size: 12px;
	font-weight: 900;
	color: #ff758c;
}

.yuri-progress-bar {
	height: 8px;
	width: 100%;
	background: #f2ece6;
	border-radius: 9999px;
	overflow: hidden;
	padding: 1px;
}

.yuri-progress-fill {
	height: 100%;
	background: linear-gradient(to right, #ff9a9e, #ff758c, #fecfef);
	border-radius: 9999px;
	transition: width 0.7s ease;
}

/* 卡片悬停效果 */
.my-card:hover {
	box-shadow: 0 25px 50px -12px rgba(125, 90, 90, 0.25) !important;
	transform: translateY(-4px);
}

.my-card:hover .yuri-card-info {
	background: #fefcf9;
}

/* 移除卡片 hover 时作者名变色，只保留作者名自身 hover 效果 */
.my-card:hover .yuri-progress-fill {
	background: linear-gradient(to right, #ff9a9e, #ff758c, #ff9a9e);
}
</style>

<style>
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
