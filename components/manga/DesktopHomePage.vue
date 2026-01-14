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
							<v-skeleton-loader type="image, text, text" height="400" />
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
									>
										<div class="book-3d-container">
											<div
												class="book-3d-wrapper"
												:style="{ width: (bookWidths[card.id] || 260) + 'px' }"
											>
												<div
													class="book-cover-link"
													@click="handleBookClick(card.id)"
												>
													<!-- 整个书体 -->
													<div class="book-body">
														<!-- 书脊（侧封） -->
														<div
															class="book-spine"
															:style="{
																backgroundColor:
																	spineColors[card.id] || '#2c3e50',
															}"
														>
															<div class="book-spine-content">
																<div class="book-spine-title">
																	{{ card.title }}
																</div>
																<div class="book-spine-author">
																	<span class="author-name">{{
																		card.author
																	}}</span>
																</div>
															</div>
														</div>
														<!-- 封面（正面） -->
														<div class="book-cover-main">
															<v-img
																:src="card.coverUrl"
																:alt="card.title"
																class="book-cover-image"
																height="400px"
																cover
																eager
																@load="handleImageLoad($event, card.id)"
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
																<span
																	v-copy="card.title"
																	v-tooltip="'右键复制标题'"
																>
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
import { useGetAverageRGB } from '~/utils/useGetAverageRGB';
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

// 存储每本书根据比例计算出的动态宽度
const bookWidths = ref<Record<number, number>>({});
// 存储书脊的动态背景色
const spineColors = ref<Record<number, string>>({});
// 记录已经处理过的 ID，防止重复提取
const processingIds = new Set<number>();

// 核心：提取颜色并计算宽度的统一处理函数
const processBookMetadata = async (card: WorkItemType, index: number) => {
	if (processingIds.has(card.id)) return;
	processingIds.add(card.id);

	// 1. 提取颜色：严格仅限列表前 4 张
	if (index < 4) {
		try {
			const [r, g, b] = await useGetAverageRGB(card.coverUrl);

			spineColors.value[card.id] = `rgb(${Math.floor(r)}, ${Math.floor(
				g,
			)}, ${Math.floor(b)})`;
		} catch (err) {
			// 前四张提取失败的兜底：使用高级百合橘
			spineColors.value[card.id] = '#FF9E5E';
		}
	}

	// 2. 预计算书本宽度
	const img = new Image();
	img.onload = () => {
		const height = 400;
		const totalWidth = (img.naturalWidth / img.naturalHeight) * height;
		bookWidths.value[card.id] = Math.max(150, Math.min(300, totalWidth));
	};
	img.src = card.coverUrl;
};

// 关键：监听列表变化，主动遍历处理
watch(
	() => webWorkStore.mangaList,
	async (newList) => {
		if (newList && newList.length > 0) {
			for (let i = 0; i < newList.length; i++) {
				const card = newList[i];
				if (!processingIds.has(card.id)) {
					await processBookMetadata(card, i);
					// 只有前 4 张需要提取颜色时才进行串行等待，其余快速处理
					if (i < 4) {
						await new Promise((resolve) => setTimeout(resolve, 300));
					}
				}
			}
		}
	},
	{ immediate: true },
);

/**
 * handleImageLoad 兜底处理
 */
const handleImageLoad = (payload: any, bookId: number) => {
	if (processingIds.has(bookId)) return;
	const index = webWorkStore.mangaList.findIndex((c) => c.id === bookId);
	const card = webWorkStore.mangaList[index];
	if (card) {
		processBookMetadata(card, index);
	}
};

const handleAuthorClick = (author: string) => {
	webWorkStore.mangaInputKey = author;
	webWorkStore.triggerMangaSearch();
};

const handleBookClick = (bookId: number) => {
	router.push(`/manga/${bookId}`);
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
/* 基础容器 */
.my-card-container {
	padding: 0 !important;
}

.my-card {
	background: transparent !important;
	box-shadow: none !important;
	overflow: visible !important;
}

/* 3D 舞台环境 */
.book-3d-container {
	--spine-width: 45px;
	perspective: 1200px;
	perspective-origin: center center;
	width: 100%;
	height: 400px;
	margin: 20px 0;
	display: flex;
	justify-content: center;
	align-items: center;
}

.book-3d-wrapper {
	width: 400px;
	transform-style: preserve-3d;
	position: relative;
}

.book-cover-link {
	display: block;
	width: 100%;
	height: 100%;
}

/* 书体组合 - 绕交界线旋转 */
.book-body {
	position: relative;
	width: 100%;
	height: 100%;
	transform-style: preserve-3d;
	/* 关键：整个书向右侧倾斜，露出左边的书脊 */
	transform: rotateY(35deg);
	transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform;
	/* 强制开启 GPU 高精度渲染 */
	-webkit-font-smoothing: antialiased;
}

/* 书脊 - 物理上垂直于封面 */
.book-spine {
	position: absolute;
	top: -0.5px;
	height: calc(100% + 1px);
	left: 0;
	width: var(--spine-width);
	z-index: 5;
	transform-origin: right center;
	transform: translateX(calc(-1 * var(--spine-width))) rotateY(-90deg);

	/* 基础质感：使用稍微加深的主色调，并添加微弱的纸张纹理 */
	background-blend-mode: multiply;
	background-image: repeating-linear-gradient(
		45deg,
		rgba(0, 0, 0, 0.03) 0px,
		rgba(0, 0, 0, 0.03) 1px,
		transparent 1px,
		transparent 2px
	);
	box-shadow: inset -2px 0 8px rgba(0, 0, 0, 0.3);
	overflow: hidden;
	backface-visibility: hidden;
}

/* 书脊遮罩：设计出“圆润”且有光泽的 3D 模拟效果 */
.book-spine::after {
	content: '';
	position: absolute;
	inset: 0;
	/* 关键：通过多层渐变模拟书脊的圆弧光影 */
	background: linear-gradient(
		to right,
		rgba(0, 0, 0, 0.4) 0%,
		/* 左边缘折叠影 */ rgba(0, 0, 0, 0.1) 10%,
		transparent 30%,
		rgba(255, 255, 255, 0.2) 50%,
		/* 中心高光，模拟书脊弧度 */ transparent 70%,
		rgba(0, 0, 0, 0.1) 90%,
		rgba(0, 0, 0, 0.3) 100% /* 右边缘（与封面交界）深影 */
	);
	z-index: 1;
}

.book-spine-content {
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 25px 0;
	box-sizing: border-box;
	width: 100%;
	white-space: nowrap;
}

.book-spine-title {
	color: #ffffff;
	font-size: 20px;
	font-weight: 800;
	writing-mode: vertical-rl;
	text-orientation: upright;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 8;
	-webkit-box-orient: vertical;
	max-height: 220px;
	margin-bottom: 15px;
	letter-spacing: 3px;
	text-align: center;
	/* 增强对比度，确保在任何颜色背景下都清晰 */
	text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
}

/* 作者容器 */
.book-spine-author {
	color: rgba(255, 255, 255, 0.9);
	font-size: 15px;
	font-weight: 700;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.author-name {
	writing-mode: vertical-rl;
	text-orientation: upright;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	max-height: 80px;
	letter-spacing: 1px;
	text-align: center;
}

/* 封面主体 */
.book-cover-main {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: #222;
	box-shadow: 5px 5px 20px rgba(0, 0, 0, 0.3);
	/* 关键：封面稍微向前推 0.1px，确保盖住书脊的边缘 */
	transform: translateZ(0.1px);
}

/* 封面图片：关键位移逻辑 */
:deep(.book-cover-image .v-img__img) {
	width: 100% !important;
	left: 0 !important;
	object-fit: cover !important;
	object-position: center !important;
}

/* 折痕处的高光阴影过渡 */
.book-cover-main::after {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	width: 15px;
	height: 100%;
	z-index: 10;
	pointer-events: none;
}

/* 底部投影 */
.book-body::before {
	content: '';
	position: absolute;
	bottom: -15px;
	left: -5px;
	width: calc(100% + 10px);
	height: 30px;
	background: rgba(0, 0, 0, 0.4);
	filter: blur(12px);
	transform: rotateX(90deg) translateZ(-10px);
	z-index: -1;
}

/* 标题覆盖层 */
.manga-title-overlay {
	position: absolute;
	bottom: 0;
	inset-inline: 0;
	padding: 16px 12px;
	color: white;
	font-weight: 600;
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
	z-index: 15;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.author-chip {
	cursor: pointer;
	transition: color 0.3s;
}

.author-chip:hover {
	color: #c00000;
	font-weight: bold;
}

@media (max-width: 960px) {
	.book-3d-wrapper {
		width: 220px;
	}
	.book-3d-container {
		--spine-width: 35px;
	}
}
</style>
