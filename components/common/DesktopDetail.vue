<template>
	<v-container max-width="1200px">
		<template v-if="pending">
			<v-skeleton-loader type="image" />
		</template>
		<template v-else>
			<v-sheet class="d-flex justify-space-between">
				<v-sheet width="75%" elevation="0">
					<v-card class="mt-4" elevation="1" height="400px" width="100%">
						<v-row no-gutters>
							<v-col cols="4">
								<v-img
									:src="workDetail?.coverUrl"
									height="384px"
									class="my-2 mx-4"
									cover
								>
									<template #error>
										<v-img
											cover
											src="/error-default.jpg"
											height="100%"
											width="100%"
										/>
									</template>
								</v-img>
							</v-col>
							<v-col cols="8" class="pa-0">
								<v-card
									class="d-flex flex-column justify-space-between pa-0 align-items: baseline"
									elevation="0"
									height="100%"
								>
									<v-card-title class="text-h4 py-2"
										><span v-tooltip="'右键复制标题'" v-copy="workDetail.title">{{
											workDetail.title
										}}</span></v-card-title
									>

									<v-card-subtitle class="text-body-1">
										<strong>作者:</strong>
										<span
											v-tooltip="'右键复制作者'"
											v-copy="workDetail.author"
											>{{ workDetail.author }}</span
										>
									</v-card-subtitle>

									<v-card-subtitle class="text-body-1">
										<strong>状态：</strong>
										<template v-if="workDetail.serialType === 'Serializing'"
											>连载中</template
										>
										<template v-else>
											<span>已完结</span>
										</template>
									</v-card-subtitle>

									<v-card-subtitle class="text-body-1"
										><strong>更新至: </strong
										>{{ workDetail.lastChapterName }}</v-card-subtitle
									>
									<v-card-subtitle class="text-body-1">
										<strong>创建时间:</strong>
										{{
											dayjs(workDetail.chapterUpdatedAt).format(
												'YYYY-MM-DD HH:mm:ss',
											)
										}}</v-card-subtitle
									>

									<div class="text-body-1 pa-4">
										<div class="line-clamp-6-fixed">
											<span style="color: gray">
												<strong>简介：</strong>
											</span>
											<span
												v-tooltip="workDetail.description"
												v-copy="workDetail.description"
												>{{ workDetail.description }}</span
											>
										</div>
									</div>

									<v-card-actions class="pa-4">
										<v-row no-gutters>
											<v-col cols="4">
												<v-btn
													color="#33AAFF"
													variant="flat"
													class="mr-2"
													width="100%"
													:to="`/${props.contentType}/chapter/${sortedChapterList[0]?.id}`"
												>
													开始阅读
												</v-btn>
											</v-col>
											<!-- <v-col cols="1"></v-col>
											<v-col cols="2">
												<v-btn
													color="secondary"
													variant="outlined"
													prepend-icon="mdi-star"
													width="100%"
													class="d-flex align-center"
												>
													{{ props.btnContent }}
												</v-btn>
											</v-col> -->
										</v-row>
									</v-card-actions>
								</v-card>
							</v-col>
						</v-row>
					</v-card>
					<v-sheet>
						<v-card class="mt-4" width="100%">
							<v-card-title>章节列表</v-card-title>
							<v-card-subtitle class="d-flex justify-start align-center ga-4">
								<v-chip
									v-for="(chip, idx) in chapterChips"
									:key="chip.label"
									variant="flat"
									class="d-flex align-center justify-center"
									style="width: 80px; height: 32px; cursor: pointer"
									:color="
										idx === activeChunkIndex
											? 'blue-grey-lighten-2'
											: 'grey-lighten-2'
									"
									@click="selectChunkByIndex(idx)"
									>{{ chip.label }}</v-chip
								>
							</v-card-subtitle>

							<v-sheet height="200px">
								<v-card-text>
									<v-row>
										<v-col
											v-for="item in filteredChapterList"
											:key="item.id"
											cols="3"
										>
											<v-btn
												width="100%"
												elevation="0"
												border="md"
												class="border-grey-darken-1 text-truncate px-4"
												:to="`/${props.contentType}/chapter/${item.id}`"
											>
												{{ item.title }}
											</v-btn>
										</v-col>
									</v-row>
								</v-card-text>
							</v-sheet>
						</v-card>
					</v-sheet>
				</v-sheet>
				<v-card class="mt-4" width="25%">
					<v-card-title class="d-flex justify-space-between align-center">
						<div>{{ props.recommendedTitle }}</div>
						<v-card-subtitle class="pa-0"
							><v-btn elevation="0" :to="`/${props['contentType']}`"
								>更多 ></v-btn
							></v-card-subtitle
						>
					</v-card-title>

					<div>
						<v-card-item
							v-for="(card, index) in recommendationsData"
							:key="card.id"
							style="height: 150px"
							:class="{ 'my-0': index === 0, 'my-2': index !== 0 }"
						>
							<v-card :to="`/${props.contentType}/${card.id}`" height="100%">
								<v-row>
									<v-col cols="5">
										<v-img
											class="align-end text-white"
											height="132px"
											:src="card.coverUrl"
										>
											<template #error>
												<v-img
													cover
													src="/error-default.jpg"
													height="100%"
													width="100%"
												/>
											</template>
										</v-img>
									</v-col>

									<v-col cols="7" class="d-flex flex-column">
										<v-card-title class="text-body-3 pb-0">{{
											card.title
										}}</v-card-title>
										<div class="d-flex flex-column justify-end flex-grow-1">
											<v-card-subtitle>
												{{ card.author }}
											</v-card-subtitle>
											<v-card-subtitle>
												<template v-if="card.serialType === 'Serializing'"
													>连载中</template
												>
												<template v-else>已完结</template>
											</v-card-subtitle>

											<v-card-subtitle class="pt-0">
												<template v-if="card.lengthType === 'Short'">
													<span>短篇</span>
												</template>

												<template v-if="card.lengthType === 'Medium'">
													<span>中篇</span>
												</template>

												<template v-if="card.lengthType === 'Long'">
													<span>长篇</span>
												</template>

												<template v-if="props.contentType === 'manga'"
													>漫画</template
												>
												<template v-if="props.contentType === 'novel'"
													>小说</template
												>
											</v-card-subtitle>
											<v-card-subtitle class="pt-0 pb-0"
												>更新至:
												<span class="last-update"
													>{{ card?.lastNo || '最新' }}话</span
												></v-card-subtitle
											>
										</div>
									</v-col>
								</v-row>
							</v-card>
						</v-card-item>
					</div>
				</v-card>
			</v-sheet>
		</template>
	</v-container>
</template>

<script setup lang="ts">
import type { WorkDetailRes, WorkListRes } from '~/shared/dto/web/work';
import dayjs from 'dayjs';

const props = defineProps({
	recommendedTitle: {
		type: String,
		required: true,
	},
	btnContent: {
		type: String,
		required: true,
	},
	contentType: {
		type: String,
		required: true,
		//只能是这两个值
		validator: (value: string) => {
			return ['manga', 'novel'].includes(value);
		},
	},
});
const route = useRoute();
const workId = computed(() => Number(route.params.id));
const store = useWebWorkStore();
// 每页分片大小（可自定义）
const SEGMENT_SIZE = 12;
// 当前激活的 chunk 索引（0 为第一个 chunk）
const activeChunkIndex = ref(0);

const { data, pending } = await useApiFetch<WorkDetailRes>(
	`/api/web/work/${workId.value}`,
	{
		method: 'GET',
	},
);
const workDetail = data.value.data;

//排序数组根据no属性
const sortedChapterList = computed(() => {
	// 1. 检查列表是否存在或为空
	if (!workDetail.chapterList || workDetail.chapterList.length === 0) {
		return [];
	}
	// 使用 slice() 创建数组副本，避免修改原始数据
	// 3使用 sort() 根据 no 属性进行升序排序 (a.no - b.no)
	return workDetail.chapterList.slice();
});

// 根据排序后的数组长度生成分片信息：{ startIndex, endIndex, label }
const chapterChips = computed(() => {
	const list = sortedChapterList.value;
	const total = list.length;
	if (total === 0) return [];

	const chips: { startIndex: number; endIndex: number; label: string }[] = [];
	for (let start = 0; start < total; start += SEGMENT_SIZE) {
		const end = Math.min(start + SEGMENT_SIZE - 1, total - 1);
		// label 使用“第几项”显示： 例如 1-12, 13-24, ...（基于索引 + 1）
		const label = start === end ? `${start + 1}` : `${start + 1}-${end + 1}`;
		chips.push({ startIndex: start, endIndex: end, label });
	}
	return chips;
});

// 选择某个 chunk（通过 chunk 索引）
function selectChunkByIndex(index: number) {
	if (index < 0 || index >= chapterChips.value.length) return;
	activeChunkIndex.value = index;
}

// 根据当前 activeChunkIndex 返回要显示的章节（按排序后的顺序 slice）
const filteredChapterList = computed(() => {
	const chips = chapterChips.value;
	if (chips.length === 0) return [];
	const chunk = chips[activeChunkIndex.value] || chips[0];
	return sortedChapterList.value.slice(chunk.startIndex, chunk.endIndex + 1);
});

// 如果 sortedChapterList 改变，重置 activeChunkIndex 为 0（或保持同一 chunk）
watch(
	sortedChapterList,
	() => {
		// 如果当前 chunk 索引超范围则重置
		if (activeChunkIndex.value >= chapterChips.value.length) {
			activeChunkIndex.value = 0;
		}
	},
	{ immediate: true },
);

const { data: recommendationsData } = await useAsyncData<WorkListRes['list']>(
	//key使用 workId
	computed(() => `recommendations-${workId.value}`),
	async () => {
		if (!workId.value || isNaN(workId.value)) return [];
		if (props.contentType === 'manga') {
			await store.getAllManga();
			return store.getMangaRecommendations(workId.value);
		} else {
			await store.getAllNovel();
			return store.getNovelRecommendations(workId.value);
		}
	},
	{
		watch: [workId],
	},
);

useHead({
	title: `${workDetail.title || '漫画详情'}`,
	meta: [
		{
			name: 'description',
			content: '百合漫画详情页面，包含漫画简介、章节列表和推荐漫画。',
		},
		{
			name: 'keywords',
			content:
				'百合, 百合漫画,夢怜龍華, 夢怜龙华, 百合小说, 百合轻小说, 百合漫画推荐, 百合漫画阅读, 百合漫画更新',
		},
	],
});
</script>

<style scoped>
.text-wrap {
	white-space: normal;
}

.last-update {
	/* 定义渐变色背景 */
	background: linear-gradient(to bottom, black, #0072ff);
	/* 将背景裁剪到文本的形状 */
	-webkit-background-clip: text; /* Chrome, Safari */
	background-clip: text;
	/* 将文本颜色设置为透明，以便看到背景 */
	-webkit-text-fill-color: transparent; /* Chrome, Safari */
	color: transparent; /* Firefox, Opera 等其他浏览器 */
}

.line-clamp-6-fixed {
	overflow: hidden;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 5;
	line-clamp: 5;
	max-height: 500px;
}
</style>
