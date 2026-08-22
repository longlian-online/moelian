<template>
	<div class="mobile-detail-container">
		<template v-if="pending">
			<v-skeleton-loader type="image" />
		</template>
		<template v-else>
			<!-- 封面区域 -->
			<section class="mobile-cover-section">
				<div class="mobile-cover-wrapper">
					<Book3D
						:cover-url="workDetail?.coverUrl || ''"
						:title="workDetail?.title || ''"
						:author="workDetail?.author || ''"
						:height="280"
						:width="180"
						:spine-width="30"
						:show-title="false"
						:show-spine-text="false"
						@click="handleCoverClick"
					>
						<template #overlay>
							<AnimeTags
								:tags="workDetail?.tags || []"
								size="small"
								position="bottom-left"
							/>
						</template>
					</Book3D>
				</div>
			</section>

			<!-- 信息区域 -->
			<section class="mobile-info-section">
				<!-- 标题 -->
				<div class="mobile-title-row">
					<h1
						v-copy="workDetail.title"
						v-tooltip="workDetail.title"
						class="mobile-title"
					>
						{{ workDetail.title }}
					</h1>
					<v-btn
						prepend-icon="mdi-share"
						variant="text"
						size="small"
						class="share-btn"
						@click="showShareDialog = true"
					>
						分享
					</v-btn>
				</div>

				<!-- 作者和标签行 -->
				<div class="mobile-info-row">
					<div class="color-pink mobile-info-item">
						<span class="mobile-info-label">BY</span>
						<span
							v-copy="workDetail.author"
							v-tooltip="'右键复制作者'"
							class="mobile-info-content"
						>
							{{ workDetail.author }}
						</span>
						<div class="mobile-info-underline"></div>
					</div>
					<div class="mobile-tags-group">
						<span class="mobile-tag length-tag">
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
							class="mobile-tag"
							:class="
								workDetail.serialType === 'Serializing'
									? 'serializing-tag'
									: 'finished-tag'
							"
						>
							{{
								workDetail.serialType === 'Serializing' ? '连载中' : '已完结'
							}}
						</span>
					</div>
				</div>

				<!-- LAST -->
				<div class="color-purple mobile-info-item mobile-info-item-full">
					<span class="mobile-info-label">LAST</span>
					<span
						v-copy="workDetail.lastChapterName || '暂无'"
						v-tooltip="workDetail.lastChapterName || '暂无'"
						class="mobile-info-content"
					>
						{{ workDetail.lastChapterName || '暂无' }}
					</span>
					<div class="mobile-info-underline"></div>
				</div>

				<!-- UPDATE -->
				<div class="color-cyan mobile-info-item mobile-info-item-full">
					<span class="mobile-info-label">UPDATE</span>
					<span
						v-copy="
							workDetail.chapterUpdatedAt
								? dayjs(workDetail.chapterUpdatedAt).format('YYYY-MM-DD HH:mm')
								: '暂无更新'
						"
						v-tooltip="
							workDetail.chapterUpdatedAt
								? dayjs(workDetail.chapterUpdatedAt).format('YYYY-MM-DD HH:mm')
								: '暂无更新'
						"
						class="mobile-info-content"
					>
						{{
							workDetail.chapterUpdatedAt
								? dayjs(workDetail.chapterUpdatedAt).format('YYYY-MM-DD HH:mm')
								: '暂无更新'
						}}
					</span>
					<div class="mobile-info-underline"></div>
				</div>

				<!-- 简介 -->
				<div class="mobile-description">
					<p>
						<strong class="description-label">简介：</strong>
						<span
							v-tooltip="workDetail.description"
							v-copy="workDetail.description"
						>
							{{ workDetail.description }}
						</span>
					</p>
				</div>

				<!-- 章节数 -->
				<div class="mobile-concentration-box">
					<div class="mobile-concentration-header">
						<div class="mobile-concentration-label">
							<svg
								class="mobile-heart-icon"
								fill="currentColor"
								viewBox="0 0 20 20"
								width="14"
								height="14"
							>
								<path
									d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
								/>
							</svg>
							<span class="mobile-concentration-text">章节数</span>
						</div>
						<span class="mobile-concentration-value">{{
							workDetail.chapterList.length
						}}</span>
					</div>
					<div class="mobile-progress-bar">
						<div
							class="mobile-progress-fill"
							:style="{
								width: `${Math.min(100, workDetail.chapterList.length)}%`,
							}"
						></div>
					</div>
				</div>

				<!-- 开始阅读按钮 -->
				<div class="mobile-action-button">
					<v-btn
						class="mobile-start-read-btn"
						:class="{ 'has-progress': continueProgress }"
						:to="primaryReadTo"
						block
					>
						<div v-if="continueProgress" class="mobile-continue-read-content">
							<span>继续阅读</span>
							<span class="mobile-continue-read-progress">
								<span class="mobile-continue-read-label">READ</span>
								<span>{{ continueProgressLabel }}</span>
								<span class="mobile-continue-read-underline"></span>
							</span>
						</div>
						<template v-else>开始阅读</template>
					</v-btn>
				</div>
			</section>

			<!-- 章节列表 -->
			<section class="mobile-chapter-section">
				<div class="mobile-chapter-header">
					<h2 class="mobile-chapter-title">章节列表</h2>
					<span class="mobile-chapter-count">
						{{
							sortedChapterList.length > 0
								? `${sortedChapterList.length} 章`
								: '0 章'
						}}
					</span>
				</div>
				<div class="mobile-chapter-content">
					<div class="mobile-chapter-chips">
						<button
							v-for="(chip, idx) in chapterChips"
							:key="chip.label"
							v-copy="chip.label"
							v-tooltip="chip.label"
							class="mobile-chapter-chip"
							:class="{
								'mobile-chapter-chip-active': idx === activeChunkIndex,
							}"
							@click="selectChunkByIndex(idx)"
						>
							{{ chip.label }}
						</button>
					</div>
					<div class="mobile-chapter-grid">
						<v-btn
							v-for="item in filteredChapterList"
							:key="item.id"
							v-copy="item.title"
							v-tooltip="item.title"
							class="mobile-chapter-btn"
							:class="{
								'mobile-chapter-btn-active':
									item.id === sortedChapterList[0]?.id,
							}"
							:to="`/${props.contentType}/chapter/${item.id}`"
							block
						>
							<span class="mobile-chapter-btn-text">{{ item.title }}</span>
						</v-btn>
					</div>
				</div>
			</section>

			<!-- 推荐作品 -->
			<section class="mobile-recommend-section">
				<div class="mobile-recommend-header">
					<h2 class="mobile-recommend-title">{{ props.recommendedTitle }}</h2>
					<v-btn
						class="mobile-recommend-more"
						:to="`/${props.contentType}`"
						variant="text"
						size="small"
					>
						更多
					</v-btn>
				</div>
				<div class="mobile-recommend-list">
					<div
						v-for="card in recommendationsData"
						:key="card.id"
						class="mobile-recommend-item"
						@click="router.push(`/${props.contentType}/${card.id}`)"
					>
						<div class="mobile-recommend-cover">
							<Book3D
								:cover-url="card.coverUrl"
								:title="card.title"
								:author="card.author"
								:height="140"
								:width="100"
								:spine-width="20"
								:show-title="false"
								:show-spine-text="false"
								@click.stop="router.push(`/${props.contentType}/${card.id}`)"
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
						<div class="mobile-recommend-info">
							<h3
								v-copy="card.title"
								v-tooltip="card.title"
								class="mobile-recommend-title"
								@click.stop="router.push(`/${props.contentType}/${card.id}`)"
							>
								{{ card.title }}
							</h3>
							<div class="color-pink mobile-recommend-author">
								<span class="mobile-recommend-by">BY</span>
								<span class="mobile-recommend-author-name">{{
									card.author
								}}</span>
								<div
									class="mobile-info-underline mobile-recommend-underline"
								></div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</template>
	</div>

	<v-dialog v-model="showShareDialog" max-width="440">
		<div class="share-dialog-content">
			<h3 class="share-dialog-title">{{ workDetail?.title }}</h3>
			<v-tabs v-model="shareTab" class="share-tabs" align-tabs="center">
				<v-tab value="link">链接分享</v-tab>
				<v-tab value="qrcode">二维码分享</v-tab>
			</v-tabs>
			<v-window v-model="shareTab">
				<v-window-item value="link">
					<div class="share-link-row">
						<input :value="shareUrl" readonly class="share-link-input" />
						<v-btn
							:color="copied ? 'success' : 'primary'"
							class="share-copy-btn"
							@click="handleCopyLink"
						>
							{{ copied ? '已复制✓' : '复制链接' }}
						</v-btn>
					</div>
				</v-window-item>
				<v-window-item value="qrcode">
					<ShareCard
						ref="shareCardRef"
						:cover-url="workDetail?.coverUrl"
						:share-url="shareUrl"
						:title="workDetail?.title"
					/>
				</v-window-item>
			</v-window>
		</div>
	</v-dialog>
</template>

<script setup lang="ts">
import type { WorkDetailRes, WorkListRes } from '~/shared/dto/web/work';
import type {
	ReadingContentType,
	ReadingProgress,
} from '~/shared/types/reading-progress';
import dayjs from 'dayjs';
import Book3D from '~/components/common/Book3D.vue';
import AnimeTags from '~/components/common/AnimeTags.vue';

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
const { $tip } = useNuxtApp();
const workId = computed(() => Number(route.params.id));
const store = useWebWorkStore();
const { findLatestProgress } = useReadingProgress();
const continueProgress = ref<ReadingProgress | null>(null);

const showShareDialog = ref(false);
const shareTab = ref('link');
const copied = ref(false);
const shareCardRef = ref<InstanceType<
	typeof import('~/components/common/ShareCard.vue').default
> | null>(null);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const shareUrl = computed(() => {
	if (typeof window === 'undefined') return '';
	return `${window.location.origin}/${props.contentType}/${workId.value}`;
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

watch(shareTab, (tab) => {
	if (tab === 'qrcode') {
		nextTick(() => {
			shareCardRef.value?.generateCard();
		});
	}
});

watch(showShareDialog, (visible) => {
	if (visible && shareTab.value === 'qrcode') {
		nextTick(() => {
			shareCardRef.value?.generateCard();
		});
	}
});

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

onMounted(() => {
	continueProgress.value = findLatestProgress(
		props.contentType as ReadingContentType,
		workDetail.chapterList.map((chapter) => chapter.id),
	);
});

const continueProgressLabel = computed(() => {
	const progress = continueProgress.value;
	if (!progress) return '';
	if (progress.position.kind === 'manga') {
		return `第 ${progress.chapterNo} 章 · ${progress.position.pageIndex + 1}/${progress.position.totalPages} 页`;
	}
	return `第 ${progress.chapterNo} 章 · ${Math.round(progress.position.percentage * 100)}%`;
});

const primaryReadTo = computed(() => {
	const chapterId =
		continueProgress.value?.chapterId ?? sortedChapterList.value[0]?.id;
	return `/${props.contentType}/chapter/${chapterId}`;
});

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

function handleCoverClick() {
	const firstChapterId = sortedChapterList.value[0]?.id;
	if (firstChapterId) {
		router.push(`/${props.contentType}/chapter/${firstChapterId}`);
	}
}

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
.mobile-detail-container {
	width: 100%;
	min-height: 100vh;
	background-color: #fdfaf8;
	padding: 16px;
	box-sizing: border-box;
}

/* 封面区域 */
.mobile-cover-section {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20px 0;
	margin-bottom: 20px;
}

.mobile-cover-wrapper {
	display: flex;
	justify-content: center;
	align-items: center;
}

/* 信息区域 */
.mobile-info-section {
	background: white;
	border-radius: 20px;
	padding: 20px;
	margin-bottom: 20px;
	box-shadow: 0 10px 30px -15px rgba(125, 90, 90, 0.1);
	border: 1px solid #f2ece6;
}

.mobile-title {
	font-size: 24px;
	font-weight: 900;
	color: #5a463d;
	letter-spacing: -0.01em;
	line-height: 1.3;
	flex: 1;
	min-width: 0;
	margin: 0;
}

.mobile-title-row {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 20px;
}

.share-btn {
	flex-shrink: 0;
	color: #ff758c !important;
	border: 2px solid #ff758c !important;
	border-radius: 12px !important;
	font-weight: 900 !important;
	letter-spacing: 0.05em !important;
	padding: 0 16px !important;
	font-size: 14px !important;
}

.share-btn:hover {
	color: #ffffff !important;
	background: #ff758c !important;
}

.mobile-info-row {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	margin-bottom: 16px;
	flex-wrap: wrap;
	gap: 12px;
}

.mobile-info-item {
	position: relative;
	display: inline-block;
}

.mobile-info-item-full {
	margin-bottom: 16px;
	width: 100%;
}

.mobile-info-label {
	font-size: 10px;
	font-weight: 900;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	display: block;
	margin-bottom: -2px;
}

.mobile-info-content {
	font-size: 14px;
	font-weight: 700;
	color: #7d5a5a;
}

.mobile-info-underline {
	margin-top: 4px;
	width: 100%;
	height: 2px;
	border-radius: 9999px;
}

.color-pink .mobile-info-label {
	color: #ff9a9e;
}

.color-pink .mobile-info-underline {
	background: linear-gradient(to right, #ff9a9e, transparent);
}

.color-purple .mobile-info-label {
	color: #a78bfa;
}

.color-purple .mobile-info-underline {
	background: linear-gradient(to right, #a78bfa, transparent);
}

.color-cyan .mobile-info-label {
	color: #4dd0e1;
}

.color-cyan .mobile-info-underline {
	background: linear-gradient(to right, #4dd0e1, transparent);
}

.mobile-tags-group {
	display: flex;
	gap: 6px;
	flex-shrink: 0;
	flex-wrap: wrap;
}

.mobile-tag {
	padding: 3px 10px;
	border-radius: 6px;
	font-size: 11px;
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

.mobile-description {
	font-size: 13px;
	line-height: 1.6;
	color: #7d5a5a;
	margin-bottom: 20px;
}

.description-label {
	color: #9a8471;
	margin-right: 4px;
}

.mobile-concentration-box {
	background: #fefcf9;
	padding: 12px;
	border-radius: 12px;
	border: 1px solid #f2ece6;
	margin-bottom: 20px;
}

.mobile-concentration-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.mobile-concentration-label {
	display: flex;
	align-items: center;
	gap: 6px;
	color: #ff758c;
}

.mobile-heart-icon {
	width: 14px;
	height: 14px;
}

.mobile-concentration-text {
	font-size: 10px;
	font-weight: 900;
	color: #9a8471;
	letter-spacing: 0.1em;
}

.mobile-concentration-value {
	font-size: 14px;
	font-weight: 900;
	color: #ff758c;
}

.mobile-progress-bar {
	height: 6px;
	width: 100%;
	background: #f2ece6;
	border-radius: 9999px;
	overflow: hidden;
}

.mobile-progress-fill {
	height: 100%;
	background: linear-gradient(to right, #ff9a9e, #ff758c, #fecfef);
	border-radius: 9999px;
	transition: width 0.7s ease;
}

.mobile-action-button {
	margin-top: 20px;
}

.mobile-continue-read-content {
	display: flex;
	align-items: center;
	gap: 14px;
}

.mobile-continue-read-progress {
	position: relative;
	display: flex;
	align-items: baseline;
	gap: 7px;
	padding: 0 0 4px 14px;
	border-left: 1px solid rgba(255, 255, 255, 0.35);
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.04em;
}

.mobile-continue-read-label {
	font-size: 9px;
	font-weight: 900;
	opacity: 0.72;
}

.mobile-continue-read-underline {
	position: absolute;
	right: 0;
	bottom: 0;
	left: 14px;
	height: 2px;
	border-radius: 9999px;
	background: linear-gradient(to right, rgba(255, 255, 255, 0.9), transparent);
}

.mobile-start-read-btn {
	height: 48px !important;
	background: #ff758c !important;
	color: white !important;
	font-weight: 900 !important;
	padding: 0 24px !important;
	border-radius: 12px !important;
	box-shadow: 0 10px 20px rgba(255, 117, 140, 0.2) !important;
	letter-spacing: 0.1em !important;
	font-size: 16px !important;
}

/* 章节列表 */
.mobile-chapter-section {
	background: white;
	border-radius: 20px;
	padding: 20px;
	margin-bottom: 20px;
	box-shadow: 0 10px 30px -15px rgba(125, 90, 90, 0.1);
	border: 1px solid #f2ece6;
}

.mobile-chapter-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid #f2ece6;
}

.mobile-chapter-title {
	font-size: 18px;
	font-weight: 900;
	color: #5a463d;
	letter-spacing: -0.01em;
}

.mobile-chapter-count {
	font-size: 12px;
	font-weight: 700;
	color: #c9c1ab;
}

.mobile-chapter-chips {
	display: flex;
	gap: 8px;
	margin-bottom: 16px;
	overflow-x: auto;
	padding-bottom: 8px;
	scrollbar-width: none;
	-ms-overflow-style: none;
}

.mobile-chapter-chips::-webkit-scrollbar {
	display: none;
}

.mobile-chapter-chip {
	padding: 8px 20px;
	border-radius: 8px;
	font-size: 12px;
	font-weight: 900;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;
	white-space: nowrap;
	background: #fcf8f2;
	color: #c9c1ab;
	flex-shrink: 0;
}

.mobile-chapter-chip:hover {
	background: #f2ece6;
}

.mobile-chapter-chip-active {
	background: #ff758c !important;
	color: white !important;
}

.mobile-chapter-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
}

.mobile-chapter-btn {
	width: 100%;
	min-width: 0 !important;
	max-width: 100%;
	border: 1px solid #f2ece6 !important;
	transition: all 0.2s ease !important;
	color: #7d5a5a !important;
	padding: 12px !important;
	border-radius: 8px !important;
	text-align: center !important;
	font-size: 13px !important;
	font-weight: 700 !important;
	text-transform: none !important;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	background: transparent !important;
}

.mobile-chapter-btn-text {
	display: block;
	min-width: 0;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.mobile-chapter-btn :deep(.v-btn__content) {
	display: block;
	min-width: 0;
	max-width: 100%;
	overflow: hidden;
}

.mobile-chapter-btn:hover {
	border-color: #ff758c !important;
	color: #ff758c !important;
}

.mobile-chapter-btn-active {
	border-color: #f2ece6 !important;
	background: transparent !important;
	color: #7d5a5a !important;
}

/* 推荐作品 */
.mobile-recommend-section {
	background: white;
	border-radius: 20px;
	padding: 20px;
	box-shadow: 0 10px 30px -15px rgba(125, 90, 90, 0.1);
	border: 1px solid #f2ece6;
}

.mobile-recommend-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid #f2ece6;
}

.mobile-recommend-title {
	font-weight: 900;
	color: #5a463d;
	font-size: 16px;
	letter-spacing: 0.05em;
}

.mobile-recommend-more {
	color: #ff9a9e !important;
	font-size: 12px !important;
	font-weight: 900 !important;
	text-transform: none !important;
	padding: 0 !important;
	min-width: auto !important;
}

.mobile-recommend-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.mobile-recommend-item {
	cursor: pointer;
	display: flex;
	gap: 12px;
	padding-bottom: 16px;
	border-bottom: 1px solid #f2ece6;
}

.mobile-recommend-item:last-child {
	border-bottom: none;
	padding-bottom: 0;
}

.mobile-recommend-cover {
	position: relative;
	width: 100px;
	height: 140px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.mobile-recommend-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	overflow: hidden;
	padding: 4px 0;
}

.mobile-recommend-title {
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

.mobile-recommend-item:hover .mobile-recommend-title {
	color: #ff758c;
}

.mobile-recommend-author {
	position: relative;
	display: inline-block;
	max-width: 100%;
}

.mobile-recommend-by {
	font-size: 9px;
	font-weight: 900;
	color: #ff9a9e;
	text-transform: uppercase;
}

.mobile-recommend-author-name {
	font-size: 11px;
	font-weight: 900;
	color: #7d5a5a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-left: 4px;
}

.mobile-recommend-underline {
	height: 2px;
	margin-top: 2px;
}

.share-dialog-content {
	background: white;
	border-radius: 16px;
	padding: 20px;
}

.share-dialog-title {
	font-size: 16px;
	font-weight: 900;
	color: #5a463d;
	margin-bottom: 12px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.share-tabs {
	margin-bottom: 12px;
}

.share-link-row {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.share-link-input {
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #f2ece6;
	border-radius: 8px;
	font-size: 12px;
	color: #7d5a5a;
	background: #fdfaf8;
	outline: none;
	box-sizing: border-box;
}

.share-copy-btn {
	font-weight: 900 !important;
	border-radius: 8px !important;
	text-transform: none !important;
}
</style>
