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
		<div class="mobile-list-container">
			<template v-for="card in cards" :key="card.id">
				<div class="yuri-card-horizontal" @click="handleCardClick(card.id)">
					<!-- 封面区：28% 宽度，使用 Book3D -->
					<div class="cover-side">
						<Book3D
							:cover-url="card.coverUrl"
							:title="card.title"
							:author="card.author"
							:height="140"
							:width="100"
							:spine-width="20"
							:show-title="false"
							:show-spine-text="false"
							@click="handleCardClick(card.id)"
						>
							<template #overlay>
								<AnimeTags
									:tags="card.tags"
									size="small"
									position="bottom-left"
								/>
							</template>
						</Book3D>
					</div>

					<!-- 信息区：72% 宽度 -->
					<div class="info-side">
						<h3
							v-copy="card.title"
							v-tooltip="card.title"
							class="yuri-title"
							@click.stop
						>
							{{ card.title }}
						</h3>

						<!-- 信息行：BY 和 LAST/UPDATE，右侧是状态标签 -->
						<div class="mini-info-row">
							<div class="mini-info-left">
								<div class="mini-label-group color-pink">
									<span class="mini-tag-text">BY</span>
									<span
										v-copy="card.author"
										v-tooltip="'点击搜索作者/右键复制'"
										class="mini-content-text"
										@click.stop="handleAuthorClick(card.author)"
									>
										{{ card.author }}
									</span>
									<div class="mini-underline"></div>
								</div>
								<div
									class="mini-label-group"
									:class="card.chapterUpdatedAt ? 'color-cyan' : 'color-purple'"
								>
									<span class="mini-tag-text">{{
										card.chapterUpdatedAt ? 'UPDATE' : 'LAST'
									}}</span>
									<span
										v-copy="
											card.chapterUpdatedAt
												? dayjs(card.chapterUpdatedAt).format('YYYY-MM-DD')
												: '暂无'
										"
										v-tooltip="
											card.chapterUpdatedAt
												? dayjs(card.chapterUpdatedAt).format('YYYY-MM-DD')
												: '暂无'
										"
										class="mini-content-text"
										@click.stop
									>
										{{
											card.chapterUpdatedAt
												? dayjs(card.chapterUpdatedAt).format('YYYY-MM-DD')
												: '暂无'
										}}
									</span>
									<div class="mini-underline"></div>
								</div>
							</div>
							<!-- 状态标签：放在右侧 -->
							<div class="status-tags">
								<span
									class="status-mini-tag"
									:class="
										card.serialType === 'Serializing' ? 'tag-red' : 'tag-green'
									"
								>
									{{ card.serialType === 'Serializing' ? '连载中' : '已完结' }}
								</span>
								<span
									class="status-mini-tag"
									:class="card.lengthType === 'Short' ? 'tag-cyan' : 'tag-grey'"
								>
									{{
										(card.lengthType === 'Long'
											? '长篇'
											: card.lengthType === 'Medium'
												? '中篇'
												: '短篇') +
										(props.workType === 'Manga' ? '漫画' : '小说')
									}}
								</span>
							</div>
						</div>

						<!-- 简介 -->
						<div
							v-if="card.description"
							v-copy="card.description"
							v-tooltip="card.description"
							class="yuri-description"
							@click.stop
						>
							{{ card.description }}
						</div>

						<!-- 百合指数 -->
						<div class="concentration-box">
							<div class="concentration-header">
								<span class="concentration-label">百合指数</span>
								<span class="concentration-value">{{
									card?.lastNo || '1000'
								}}</span>
							</div>
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
				</div>
			</template>
		</div>

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
import dayjs from 'dayjs';

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

const handleAuthorClick = (author: string) => {
	const typeKey = props.workType.toLowerCase();
	webWorkStore[`${typeKey}InputKey`] = author;
	webWorkStore[`trigger${props.workType}Search`]();
};

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
const handleCardClick = (cardId: number) => {
	// 直接传递作品ID，跳转到详情页
	props.onCardClick(cardId);
};

// 寻找最小id的章节————第一章
function getMinNoChapterId(chapterList): number | undefined {
	if (!chapterList || chapterList.length === 0) {
		return undefined;
	}

	const minNoChapter = chapterList.reduce((minChapter, currentChapter) => {
		if (currentChapter.no < minChapter.no) {
			return currentChapter;
		}
		return minChapter;
	}, chapterList[0]);

	return minNoChapter.id;
}
</script>

<style scoped>
.mobile-list-container {
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0;
}

/* 卡片容器：无边框，只有底部分割线 */
.yuri-card-horizontal {
	background: white;
	border-radius: 0;
	overflow: hidden;
	box-shadow: none;
	border: none;
	border-bottom: 1px solid #f2ece6;
	display: flex;
	transition: all 0.2s;
	position: relative;
	cursor: pointer;
}

.yuri-card-horizontal:active {
	transform: scale(0.98);
	background-color: #fffafa;
}

/* 封面区：缩小占比至 28%，不要留空隙 */
.cover-side {
	width: 28%;
	flex-shrink: 0;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	aspect-ratio: 3/4.4; /* 保持垂直比例 */
}

/* Book3D 组件样式覆盖 - 确保不超出边界 */
.cover-side :deep(.book-3d-container) {
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
	overflow: hidden;
}

.cover-side :deep(.book-3d-wrapper) {
	width: 100%;
	height: 100%;
	overflow: hidden;
}

/* 信息区：因为图片缩小，文字区获得了更多呼吸空间 */
.info-side {
	padding: 12px 10px;
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	min-width: 0;
}

.yuri-title {
	font-size: 15px;
	font-weight: 900;
	color: #5a463d;
	line-height: 1.2;
	margin-bottom: 6px;
	display: -webkit-box;
	-webkit-line-clamp: 1;
	line-clamp: 1;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

/* 风格化标签下划线 */
.mini-info-row {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: flex-start;
	gap: 8px;
	margin-bottom: 6px;
}

.mini-info-left {
	display: flex;
	flex-direction: column;
	gap: 3px;
	flex: 1;
	min-width: 0;
}

.mini-label-group {
	display: flex;
	align-items: baseline;
	gap: 4px;
	position: relative;
}

.mini-tag-text {
	font-size: 8px;
	font-weight: 900;
	text-transform: uppercase;
}

.mini-content-text {
	font-size: 10px;
	font-weight: 700;
	color: #7d5a5a;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	cursor: pointer;
	transition: color 0.2s ease;
}

.mini-content-text:hover {
	color: #ff758c;
}

.mini-underline {
	position: absolute;
	bottom: -1px;
	left: 0;
	width: 85%;
	height: 2px;
	border-radius: 999px;
}

.color-pink .mini-tag-text {
	color: #ff9a9e;
}
.color-pink .mini-underline {
	background: linear-gradient(to right, #ff9a9e, transparent);
}

.color-purple .mini-tag-text {
	color: #a78bfa;
}
.color-purple .mini-underline {
	background: linear-gradient(to right, #a78bfa, transparent);
}

.color-cyan .mini-tag-text {
	color: #4dd0e1;
}
.color-cyan .mini-underline {
	background: linear-gradient(to right, #4dd0e1, transparent);
}

/* 简介文本 */
.yuri-description {
	font-size: 11px;
	color: #9a8471;
	line-height: 1.3;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	margin-bottom: 8px;
	background: #fdfaf8;
	padding: 3px 6px;
	border-radius: 6px;
	/* 精确计算高度：字体大小 * 行高 * 行数 + padding，减少一点确保完全隐藏下一行 */
	max-height: calc(11px * 1.3 * 2 + 2px);
	position: relative;
	word-break: break-word;
	text-overflow: ellipsis;
	/* 确保完全隐藏溢出内容 */
	overflow: hidden !important;
}

/* 状态标签 */
.status-tags {
	display: flex;
	flex-direction: column;
	gap: 4px;
	flex-shrink: 0;
	margin-bottom: 0;
}

.status-mini-tag {
	font-size: 9px;
	font-weight: 800;
	padding: 1px 6px;
	border-radius: 4px;
	border: 1px solid;
	text-align: center;
	white-space: nowrap;
}

.tag-red {
	background: #fff0f3;
	color: #ff758c;
	border-color: #ffcad4;
}

.tag-green {
	background: #f0fff4;
	color: #2ed573;
	border-color: #b7ebc6;
}

.tag-grey {
	background: #fcf8f2;
	color: #c9c1ab;
	border-color: #e8dfd5;
}

.tag-cyan {
	background: #e0f7fa;
	color: #4dd0e1;
	border-color: #b2ebf2;
}

/* 百合指数 */
.concentration-box {
	margin-top: auto;
	background-color: #fefcf9;
	padding: 5px 8px;
	border-radius: 10px;
	border: 1px solid #f2ece6;
}

.concentration-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 3px;
}

.concentration-label {
	font-size: 8px;
	font-weight: 900;
	color: #9a8471;
}

.concentration-value {
	font-size: 9px;
	font-weight: 900;
	color: #ff758c;
}

.yuri-progress-bar {
	height: 5px;
	width: 100%;
	background: #f2ece6;
	border-radius: 999px;
}

.yuri-progress-fill {
	height: 100%;
	background: linear-gradient(to right, #ff9a9e, #ff758c, #fecfef);
	border-radius: 999px;
	transition: width 0.7s ease;
}
</style>
