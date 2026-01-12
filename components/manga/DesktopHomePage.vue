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
						<v-row dense class="cards-grid">
							<v-col
								v-for="card in cards"
								:key="card.id"
								class="mb-4 px-2"
								cols="12"
								sm="6"
								md="3"
								lg="3"
								xl="3"
							>
								<v-card ripple class="my-card">
									<v-lazy
										v-model="isVisible"
										:options="{ threshold: 0.5 }"
										min-height="200"
										transition="fade-transition"
									>
										<div class="manga-card-wrapper" style="position: relative">
											<NuxtLink :to="`/manga/${card.id}`" class="d-block">
												<v-img
													:src="card.coverUrl"
													:alt="
														card.title ? `封面图片：${card.title}` : '卡片封面'
													"
													class="align-end"
													gradient="to bottom, rgba(0,0,0,.0), rgba(0,0,0,.4)"
													height="400px"
													cover
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
											</NuxtLink>
											<div class="manga-title-overlay" @click.stop>
												<span v-copy="card.title" v-tooltip="'右键复制标题'">
													{{ card.title }}
												</span>
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
const page = computed({
	get: () => webWorkStore.mangaState.page,
	set: (value) => {
		webWorkStore.mangaState.page = value;
	},
});
const cards = computed<WorkItemType[]>(() => webWorkStore.mangaList);

const handleAuthorClick = (author: string) => {
	webWorkStore.mangaInputKey = author;
	webWorkStore.triggerMangaSearch();
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
.my-card {
	transition:
		transform 0.3s ease-in-out,
		box-shadow 0.3s ease-in-out;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.my-card:hover {
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
	transform: translateY(-2px) scale(1.03);
	z-index: 10;
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
</style>
