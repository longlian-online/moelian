<template>
	<v-container max-width="1200px">
		<v-row justify="center" class="content-row">
			<v-col>
				<!-- 骨架屏 -->
				<!-- <template v-if="pending">
					<div class="d-flex align-center flex-wrap" style="flex-wrap: wrap">
						<v-col v-for="n in 24" :key="n" class="mb-4 px-2" cols="3">
							<v-skeleton-loader type="image,text@2" />
						</v-col>
					</div>
				</template> -->

				<template v-if="webWorkStore.mangaTotalItems === 0">
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
								style="padding: 0 2px;"
							>
								<v-card ripple class="my-card">
									<v-lazy
										v-model="isVisible"
										:options="{ threshold: 0.5 }"
										min-height="200"
										transition="fade-transition"
									>
										<div 
											class="book-3d-container"
											:class="{ 'book-opening': openingBooks.has(card.id) }"
										>
											<div class="book-3d-wrapper">
												<div 
													class="book-cover-link"
													@click="handleBookClick(card.id)"
													:style="{ cursor: openingBooks.has(card.id) ? 'wait' : 'pointer' }"
												>
													<div class="book-cover">
														<!-- 书脊（侧封） - 使用封面图片的左侧 -->
														<div 
															class="book-spine"
															:style="{ backgroundImage: `url(${card.coverUrl})` }"
														>
															<div class="book-spine-content">
																<div class="book-spine-title">
																	{{ card.title }}
																</div>
																<div class="book-spine-author">
																	{{ card.author }}
																</div>
															</div>
														</div>
														<!-- 封面 -->
														<div class="book-cover-image-wrapper">
															<v-img
																:src="card.coverUrl"
																:alt="
																	card.title ? `封面图片：${card.title}` : '卡片封面'
																"
																class="book-cover-image align-end"
																gradient="to bottom, rgba(0,0,0,.0), rgba(0,0,0,.4)"
																height="400px"
																cover
																eager
																:lazy-src="card.coverUrl"
															>
															<template #placeholder>
																<v-skeleton-loader
																	type="image"
																	class="fill-height"
																/>
															</template>
															<template #error>
																<v-img
																	cover
																	src="/error-default.jpg"
																	height="100%"
																	width="100%"
																	gradient="to bottom, rgba(0,0,0,.0), rgba(0,0,0,.4)"
																/>
															</template>
														</v-img>
														<div class="manga-title-overlay" @click.stop>
															<span v-copy="card.title" v-tooltip="'右键复制标题'">
																{{ card.title }}
															</span>
														</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</v-lazy>

									<v-card-actions>
										<v-row dense class="pa-0 my-custom-actions-row">
											<v-col cols="6" class="py-0 d-flex align-center">
												<v-icon
													icon="mdi-account"
													size="small"
													color="#C9C1AB"
												></v-icon>
												<v-chip
													size="small"
													variant="text"
													class="px-0 ms-2 author-chip"
													@click="handleAuthorClick(card.author)"
												>
													<span
														v-copy="card.author"
														v-tooltip="'点击搜索作者/右键复制'"
													>
														{{ card.author }}
													</span>
												</v-chip>
											</v-col>

											<v-col cols="6" class="py-0 d-flex align-center">
												<v-icon
													icon="mdi-chart-bar"
													size="small"
													color="#C9C1AB"
												></v-icon>
												<v-chip size="small" variant="text" class="px-0 ms-2">
													<span v-if="card.lengthType === 'Short'">短篇</span>
													<span v-if="card.lengthType === 'Medium'">中篇</span>
													<span v-if="card.lengthType === 'Long'">长篇</span
													>漫画
												</v-chip>
											</v-col>

											<v-col cols="6" class="py-0 d-flex align-center">
												<v-icon
													:icon="
														card.serialType === 'Serializing'
															? 'mdi-update'
															: 'mdi-check-circle'
													"
													size="small"
													color="#C9C1AB"
												></v-icon>
												<v-chip size="small" variant="text" class="px-0 ms-2">
													<span v-if="card.serialType === 'Serializing'"
														>连载中</span
													>
													<span v-else>已完结</span>
												</v-chip>
											</v-col>

											<v-col cols="6" class="py-0 d-flex align-center">
												<v-icon
													icon="mdi-fire"
													size="small"
													color="#C9C1AB"
												></v-icon>
												<v-chip size="small" variant="text" class="px-0 ms-2">
													热度:{{ card?.lastNo || '1000' }}
												</v-chip>
											</v-col>
										</v-row>
									</v-card-actions>
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

// 跟踪正在打开的书籍
const openingBooks = ref(new Set<number>());

const handleAuthorClick = (author: string) => {
	webWorkStore.mangaInputKey = author;
	webWorkStore.triggerMangaSearch();
};

// 处理书籍封面点击
const handleBookClick = (bookId: number) => {
	// 如果已经在打开中，不重复触发
	if (openingBooks.value.has(bookId)) {
		return;
	}

	// 标记为正在打开
	openingBooks.value.add(bookId);

	// 等待动画完成（600ms）后跳转
	setTimeout(() => {
		router.push(`/manga/${bookId}`);
		// 跳转后清理状态（延迟一下，确保动画完成）
		setTimeout(() => {
			openingBooks.value.delete(bookId);
		}, 100);
	}, 600);
};

const isVisible = ref(false);
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
.book-col {
	overflow: visible !important;
	padding-left: 0 !important;
	padding-right: 0 !important;
}

.my-card {
	transition:
		transform 0.3s ease-in-out,
		box-shadow 0.3s ease-in-out;
	box-shadow: none;
	background: transparent !important;
	overflow: visible !important;
	height: 100%;
}

.my-card:hover {
	box-shadow: none;
	transform: none;
	z-index: 10;
}

.cards-grid {
	margin: 0 !important;
}

.my-card-container {
	padding: 0 !important;
}

/* 3D书封容器 */
.book-3d-container {
	perspective: 1200px;
	perspective-origin: center center;
	width: 100%;
	height: 400px;
	position: relative;
	padding-left: 0; /* 不需要额外padding，书脊会自然显示 */
	overflow: visible;
	margin-left: -5px; /* 微调，消除间隙 */
}

.book-3d-wrapper {
	position: relative;
	width: 100%;
	height: 100%;
	transform-style: preserve-3d;
}

.book-cover-link {
	display: block;
	width: 100%;
	height: 100%;
	text-decoration: none;
	color: inherit;
}

/* 书封主体 - 默认立体展开状态，无间隙 */
.book-cover {
	position: relative;
	width: 100%;
	height: 100%;
	transform-style: preserve-3d;
	transition: transform 0.6s;
	transform-origin: left center;
	/* 默认立体展开，消除白色间隙 */
	transform: translateX(-15px) translateZ(45px) translateX(45px) rotateY(45deg);
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	will-change: transform;
}

/* 转角处的装饰 */
.book-cover::after {
	content: "";
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	width: 8px;
	z-index: 20;
	transform: translateZ(1px);
	background: linear-gradient(
		to right,
		rgba(0, 0, 0, 0.3) 0%,
		rgba(0, 0, 0, 0.1) 50%,
		transparent 100%
	);
	pointer-events: none;
}

/* 封面图片容器 */
.book-cover-image-wrapper {
	position: relative;
	width: 100%;
	height: 100%;
	transform: translateZ(0);
}

/* 优化v-img内部图片渲染 */
:deep(.book-cover-image img),
:deep(.book-cover-image picture) {
	image-rendering: -webkit-optimize-contrast;
	image-rendering: crisp-edges;
	transform: translateZ(0);
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
}

/* 书脊（侧封）效果 - 使用封面图片的左侧部分，拉伸到书脊 */
.book-spine {
	position: absolute;
	left: 0;
	top: 0;
	width: 45px;
	height: 100%;
	/* 使用很大的宽度值，让图片左边的45px部分被拉伸到书脊的45px宽度 */
	background-size: 1000px 100%;
	background-position: 0 center;
	background-repeat: no-repeat;
	transform: translateX(-45px) rotateY(-90deg) translateZ(0);
	transform-origin: 0 0;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
	z-index: 5;
	transition: all 0.6s;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	will-change: transform;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

/* 书脊的遮罩层，增加立体感和文字可读性 */
.book-spine::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.3);
	pointer-events: none;
	z-index: 1;
}

/* 书脊内容 - 文字竖着排列，整体居中 */
.book-spine-content {
	width: 50px;
	height: 400px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	gap: 15px;
	text-align: center;
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	z-index: 2;
	padding: 30px 8px;
	box-sizing: border-box;
}

.book-spine-title {
	color: rgba(255, 255, 255, 0.95);
	font-size: 18px;
	font-weight: 600;
	line-height: 1.6;
	text-shadow: 
		0 2px 4px rgba(0, 0, 0, 0.8),
		0 0 2px rgba(0, 0, 0, 0.5);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 34px;
	max-height: calc(100% - 90px);
	flex: 1 1 0;
	min-height: 0;
	letter-spacing: 2px;
	position: relative;
	z-index: 1;
	writing-mode: vertical-rl;
	text-orientation: upright;
	text-align: center;
	box-sizing: border-box;
}

.book-spine-author {
	color: rgba(255, 255, 255, 0.8);
	font-size: 13px;
	font-weight: 400;
	text-shadow: 
		0 1px 3px rgba(0, 0, 0, 0.8),
		0 0 1px rgba(0, 0, 0, 0.5);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 34px;
	flex: 0 0 auto;
	min-height: 60px;
	height: 60px;
	letter-spacing: 1.5px;
	position: relative;
	z-index: 1;
	writing-mode: vertical-rl;
	text-orientation: upright;
	text-align: center;
	box-sizing: border-box;
}

/* 封面图片容器 */
.book-cover-image {
	position: relative;
	width: 100%;
	height: 100%;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
	transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	transform: translateZ(0);
	will-change: transform;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

/* 优化v-img内部图片渲染 */
:deep(.book-cover-image .v-img__img) {
	transform: translateZ(0);
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	image-rendering: auto;
	-webkit-font-smoothing: antialiased;
}

/* 移除hover效果，保持默认状态 */

/* 点击打开动画 */
.book-3d-container.book-opening .book-cover {
	transform: rotateY(-90deg) rotateX(5deg) translateZ(30px);
	pointer-events: none;
}

.book-3d-container.book-opening .book-cover-image {
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	opacity: 0.95;
}

.book-3d-container.book-opening .book-spine {
	transform: translateX(-45px) rotateY(-180deg);
}

/* 标题覆盖层 */
.manga-title-overlay {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 16px;
	color: white;
	font-size: 1.25rem;
	font-weight: 500;
	z-index: 2;
	user-select: text !important;
	-webkit-user-select: text !important;
	cursor: text;
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
	transition: all 0.3s ease;
	transform: translateZ(1px);
}

.manga-title-overlay:hover {
	font-weight: bold;
	/* 渐变文字 */
	background: linear-gradient(to bottom, #c00000 30%, #000 100%);
	background-clip: text;
	-webkit-background-clip: text;
	/* 让文字透明显示渐变 */
	color: transparent;
	-webkit-text-fill-color: transparent;
	/* 外发光 */
	text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
}

:deep(.v-skeleton-loader .v-skeleton-loader__image) {
	height: 400px !important;
	min-height: 400px !important;
}

.author-chip {
	cursor: pointer;
	transition: color 0.3s ease;
}

.author-chip:hover {
	color: #c00000;
	font-weight: bold;
}

/* 移动端优化 */
@media (max-width: 960px) {
	.book-3d-container {
		padding-left: 40px;
	}
	
	.book-spine {
		width: 40px;
		transform: translateX(-40px) rotateY(-90deg);
	}
	
	.book-spine-content {
		width: 400px;
		height: 40px;
		left: 30px;
	}
	
	.book-3d-container.book-opening .book-spine {
		transform: translateX(-40px) rotateY(-180deg);
	}
}
</style>
