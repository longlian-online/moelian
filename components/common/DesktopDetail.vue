<template>
	<div class="detail-main-container">
		<template v-if="pending">
			<v-skeleton-loader type="image" />
		</template>
		<template v-else>
			<!-- 左侧 75% 详情区 -->
			<main class="detail-left-panel">
				<!-- 作品主卡片 - 强制 flex-row 确保图片和内容左右排列 -->
				<section class="yuri-card detail-main-card">
					<!-- 封面图 (左侧) -->
					<div class="detail-cover-wrapper">
						<div class="detail-cover-inner">
							<Book3D
								:cover-url="workDetail?.coverUrl || ''"
								:title="workDetail?.title || ''"
								:author="workDetail?.author || ''"
								:height="400"
								:width="280"
								:spine-width="50"
								:show-title="false"
								:show-spine-text="true"
								@click="handleCoverClick"
							>
								<template #overlay>
									<AnimeTags
										:tags="workDetail?.tags || []"
										position="bottom-left"
									/>
								</template>
							</Book3D>
						</div>
					</div>

					<!-- 信息内容区 (右侧) -->
					<div class="detail-info-wrapper">
						<div class="detail-info-content">
							<div class="detail-title-row">
								<h1
									v-copy="workDetail.title"
									v-tooltip="workDetail.title"
									class="yuri-title"
								>
									{{ workDetail.title }}
								</h1>
								<v-btn
									icon="mdi-share"
									variant="text"
									size="middle"
									class="share-btn"
									@click="showShareDialog = true"
								></v-btn>
							</div>

							<!-- 第一行：作者 (左) 与 标签 (右) -->
							<div class="detail-info-row">
								<div class="color-pink detail-info-item">
									<span class="info-label">BY</span>
									<span
										v-copy="workDetail.author"
										v-tooltip="'右键复制作者'"
										class="info-content"
									>
										{{ workDetail.author }}
									</span>
									<div class="info-underline"></div>
								</div>
								<div class="detail-tags-group">
									<span class="yuri-tag length-tag">
										{{
											workDetail.lengthType === 'Long'
												? '长篇'
												: workDetail.lengthType === 'Medium'
													? '中篇'
													: '短篇'
										}}
										{{ props.contentType === 'manga' ? '漫画' : '小说' }}
									</span>
									<span
										class="yuri-tag"
										:class="
											workDetail.serialType === 'Serializing'
												? 'serializing-tag'
												: 'finished-tag'
										"
									>
										{{
											workDetail.serialType === 'Serializing'
												? '连载中'
												: '已完结'
										}}
									</span>
								</div>
							</div>

							<!-- 第二行：LAST 独立成行 -->
							<div class="color-purple detail-info-item detail-info-item-full">
								<span class="info-label">LAST</span>
								<span
									v-copy="workDetail.lastChapterName || '暂无'"
									v-tooltip="workDetail.lastChapterName || '暂无'"
									class="info-content"
								>
									{{ workDetail.lastChapterName || '暂无' }}
								</span>
								<div class="info-underline"></div>
							</div>

							<!-- 第三行：UPDATE 独立成行 -->
							<div class="color-cyan detail-info-item detail-info-item-full">
								<span class="info-label">UPDATE</span>
								<span
									v-copy="
										workDetail.chapterUpdatedAt
											? dayjs(workDetail.chapterUpdatedAt).format(
													'YYYY-MM-DD HH:mm:ss',
												)
											: '暂无更新'
									"
									v-tooltip="
										workDetail.chapterUpdatedAt
											? dayjs(workDetail.chapterUpdatedAt).format(
													'YYYY-MM-DD HH:mm:ss',
												)
											: '暂无更新'
									"
									class="info-content"
								>
									{{
										workDetail.chapterUpdatedAt
											? dayjs(workDetail.chapterUpdatedAt).format(
													'YYYY-MM-DD HH:mm:ss',
												)
											: '暂无更新'
									}}
								</span>
								<div class="info-underline"></div>
							</div>

							<!-- 简介 - 限制4行 -->
							<div class="detail-description">
								<p class="line-clamp-4">
									<strong class="description-label">简介：</strong>
									<span
										v-tooltip="workDetail.description"
										v-copy="workDetail.description"
									>
										{{ workDetail.description }}
									</span>
								</p>
							</div>

							<!-- 百合指数区 -->
							<div class="yuri-concentration-box">
								<div class="yuri-concentration-header">
									<div class="yuri-concentration-label">
										<svg
											class="yuri-heart-icon"
											fill="currentColor"
											viewBox="0 0 20 20"
											width="16"
											height="16"
										>
											<path
												d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
											/>
										</svg>
										<span class="yuri-concentration-text">百合指数</span>
									</div>
									<span class="yuri-concentration-value">{{
										workDetail?.lastNo || '999+'
									}}</span>
								</div>
								<div class="yuri-progress-bar">
									<div
										class="yuri-progress-fill"
										:style="{
											width:
												typeof workDetail?.lastNo === 'number'
													? `${Math.min(100, Math.max(0, workDetail.lastNo))}%`
													: workDetail?.lastNo || '100%',
										}"
									></div>
								</div>
							</div>
						</div>

						<div class="detail-action-button">
							<v-btn
								class="start-read-btn"
								:to="`/${props.contentType}/chapter/${sortedChapterList[0]?.id}`"
							>
								开始阅读
							</v-btn>
						</div>
					</div>
				</section>

				<!-- 章节列表 - 自动填充余下空间 -->
				<section class="yuri-card detail-chapter-section">
					<div class="detail-chapter-header">
						<h2 class="detail-chapter-title">章节列表</h2>
						<span class="detail-chapter-count">
							CHAPTERS
							{{
								sortedChapterList.length > 0
									? `01-${String(sortedChapterList.length).padStart(2, '0')}`
									: '00-00'
							}}
						</span>
					</div>
					<div class="detail-chapter-content">
						<div class="detail-chapter-chips">
							<button
								v-for="(chip, idx) in chapterChips"
								:key="chip.label"
								v-copy="chip.label"
								v-tooltip="chip.label"
								class="detail-chapter-chip"
								:class="{
									'detail-chapter-chip-active': idx === activeChunkIndex,
									'detail-chapter-chip-overflow': isChipOverflow(chip.label),
								}"
								@click="selectChunkByIndex(idx)"
							>
								{{ chip.label }}
							</button>
						</div>
						<div class="detail-chapter-grid">
							<v-btn
								v-for="item in filteredChapterList"
								:key="item.id"
								v-copy="item.title"
								v-tooltip="item.title"
								class="chapter-btn"
								:class="{
									'chapter-btn-active': item.id === sortedChapterList[0]?.id,
								}"
								:to="`/${props.contentType}/chapter/${item.id}`"
							>
								{{ item.title }}
							</v-btn>
						</div>
					</div>
				</section>
			</main>

			<!-- 右侧 25% 推荐区 -->
			<aside class="detail-right-panel">
				<div class="yuri-card detail-recommend-card">
					<div class="detail-recommend-header">
						<h2 class="detail-recommend-title">{{ props.recommendedTitle }}</h2>
						<v-btn
							class="detail-recommend-more"
							:to="`/${props.contentType}`"
							variant="text"
						>
							MORE +
						</v-btn>
					</div>

					<!-- 推荐列表垂直均匀分布 -->
					<div class="recommendation-list">
						<div
							v-for="card in recommendationsData"
							:key="card.id"
							class="recommendation-item"
							@click="router.push(`/${props.contentType}/${card.id}`)"
						>
							<div class="recommendation-content">
								<div class="recommendation-cover">
									<Book3D
										:cover-url="card.coverUrl"
										:title="card.title"
										:author="card.author"
										:height="112"
										:width="80"
										:spine-width="15"
										:show-title="false"
										:show-spine-text="false"
										@click.stop="
											router.push(`/${props.contentType}/${card.id}`)
										"
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
								<div class="recommendation-info">
									<h3
										v-copy="card.title"
										v-tooltip="card.title"
										class="recommendation-title"
										@click.stop="
											router.push(`/${props.contentType}/${card.id}`)
										"
									>
										{{ card.title }}
									</h3>
									<div class="color-pink recommendation-author">
										<span class="recommendation-by">BY</span>
										<span class="recommendation-author-name">{{
											card.author
										}}</span>
										<div class="info-underline recommendation-underline"></div>
									</div>
								</div>
							</div>
							<div class="recommendation-progress">
								<div class="recommendation-progress-header">
									<span class="recommendation-progress-label">百合指数</span>
									<span class="recommendation-progress-value">{{
										card?.lastNo || '1000'
									}}</span>
								</div>
								<div class="yuri-progress-bar recommendation-progress-bar">
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
				</div>
			</aside>
		</template>
	</div>

	<v-dialog v-model="showShareDialog" max-width="400">
		<div class="share-dialog-content">
			<h3 class="share-dialog-title">{{ workDetail?.title }}</h3>
			<div class="share-link-row">
				<input
					:value="shareUrl"
					readonly
					class="share-link-input"
				/>
				<v-btn
					:color="copied ? 'success' : 'primary'"
					class="share-copy-btn"
					@click="handleCopyLink"
				>
					{{ copied ? '已复制✓' : '复制链接' }}
				</v-btn>
			</div>
		</div>
	</v-dialog>
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
		validator: (value: string) => {
			return ['manga', 'novel'].includes(value);
		},
	},
});

const router = useRouter();
const route = useRoute();
const workId = computed(() => Number(route.params.id));
const store = useWebWorkStore();

const showShareDialog = ref(false);
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const shareUrl = computed(() => {
	if (typeof window === 'undefined') return '';
	return `${window.location.origin}/novel/${workId.value}`;
});

async function handleCopyLink() {
	try {
		await navigator.clipboard.writeText(shareUrl.value);
		copied.value = true;
		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => {
			copied.value = false;
		}, 2000);
	} catch {
		$tip('复制失败', { color: 'error', icon: 'mdi-alert-circle' });
	}
}

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
	if (!workDetail.chapterList || workDetail.chapterList.length === 0) {
		return [];
	}
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

// 判断 chip 内容是否超出（用于动态对齐）
// chip 最小宽度 80px，最大宽度 120px，padding 左右各 32px，所以内容区域约 56px
// 14px 字体，中文字符约 14px 宽，数字约 8px 宽
// 估算：如果标签长度超过 4 个字符（如 "1-12" 是 4 个字符），可能溢出
const isChipOverflow = (label: string) => {
	// 计算实际字符宽度（中文字符算 2，数字和符号算 1）
	const charWidth = label.split('').reduce((sum, char) => {
		return sum + (/[\u4e00-\u9fa5]/.test(char) ? 2 : 1);
	}, 0);
	// 如果字符宽度超过 5（约等于 4 个中文字符或 5 个数字），可能溢出
	return charWidth > 5;
};

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
		if (activeChunkIndex.value >= chapterChips.value.length) {
			activeChunkIndex.value = 0;
		}
	},
	{ immediate: true },
);

const { data: recommendationsData } = await useAsyncData<WorkListRes['list']>(
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

function handleCoverClick() {
	const firstChapterId = sortedChapterList.value[0]?.id;
	if (firstChapterId) {
		router.push(`/${props.contentType}/chapter/${firstChapterId}`);
	}
}

useHead({
	title: `${workDetail.title || '作品详情'}`,
	meta: [
		{
			name: 'description',
			content: '百合作品详情页面，包含作品简介、章节列表和推荐作品。',
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
/* 强制 75/25 比例布局 */
.detail-main-container {
	display: flex;
	width: 100%;
	max-width: 1240px;
	margin: 0 auto;
	min-height: 100vh;
	align-items: stretch;
	padding: 24px 16px;
	box-sizing: border-box;
}

.detail-left-panel {
	width: 75%;
	flex-shrink: 0;
	padding-right: 12px;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.detail-right-panel {
	width: 25%;
	flex-shrink: 0;
	padding-left: 12px;
	display: flex;
}

/* 百合风核心卡片基础样式 */
.yuri-card {
	background: white !important;
	box-shadow: 0 20px 40px -10px rgba(125, 90, 90, 0.1) !important;
	border-radius: 20px;
	overflow: hidden;
	border: 1px solid #f2ece6;
}

.yuri-title {
	font-size: 32px;
	font-weight: 900;
	color: #5a463d;
	letter-spacing: -0.01em;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 100%;
	display: block;
	margin: 0;
}

.detail-title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 24px;
}

.share-btn {
	flex-shrink: 0;
	color: #c9c1ab !important;
}

.share-btn:hover {
	color: #ff758c !important;
}

/* 作品主卡片 */
.detail-main-card {
	padding: 32px;
	display: flex;
	flex-direction: row;
	gap: 40px;
	align-items: stretch;
	flex-shrink: 0;
}

.detail-cover-wrapper {
	width: 33.333%;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.detail-cover-inner {
	position: relative;
	width: 100%;
	height: 100%;
	min-height: 400px;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* Book3D 组件样式覆盖 */
.detail-cover-inner :deep(.book-3d-container) {
	width: 100%;
	height: 100%;
	margin: 0;
}

.detail-cover-inner :deep(.book-3d-wrapper) {
	width: 100%;
	max-width: 280px;
}

/* 封面标签通配样式 */
.cover-badge {
	position: absolute;
	bottom: 12px;
	left: 12px;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(4px);
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 900;
	color: #ff758c;
	box-shadow: 0 4px 12px rgba(255, 117, 140, 0.2);
	border: 1px solid rgba(255, 202, 212, 0.5);
	pointer-events: none;
	z-index: 10;
	display: flex;
	align-items: center;
	gap: 6px;
}

.cover-badge-dot {
	width: 6px;
	height: 6px;
	background: #ff758c;
	border-radius: 50%;
	animation: pulse 2s ease-in-out infinite;
}

.cover-badge-small {
	transform: scale(0.75);
	transform-origin: bottom left;
	margin-left: -4px;
	margin-bottom: -4px;
}

@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

.detail-info-wrapper {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	min-width: 0; /* 允许 flex 子元素收缩 */
}

.detail-info-content {
	flex: 1;
	min-width: 0; /* 允许 flex 子元素收缩 */
}

/* 标签基础样式 */
.info-label {
	font-size: 11px;
	font-weight: 900;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	display: block;
	margin-bottom: -2px;
}

.info-content {
	font-size: 16px;
	font-weight: 700;
	color: #7d5a5a;
}

.info-underline {
	margin-top: 4px;
	width: 100%;
	height: 3px;
	border-radius: 9999px;
}

.color-pink .info-label {
	color: #ff9a9e;
}

.color-pink .info-underline {
	background: linear-gradient(to right, #ff9a9e, transparent);
}

.color-purple .info-label {
	color: #a78bfa;
}

.color-purple .info-underline {
	background: linear-gradient(to right, #a78bfa, transparent);
}

.color-cyan .info-label {
	color: #4dd0e1;
}

.color-cyan .info-underline {
	background: linear-gradient(to right, #4dd0e1, transparent);
}

/* 信息行布局 */
.detail-info-row {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	margin-bottom: 20px;
}

.detail-info-item {
	position: relative;
	display: inline-block;
}

.detail-info-item-full {
	margin-bottom: 20px;
	min-width: 240px;
}

.detail-tags-group {
	display: flex;
	gap: 8px;
	flex-shrink: 0;
}

.yuri-tag {
	padding: 4px 12px;
	border-radius: 8px;
	font-size: 12px;
	font-weight: 700;
	border: 1px solid;
	display: inline-flex;
	align-items: center;
}

.serializing-tag {
	background: #fff0f3;
	color: #ff758c;
	border-color: #ffcad4;
}

.finished-tag {
	background: #f0fff4;
	color: #2ed573;
	border-color: #b7ebc6;
}

.length-tag {
	background: #fcf8f2;
	color: #c9c1ab;
	border-color: #e8dfd5;
}

/* 简介 */
.detail-description {
	font-size: 14px;
	line-height: 1.6;
	color: #7d5a5a;
	margin-bottom: 24px;
}

.description-label {
	color: #9a8471;
	margin-right: 4px;
}

.line-clamp-4 {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 4;
	line-clamp: 4;
	overflow: hidden;
}

/* 百合指数区 */
.yuri-concentration-box {
	background: #fefcf9;
	padding: 16px;
	border-radius: 16px;
	border: 1px solid #f2ece6;
	margin-bottom: 24px;
}

.yuri-concentration-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.yuri-concentration-label {
	display: flex;
	align-items: center;
	gap: 8px;
	color: #ff758c;
}

.yuri-heart-icon {
	width: 16px;
	height: 16px;
}

.yuri-concentration-text {
	font-size: 11px;
	font-weight: 900;
	color: #9a8471;
	letter-spacing: 0.1em;
}

.yuri-concentration-value {
	font-size: 16px;
	font-weight: 900;
	color: #ff758c;
}

.yuri-progress-bar {
	height: 8px;
	width: 100%;
	background: #f2ece6;
	border-radius: 9999px;
	overflow: hidden;
	padding: 2px;
}

.yuri-progress-fill {
	height: 100%;
	background: linear-gradient(to right, #ff9a9e, #ff758c, #fecfef);
	border-radius: 9999px;
	transition: width 0.7s ease;
}

/* 开始阅读按钮 */
.detail-action-button {
	margin-top: 24px;
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.start-read-btn {
	background: #ff758c !important;
	color: white !important;
	font-weight: 900 !important;
	padding: 10px 48px !important;
	border-radius: 12px !important;
	box-shadow: 0 10px 20px rgba(255, 117, 140, 0.2) !important;
	transition: all 0.2s ease !important;
	letter-spacing: 0.1em !important;
	font-size: 16px !important;
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
}

.start-read-btn:hover {
	background: #ff5e78 !important;
	transform: scale(0.98);
}

/* 章节列表 */
.detail-chapter-section {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.detail-chapter-header {
	padding: 20px 24px;
	border-bottom: 1px solid #f2ece6;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #fdfaf8;
}

.detail-chapter-title {
	font-size: 20px;
	font-weight: 900;
	color: #5a463d;
	letter-spacing: -0.01em;
}

.detail-chapter-count {
	font-size: 14px;
	font-weight: 700;
	color: #c9c1ab;
	letter-spacing: 0.05em;
}

.detail-chapter-content {
	padding: 24px;
}

.detail-chapter-chips {
	display: flex;
	gap: 12px;
	margin-bottom: 24px;
	overflow-x: auto;
	padding-bottom: 8px;
	scrollbar-width: thin;
	scrollbar-color: #f2ece6 transparent;
}

.detail-chapter-chips::-webkit-scrollbar {
	height: 6px;
}

.detail-chapter-chips::-webkit-scrollbar-track {
	background: transparent;
}

.detail-chapter-chips::-webkit-scrollbar-thumb {
	background: #f2ece6;
	border-radius: 3px;
}

.detail-chapter-chips::-webkit-scrollbar-thumb:hover {
	background: #e8dfd5;
}

.detail-chapter-chip {
	padding: 10px 32px;
	border-radius: 12px;
	font-size: 14px;
	font-weight: 900;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;
	white-space: nowrap;
	background: #fcf8f2;
	color: #c9c1ab;
	flex-shrink: 0;
	min-width: 80px;
	max-width: 120px;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	text-overflow: ellipsis;
	position: relative;
}

/* 内容未超出时居中 */
.detail-chapter-chip:not(.detail-chapter-chip-overflow) {
	justify-content: center;
}

/* 内容超出时左对齐 */
.detail-chapter-chip-overflow {
	justify-content: flex-start;
	padding-left: 16px;
	padding-right: 16px;
}

.detail-chapter-chip:hover {
	background: #f2ece6;
}

.detail-chapter-chip-active {
	background: #ff758c !important;
	color: white !important;
}

.detail-chapter-chip-active:hover {
	background: #ff5e78 !important;
}

.detail-chapter-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px;
}

@media (max-width: 1200px) {
	.detail-chapter-grid {
		grid-template-columns: repeat(3, 1fr);
	}
}

@media (max-width: 768px) {
	.detail-chapter-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

.chapter-btn {
	border: 1px solid #f2ece6 !important;
	transition: all 0.2s ease !important;
	color: #7d5a5a !important;
	padding: 16px !important;
	border-radius: 8px !important;
	text-align: center !important;
	font-size: 14px !important;
	font-weight: 900 !important;
	text-transform: none !important;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
	background: transparent !important;
}

.chapter-btn:hover {
	border-color: #ff758c !important;
	background: transparent !important;
	color: #ff758c !important;
}

.chapter-btn-active {
	border-color: #f2ece6 !important;
	background: transparent !important;
	color: #7d5a5a !important;
}

/* 推荐区 */
.detail-recommend-card {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.detail-recommend-header {
	padding: 20px;
	border-bottom: 1px solid #f2ece6;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #fdfaf8;
	flex-shrink: 0;
}

.detail-recommend-title {
	font-weight: 900;
	color: #5a463d;
	font-size: 16px;
	letter-spacing: 0.05em;
}

.detail-recommend-more {
	color: #ff9a9e !important;
	font-size: 12px !important;
	font-weight: 900 !important;
	text-transform: none !important;
	padding: 0 !important;
	min-width: auto !important;
}

.detail-recommend-more:hover {
	text-decoration: underline;
}

/* 推荐列表垂直均匀分布 */
.recommendation-list {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 16px;
}

.recommendation-item {
	cursor: pointer;
	margin-bottom: 16px;
}

.recommendation-item:last-child {
	margin-bottom: 0;
}

.recommendation-content {
	display: flex;
	gap: 16px;
	margin-bottom: 8px;
}

.recommendation-cover {
	position: relative;
	width: 80px;
	height: 112px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* Book3D 组件样式覆盖 - 推荐区域 */
.recommendation-cover :deep(.book-3d-container) {
	width: 100%;
	height: 100%;
	margin: 0;
}

.recommendation-cover :deep(.book-3d-wrapper) {
	width: 100%;
	max-width: 80px;
}

.recommendation-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	overflow: hidden;
	padding: 4px 0;
}

.recommendation-title {
	font-weight: 900;
	font-size: 14px;
	color: #5a463d;
	line-height: 1.3;
	margin-bottom: 8px;
	transition: color 0.2s ease;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

.recommendation-item:hover .recommendation-title {
	color: #ff758c;
}

.recommendation-author {
	position: relative;
	display: inline-block;
	max-width: 100%;
}

.recommendation-by {
	font-size: 10px;
	font-weight: 900;
	color: #ff9a9e;
	text-transform: uppercase;
}

.recommendation-author-name {
	font-size: 12px;
	font-weight: 900;
	color: #7d5a5a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-left: 4px;
}

.recommendation-underline {
	height: 2px;
	margin-top: 2px;
}

.recommendation-progress {
	padding: 0 4px;
}

.recommendation-progress-header {
	display: flex;
	justify-content: space-between;
	font-size: 10px;
	font-weight: 900;
	margin-bottom: 4px;
}

.recommendation-progress-label {
	color: #9a8471;
	letter-spacing: -0.02em;
}

.recommendation-progress-value {
	color: #ff758c;
}

.recommendation-progress-bar {
	height: 6px;
}

@media (max-width: 960px) {
	.detail-main-container {
		flex-direction: column;
		padding: 16px;
	}

	.detail-left-panel {
		width: 100%;
		padding-right: 0;
	}

	.detail-right-panel {
		width: 100%;
		padding-left: 0;
	}

	.detail-main-card {
		flex-direction: column;
	}

	.detail-cover-wrapper {
		width: 100%;
	}

	.detail-cover-inner {
		min-height: 300px;
	}

	.detail-chapter-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

.share-dialog-content {
	background: white;
	border-radius: 16px;
	padding: 24px;
}

.share-dialog-title {
	font-size: 18px;
	font-weight: 900;
	color: #5a463d;
	margin-bottom: 16px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.share-link-row {
	display: flex;
	gap: 12px;
	align-items: center;
}

.share-link-input {
	flex: 1;
	padding: 10px 12px;
	border: 1px solid #f2ece6;
	border-radius: 8px;
	font-size: 13px;
	color: #7d5a5a;
	background: #fdfaf8;
	outline: none;
}

.share-copy-btn {
	flex-shrink: 0;
	font-weight: 900 !important;
	border-radius: 8px !important;
	text-transform: none !important;
}
</style>
