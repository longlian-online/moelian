<template>
	<v-container>
		<template v-if="currentWork.totalItems === 0">
			<v-alert
				type="info"
				icon="mdi-magnify-remove-outline"
				variant="tonal"
				class="mt-10 pa-6"
			>
				<h3 class="text-h6 mb-2">抱歉，没有找到相关作品 🥺</h3>
				<p>
					请尝试更换关键词 **「{{ currentWork.searchKey }}」**
					或清除搜索内容后再次查找。
				</p>
			</v-alert>
		</template>

		<template v-else>
			<v-sheet width="100%" class="d-flex flex-wrap ga-4">
				<!-- 传入最小的章节id -->
				<div
					v-for="card in cards"
					:key="card.id"
					class="card-container"
					style="width: 30%"
					@click="handleCardClick(card.id)"
				>
					<div class="img-container">
						<v-img
							:src="card.coverUrl"
							style="width: 100%; margin-bottom: 8px"
							rounded="lg"
							cover
							aspect-ratio="0.75"
						>
							<template #placeholder>
								<v-skeleton-loader type="image" class="fill-height" />
							</template>
							<template #error>
								<v-img
									cover
									src="/error-default.jpg"
									height="100%"
									width="100%"
								/>
							</template>
						</v-img>
						<v-chip
							v-if="card.serialType !== undefined"
							color="white"
							size="small"
							class="px-1"
							style="position: absolute; top: 4px; right: 8px; z-index: 10"
							:style="{
								backgroundColor:
									card.serialType === 'Serializing' ? '#FF6B20' : '#4CAF50',
							}"
						>
							<template v-if="card.serialType === 'Serializing'"
								>连载中</template
							>
							<template v-if="card.serialType === 'Completed'">已完结</template>
						</v-chip>
					</div>
					<div>
						<div class="clamp-text" style="width: 100%">
							{{ card.title }}
						</div>
					</div>
					<div
						class="d-flex justify-space-between align-center"
						style="width: 100%"
					>
						<div style="color: gray; font-size: 12px">
							{{ card.author }}
						</div>
						<v-btn
							icon="mdi-dots-vertical"
							variant="text"
							size="x-small"
							class="pa-0"
						></v-btn>
					</div>
				</div>
			</v-sheet>
			<div class="mt-4">
				<v-pagination
					v-model="page"
					:length="currentWork.pageCount"
				></v-pagination>
			</div>
		</template>
	</v-container>
</template>

<script setup lang="ts">
import type { WorkListRes, WorkDetailRes } from '~/shared/dto/web/work';
type WorkType = 'Manga' | 'Novel';
type CardClickCallback = (id: number) => void;
const props = defineProps({
	workType: {
		type: String as PropType<WorkType>,
		required: true,
	},
	onCardClick: {
		type: Function as PropType<CardClickCallback>,
		required: true,
	},
});
const { $tip } = useNuxtApp();
export type WorkItemType = WorkListRes['list'][number];
const webWorkStore = useWebWorkStore();

// 动态获取 Store 中的数据和状态
const currentWork = computed(() => {
	// 根据 workType (Manga/Novel) 动态构造属性名
	const typeKey = props.workType.toLowerCase();

	// 假设您的 Store 遵循约定：mangaList, novelList, mangaState, novelState, etc.
	return {
		// 动态绑定列表数据
		list: webWorkStore[`${typeKey}List`] as WorkItemType[],
		// 动态绑定总条目数
		totalItems: webWorkStore[`${typeKey}TotalItems`] as number,
		// 动态绑定分页对象 (包含 page, limit, searchKey 等)
		state: webWorkStore[`${typeKey}State`],
		// 动态绑定总页数
		pageCount: webWorkStore[`${typeKey}PageCount`] as number,
		// 动态绑定搜索关键词 (用于无结果提示)
		searchKey: webWorkStore[`${typeKey}State`]?.searchKey || '',
	};
});

// 将 Store 中的 list 映射到模板使用的 cards 结构
const cards = computed<WorkItemType[]>(() => currentWork.value.list);

// 动态双向绑定当前页码
const page = computed({
	get: () => currentWork.value.state.page,
	set: (value) => {
		currentWork.value.state.page = value;
	},
});

const { error } = await useAsyncData(
	// 确保 key 的唯一性
	'work-grid-data-' + props.workType,
	async () => {
		// 使用动态获取的 state 对象进行查询
		await webWorkStore.fetchWorkList(currentWork.value.state);
		return currentWork.value.list;
	},
	{
		// 监听 page 变化来重新加载数据
		watch: [() => page.value],
	},
);

if (error.value) {
	// 报错信息也使用动态 workType
	$tip(`获取${props.workType}列表失败:` + error.value.message, {
		color: 'error',
		icon: 'mdi-alert-circle',
	});
}

interface ApiResponse<T> {
	code: number;
	message: string;
	data: T; // 泛型 T 实际的业务数据
}
const handleCardClick = async (cardId: number) => {
	try {
		// 1. 使用 $fetch 或 $apiFetch 获取作品详情
		const response = await $fetch<ApiResponse<WorkDetailRes>>(
			`/api/web/work/${cardId}` as string,
			{ method: 'GET' },
		);
		const chapterList = response.data.chapterList;

		if (chapterList && chapterList.length > 0) {
			// 2. 获取最小章节号对应的章节ID (即第一章的ID)
			const minNoChapterId = getMinNoChapterId(chapterList);

			if (minNoChapterId !== undefined) {
				// 3. 触发跳转回调
				props.onCardClick(minNoChapterId);
			} else {
				$tip(`${props.workType} ID ${cardId} 没有找到章节内容。`, {
					color: 'error',
					icon: 'mdi-alert-circle',
				});
			}
		} else {
			$tip(`${props.workType} ID ${cardId} 章节列表为空。`, {
				color: 'error',
				icon: 'mdi-alert-circle',
			});
		}
	} catch (error) {
		console.error('获取章节详情失败:', error);
		$tip('获取章节详情失败:' + error, {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
	}
};

//寻找最小id的章节————第一章
function getMinNoChapterId(chapterList): number | undefined {
	if (!chapterList || chapterList.length === 0) {
		return undefined;
	}

	// 使用 reduce 找到具有最小 'no' 属性的完整章节对象
	const minNoChapter = chapterList.reduce((minChapter, currentChapter) => {
		// 比较：如果当前章节的 'no' 小于已记录的最小章节的 'no'，则更新最小章节
		if (currentChapter.no < minChapter.no) {
			return currentChapter;
		}
		return minChapter;
	}, chapterList[0]); // 初始值设置为数组的第一个元素

	// 返回这个最小章节的 id
	return minNoChapter.id;
}
</script>

<style scoped>
.v-btn :deep(.v-icon) {
	color: gray;
}

.img-container {
	width: 100%;
	position: relative;
	box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
}
.clamp-text {
	font-size: 18px;
	line-height: 1.5em; /* 确保一行的高度 */
	height: 3em; /* 2行 * 1.5em 行高 = 3em 高度 */
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2; /* 依然保留多行截断效果 */
	line-clamp: 2;
}
</style>
