<template>
	<template v-if="currentWork.totalItems === 0">
		<v-alert
			type="info"
			icon="mdi-magnify-remove-outline"
			variant="tonal"
			class="mt-10 pa-6"
		>
			<h3 class="text-h6 mb-2">抱歉，没有找到相关作品</h3>
			<p>
				请尝试更换关键词 **「{{ currentWork.searchKey }}」**
				或清除搜索内容后再次查找。
			</p>
		</v-alert>
	</template>

	<template v-else>
		<!-- 传入最小章节id -->
		<v-card
			v-for="(card, index) in cards"
			:key="card.id"
			:elevation="0"
			class="mb-2 pa-0"
			:class="['mt-2', { 'mt-2': index === 0 }]"
			ripple
			hover
			link
			@click.prevent="handleCardClick(card.id)"
		>
			<v-row no-gutters>
				<v-col cols="3">
					<v-lazy
						v-model="isVisible"
						:options="{ threshold: 0.5 }"
						min-height="100"
						transition="fade-transition"
						height="100%"
						><v-img
							cover
							:src="card.coverUrl"
							height="100%"
							width="100%"
							:alt="card.title ? `卡片封面：${card.title}` : '卡片封面'"
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
							</template> </v-img
					></v-lazy>
				</v-col>

				<v-col cols="8" class="pa-2">
					<v-card-title class="pa-0 text-4">
						{{ card.title }}
					</v-card-title>

					<div class="card-details mt-1">
						<v-row no-gutters align="center" class="mb-1">
							<v-col cols="auto" class="mr-1">
								<v-icon
									icon="mdi-account"
									size="small"
									color="#C9C1AB"
								></v-icon>
							</v-col>
							<v-col>
								<span class="text-body-2 card-detail-text">{{
									card.author
								}}</span>
							</v-col>
						</v-row>

						<v-row no-gutters align="center" class="mb-1">
							<v-col cols="auto" class="mr-1">
								<v-icon
									icon="mdi-chart-bar"
									size="small"
									color="#C9C1AB"
								></v-icon>
							</v-col>
							<v-col>
								<span class="text-body-2 card-detail-text">
									<span v-if="card.lengthType === 'Short'">短篇</span>
									<span v-if="card.lengthType === 'Medium'">中篇</span>
									<span v-if="card.lengthType === 'Long'">长篇</span>
									<template v-if="props.workType === 'Manga'">漫画</template>
									<template v-else>小说</template></span
								>
							</v-col>
						</v-row>

						<v-row no-gutters align="center">
							<v-col cols="auto" class="mr-1">
								<v-icon
									:icon="
										card.serialType === 'Serializing'
											? 'mdi-update'
											: 'mdi-check-circle'
									"
									size="small"
									color="#C9C1AB"
								></v-icon>
							</v-col>
							<v-col>
								<span class="text-body-2 card-detail-text">
									<span v-if="card.serialType === 'Serializing'">连载中</span>
									<span v-else>已完结</span>
								</span>
							</v-col>
						</v-row>
					</div>
				</v-col>
			</v-row>
			<v-divider></v-divider>
		</v-card>
		<div class="mt-4">
			<v-pagination
				v-model="page"
				:length="currentWork.pageCount"
			></v-pagination>
		</div>
	</template>
</template>

<script setup lang="ts">
import type { WorkListRes, WorkDetailRes } from '~/shared/dto/web/work';
// 定义回调函数的类型：接受一个 number 类型的 ID，没有返回值 (void)
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
export type WorkItemType = WorkListRes['list'][number];
const { $tip } = useNuxtApp();
const webWorkStore = useWebWorkStore();

// 根据 workType 动态获取 Store 中的数据和状态
const currentWork = computed(() => {
	const typeKey = props.workType.toLowerCase();
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
		// 动态绑定 fetch 方法 (假设 Store 中有一个通用的 fetchWorkList 方法)
		fetchList: webWorkStore.fetchWorkList as (state) => Promise<void>,
	};
});

const cards = computed<WorkItemType[]>(() => currentWork.value.list);

//  动态双向绑定当前页码
const page = computed({
	get: () => currentWork.value.state.page,
	set: (value) => {
		currentWork.value.state.page = value;
	},
});
const isVisible = ref(false);

const { error } = await useAsyncData(
	'work-list-data-' + props.workType,
	async () => {
		// 使用动态获取的 state 对象进行查询
		await webWorkStore.fetchWorkList(currentWork.value.state);
		return currentWork.value.list;
	},
	{
		// 监听 page 变化和 workType 变化来重新加载数据
		watch: [() => page.value, () => props.workType],
	},
);

if (error.value) {
	console.error(`[${props.workType} 列表] 数据加载失败:`, error.value);
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
			const minNoChapterId = chapterList[0].id;

			if (minNoChapterId !== undefined) {
				// 3. 触发跳转回调
				props.onCardClick(minNoChapterId);
			} else {
				$tip(`作品 ID ${cardId} 没有找到章节内容。`, {
					color: 'error',
					icon: 'mdi-alert-circle',
				});
			}
		} else {
			$tip(`作品 ID ${cardId} 章节列表为空。`, {
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

</script>

<style scoped>
.text-6 {
	font-size: 1rem;
	line-height: 1.2;
}
.card-detail-text {
	color: rgba(77, 77, 77, 1);
}
</style>
