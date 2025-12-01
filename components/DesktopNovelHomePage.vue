<template>
	<v-container max-width="1200px">
		<!-- <template v-if="pending">
			<div class="d-flex align-center flex-wrap;" style="flex-wrap: wrap">
				<v-col v-for="n in 24" :key="n" class="mb-4 px-2" cols="6">
					<div class="d-flex">
						<v-skeleton-loader type="image" height="140px" width="120px" />
						
						<div class="d-flex flex-wrap" style="flex: 1">
							<v-skeleton-loader type="text" class="mr-4 mb-2" width="100%" />
							<v-skeleton-loader type="text" class="mr-4 mb-2" width="50%" />
							<v-skeleton-loader type="text" class="mr-4 mb-2" width="50%" />
						</div>
					</div>
				</v-col>
			</div>
		</template> -->

		<template v-if="webWorkStore.novelTotalItems === 0">
			<v-alert
				type="info"
				icon="mdi-magnify-remove-outline"
				variant="tonal"
				class="mt-10 pa-6"
			>
				<h3 class="text-h6 mb-2">抱歉，没有找到相关作品 🥺</h3>
				<p>
					请尝试更换关键词 **「{{ webWorkStore.novelState.searchKey }}」**
					或清除搜索内容后再次查找。
				</p>
			</v-alert>
		</template>

		<template v-else>
			<template v-for="(pair, index) in cardPairs" :key="index">
				<v-sheet class="d-flex justify-start align-center" elevation="1">
					<div
						v-for="(card, cardIndex) in pair"
						:key="`card-${index}-${cardIndex}`"
						class="card-container d-flex justify-center align-center"
						@click="gotoNovalId(card.id)"
					>
						<v-sheet class="img-wrapper" @click="gotoNovalId(card.id)">
							<v-img :src="card.coverUrl" style="width: 100%">
								<template #placeholder>
									<v-skeleton-loader type="image" class="fill-height" />
								</template>
							</v-img>
						</v-sheet>
						<div class="content-wrapper d-flex flex-column">
							<v-card-title>{{ card.title }}</v-card-title>
							<v-card-subtitle
								><strong>作者：</strong>{{ card.author }}</v-card-subtitle
							>
							<v-card-subtitle
								><strong>篇幅：</strong>
								<span v-if="card.lengthType === 'Short'">短篇</span>
								<span v-if="card.lengthType === 'Medium'">中篇</span>
								<span v-if="card.lengthType === 'Long'">长篇</span>
							</v-card-subtitle>
							<!-- <v-card-subtitle
								><span
									v-for="tag in card.tag"
									:key="tag"
									style="padding: 2px"
									>{{ tag }}</span
								></v-card-subtitle
							> -->
							<v-card-text
								style="color: gray; padding: 4px 16px"
								class="flex-grow-1"
							>
								<div class="clamp-text">
									<strong>简介：</strong>{{ card.description }}
								</div>
							</v-card-text>
							<div style="color: #fabcd1; padding: 4px 16px" class="fancy-text">
								{{
									card.chapterUpdatedAt
										? dayjs(card.chapterUpdatedAt).format(
												'YYYY-MM-DD HH:mm:ss',
											) + ' 更新'
										: '暂未更新哦'
								}}
							</div>
						</div>
					</div>
				</v-sheet>
				<v-divider v-if="index < cardPairs.length - 1"></v-divider>
			</template>
			<v-pagination
				v-model="page"
				:length="webWorkStore.novelPageCount"
			></v-pagination>
		</template>
	</v-container>
</template>

<script setup lang="ts">
import type { WorkListRes } from '~/shared/dto/web/work';
import dayjs from 'dayjs';
export type WorkItemType = WorkListRes['list'][number];

const webWorkStore = useWebWorkStore();
const page = computed({
	get: () => webWorkStore.novelState.page,
	set: (value) => {
		webWorkStore.novelState.page = value;
	},
});
// 将 Store 中的 novelList 映射到模板使用的 cards 结构
const cards = computed<WorkItemType[]>(() => webWorkStore.novelList);

const { error } = await useAsyncData(
	'novel-list-data',
	async () => {
		await webWorkStore.fetchWorkList(webWorkStore.novelState);
		return webWorkStore.novelList;
	},
	{
		watch: [() => page.value],
	},
);

if (error.value) {
	console.error('漫画列表数据加载失败:', error.value);
}

//将卡片数组转换为成对的二维数组
const cardPairs = computed<WorkItemType[][]>(() => {
	const pairs = [];
	for (let i = 0; i < cards.value.length; i += 2) {
		pairs.push(cards.value.slice(i, i + 2));
	}
	return pairs;
});
const router = useRouter();
const gotoNovalId = (id: number) => {
	router.push(`/novel/${id}`);
};
</script>

<style scoped>
.card-container {
	width: 50%;
	height: 200px;
	padding: 16px;
	cursor: pointer;
}
.img-wrapper {
	width: 25%;
	height: 100%;
}
.content-wrapper {
	width: 75%;
	height: 100%;
}

.content-wrapper .v-card-title:hover {
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
.clamp-text {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2; /* 限制为 2 行 */
	line-clamp: 2;
	overflow: hidden;
	text-overflow: ellipsis;
}

.fancy-text {
	font-weight: bold;
	/* 渐变文字 */
	background: linear-gradient(to bottom, #c00000 30%, #000 100%);
	background-clip: text;
	-webkit-background-clip: text;
	/* 让文字透明显示渐变 */
	color: transparent;
	-webkit-text-fill-color: transparent;
	/* 黑色描边 */
	/* -webkit-text-stroke: 0.5px rgb(0, 0, 0, 0.6); */
	/* 外发光 */
	text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
}
</style>
