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
									>
										<Book3D
											:cover-url="card.coverUrl"
											:title="card.title"
											:author="card.author"
											:height="400"
											:width="260"
											:spine-width="50"
											@click="handleBookClick(card.id)"
										>
											<template #overlay>
												<!-- 左上角分类标签 -->
												<AnimeTags :tags="['校园']" />
											</template>
										</Book3D>
									</v-lazy>

									<!-- <v-card-actions>
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
									</v-card-actions> -->
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
	background: transparent !important;
	box-shadow: none !important;
	overflow: visible !important;
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
</style>
