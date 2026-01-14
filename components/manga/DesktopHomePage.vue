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
																backgroundImage: `url(${card.coverUrl})`,
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
																	<span class="author-tag">著</span>
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

// 当封面图加载完成时，计算其物理比例
const handleImageLoad = (event: any, bookId: number) => {
	const img = event.target;
	if (img && img.naturalWidth && img.naturalHeight) {
		const height = 400; // 固定的显示高度
		const spineWidth = 45; // 固定的书脊宽度
		
		// 计算图片在 400px 高度下的总宽度
		const totalWidth = (img.naturalWidth / img.naturalHeight) * height;
		
		// 书本封面部分的显示宽度 = 总宽度 - 书脊宽度
		// 设定一个合理的范围限制，防止极端比例
		const calculatedWidth = Math.max(150, Math.min(320, totalWidth - spineWidth));
		
		bookWidths.value[bookId] = calculatedWidth;
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
	width: 280px; /* 固定的展示宽度，使布局整齐 */
	height: 100%;
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
	/* 关键修改：高度补偿 1px，位置上移 0.5px，消除旋转带来的子像素间隙 */
	top: -0.5px;
	height: calc(100% + 1px);
	left: 0;
	width: var(--spine-width);
	z-index: 5;
	/* 关键：旋转轴在右边缘，向左转 90 度 */
	transform-origin: right center;
	transform: translateX(calc(-1 * var(--spine-width))) rotateY(-90deg);
	
	background-size: auto 100%;
	background-position: left center;
	background-repeat: no-repeat;
	box-shadow: inset -3px 0 10px rgba(0, 0, 0, 0.5);
	overflow: hidden;
	/* 防止闪烁 */
	backface-visibility: hidden;
}

/* 书脊遮罩 */
.book-spine::after {
	content: '';
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.3);
	z-index: 1;
}

.book-spine-content {
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center; /* 整体垂直居中 */
	height: 100%;
	padding: 30px 4px; /* 增加上下边距，更像真实书脊 */
	box-sizing: border-box;
}

.book-spine-title {
	color: #ffffff;
	font-size: 19px; /* 增大字号 */
	font-weight: 800; /* 显著加粗，提升冲击力 */
	font-style: italic; /* 添加斜体 */
	writing-mode: vertical-rl;
	text-orientation: upright;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9); /* 强化阴影，解决白色文字在浅色背景下的可读性 */
	max-height: calc(100% - 110px); /* 动态限制高度，确保不挤压作者 */
	letter-spacing: 2px;
}

.book-spine-author {
	color: #ffffff;
	font-size: 13px; /* 稍微增大 */
	font-weight: 700; /* 加粗 */
	font-style: italic; /* 添加斜体 */
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 15px;
	text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}

.author-name {
	writing-mode: vertical-rl;
	text-orientation: upright;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-height: 70px;
	margin-bottom: 6px;
	letter-spacing: 1px;
}

.author-tag {
	border: 1.5px solid #ffffff; /* 加粗边框 */
	border-radius: 3px;
	font-size: 11px;
	font-weight: 900;
	padding: 1px 3px;
	background: rgba(0, 0, 0, 0.3); /* 稍微加深背景，提升印章感 */
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
	/* 强制增加宽度以容纳书脊部分的像素 */
	width: calc(100% + var(--spine-width)) !important;
	/* 向左偏移，跳过书脊展示的像素 */
	left: calc(-1 * var(--spine-width)) !important;
	/* 关键修改：使用 fill，因为容器宽度已经按比例算好了，fill 此时就是 100% 原生比例 */
	object-fit: fill !important;
	object-position: left center !important;
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
	background: linear-gradient(
		to right,
		rgba(0, 0, 0, 0.4) 0%,
		rgba(0, 0, 0, 0.1) 20%,
		transparent 100%
	);
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
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.85));
	z-index: 15;
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
