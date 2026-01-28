<template>
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
		<!-- 3 列网格容器 -->
		<div class="yuri-grid-container">
			<template v-for="card in cards" :key="card.id">
				<div class="yuri-grid-card" @click="handleCardClick(card.id)">
					<!-- 封面容器：使用 Book3D -->
					<div class="cover-wrapper">
						<Book3D
							:cover-url="card.coverUrl"
							:title="card.title"
							:author="card.author"
							:height="180"
							:width="130"
							:spine-width="25"
							:show-title="false"
							:show-spine-text="false"
							@click="handleCardClick(card.id)"
						>
							<template #overlay>
								<!-- 左下角分类标签 -->
								<AnimeTags
									:tags="card.tags"
									size="small"
									position="bottom-left"
								/>
							</template>
						</Book3D>
						<!-- 状态角标 (连载/完结) -->
						<div
							class="status-chip"
							:class="
								card.serialType === 'Serializing'
									? 'status-serializing'
									: 'status-completed'
							"
						>
							{{ card.serialType === 'Serializing' ? '连载中' : '已完结' }}
						</div>
					</div>

					<!-- 信息展示区 -->
					<div class="card-info">
						<!-- 标题：强制 2 行 -->
						<h3
							v-copy="card.title"
							v-tooltip="card.title"
							class="yuri-title"
							@click.stop
						>
							{{ card.title }}
						</h3>

						<!-- 作者展示：保留 BY 和渐变下划线 -->
						<div class="yuri-author-row">
							<div class="author-box">
								<span class="by-text">BY</span>
								<span
									v-copy="card.author"
									v-tooltip="'点击搜索作者/右键复制'"
									class="author-name"
									@click.stop="handleAuthorClick(card.author)"
								>
									{{ card.author }}
								</span>
								<div class="mini-underline"></div>
							</div>
							<!-- 更多按钮：极简圆点 -->
							<div class="more-dots" @click.stop>
								<svg
									width="12"
									height="12"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M12 16a2 2 0 110 4 2 2 0 010-4zm0-6a2 2 0 110 4 2 2 0 010-4zm0-6a2 2 0 110 4 2 2 0 010-4z"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>
			</template>
		</div>

		<!-- 分页器 -->
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
const handleCardClick = (cardId: number) => {
	// 直接传递作品ID，跳转到详情页
	props.onCardClick(cardId);
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

const handleAuthorClick = (author: string) => {
	const typeKey = props.workType.toLowerCase();
	webWorkStore[`${typeKey}InputKey`] = author;
	webWorkStore[`trigger${props.workType}Search`]();
};
</script>

<style scoped>
/* 3 列网格容器 */
.yuri-grid-container {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 12px;
	padding: 12px;
	width: 100%;
	box-sizing: border-box;
}

/* 极简网格卡片 */
.yuri-grid-card {
	display: flex;
	flex-direction: column;
	background: transparent;
	transition: transform 0.2s;
	cursor: pointer;
	min-width: 0;
	width: 100%;
	overflow: hidden;
}

.yuri-grid-card:active {
	transform: scale(0.96);
}

/* 封面容器：圆润且有立体感 */
.cover-wrapper {
	position: relative;
	width: 100%;
	height: 180px; /* 固定高度匹配 Book3D */
	border-radius: 12px;
	overflow: hidden; /* 裁剪超出部分 */
	box-shadow: 0 6px 12px rgba(125, 90, 90, 0.15);
	margin-bottom: 8px;
	border: 1px solid #f2ece6;
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f5f5f5; /* 添加背景色，避免黑块 */
}

/* Book3D 组件样式覆盖 - 保持 3D 效果 */
.cover-wrapper :deep(.book-3d-container) {
	width: 100% !important;
	height: 180px !important;
	margin: 0 !important;
	padding: 0 !important;
	overflow: visible !important; /* 允许 3D 效果 */
	box-sizing: border-box;
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
	background: transparent !important;
}

.cover-wrapper :deep(.book-3d-wrapper) {
	height: 180px !important;
	overflow: visible !important; /* 允许 3D 效果 */
	box-sizing: border-box;
}

.cover-wrapper :deep(.book-body) {
	overflow: visible !important; /* 允许 3D 效果 */
}

.cover-wrapper :deep(.book-cover-link) {
	background: transparent !important;
}

/* 状态角标 (连载/完结) */
.status-chip {
	position: absolute;
	top: 4px;
	right: 4px;
	font-size: 8px;
	font-weight: 900;
	color: white;
	padding: 1px 6px;
	border-radius: 4px;
	z-index: 10;
}

.status-serializing {
	background-color: #ff6b20;
}

.status-completed {
	background-color: #4caf50;
}

/* 信息展示区 */
.card-info {
	padding: 0 2px;
	width: 100%;
	min-width: 0;
	overflow: hidden;
}

/* 标题：强制 2 行，圆润字体感 */
.yuri-title {
	font-size: 13px;
	font-weight: 900;
	color: #5a463d;
	line-height: 1.3;
	height: 2.6em; /* 刚好两行 */
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	margin-bottom: 4px;
}

/* 作者展示：保留 BY 和渐变下划线 */
.yuri-author-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	position: relative;
	padding-bottom: 2px;
}

.author-box {
	display: flex;
	align-items: baseline;
	gap: 2px;
	max-width: 80%;
	position: relative;
}

.by-text {
	font-size: 7px;
	font-weight: 900;
	color: #ff9a9e;
	text-transform: uppercase;
}

.author-name {
	font-size: 10px;
	font-weight: 700;
	color: #9a8471;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	cursor: pointer;
	transition: color 0.2s ease;
}

.author-name:hover {
	color: #ff758c;
}

/* 迷你渐变下划线 */
.mini-underline {
	position: absolute;
	bottom: -1px;
	left: 0;
	width: 100%;
	height: 1.5px;
	background: linear-gradient(to right, #ff9a9e, transparent);
	border-radius: 999px;
}

/* 更多按钮：极简圆点 */
.more-dots {
	color: #c9c1ab;
	display: flex;
	align-items: center;
	cursor: pointer;
}
</style>
