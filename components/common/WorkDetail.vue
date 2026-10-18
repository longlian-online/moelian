<template>
	<div
		class="detail-main-container"
		:class="{ 'detail-main-container--mobile': props.mobile }"
	>
		<template v-if="pending">
			<v-skeleton-loader type="image" />
		</template>
		<template v-else>
			<!-- 左侧 75% 详情区 -->
			<main class="detail-left-panel">
				<!-- 作品主卡片 - 强制 flex-row 确保图片和内容左右排列 -->
				<section
					:key="workId"
					ref="notebookElement"
					class="detail-main-card"
					:class="{ 'notebook-opening': notebookOpened }"
				>
					<!-- 封面图 (左侧) -->
					<div class="detail-cover-wrapper">
						<div class="detail-cover-inner">
							<span
								v-for="corner in ['tl', 'tr', 'bl', 'br']"
								:key="corner"
								class="photo-corner"
								:class="`photo-corner--${corner}`"
								aria-hidden="true"
							></span>
							<Book3D
								homepage
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
						<div class="notebook-page-footer" aria-hidden="true">
							<img src="/moelian-logo.png" class="notebook-logo" alt="" />
							<span class="notebook-page-number">01</span>
						</div>
					</div>

					<div class="notebook-binding" aria-hidden="true">
						<svg
							v-for="ring in 7"
							:key="ring"
							class="notebook-ring"
							viewBox="0 0 64 38"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle cx="7" cy="29" r="5.5" fill="#b98b88" />
							<circle cx="57" cy="29" r="5.5" fill="#b98b88" />
							<path
								d="M7 28C-2 0 66 0 57 28"
								fill="none"
								stroke="#cda9a0"
								stroke-width="7"
								stroke-linecap="round"
								transform="translate(0 1.5)"
							/>
							<path
								d="M7 28C-2 0 66 0 57 28"
								fill="none"
								stroke="#fff9ee"
								stroke-width="6"
								stroke-linecap="round"
							/>
						</svg>
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
									prepend-icon="mdi-share"
									variant="text"
									size="small"
									class="share-btn"
									@click="showShareDialog = true"
								>
									分享
								</v-btn>
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

							<!-- 章节数 -->
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
										<span class="yuri-concentration-text">章节数</span>
									</div>
									<span class="yuri-concentration-value">{{
										workDetail.chapterList.length
									}}</span>
								</div>
								<div class="yuri-progress-bar">
									<div
										class="yuri-progress-fill"
										:style="{
											width: `${Math.min(100, workDetail.chapterList.length)}%`,
										}"
									></div>
								</div>
							</div>
						</div>

						<div class="detail-action-button">
							<v-btn
								class="start-read-btn"
								:class="{ 'has-progress': continueProgress }"
								:to="primaryReadTo"
							>
								<div v-if="continueProgress" class="continue-read-content">
									<span>继续阅读</span>
									<span class="continue-read-progress">
										<span class="continue-read-label">READ</span>
										<span>{{ continueProgressLabel }}</span>
										<span class="continue-read-underline"></span>
									</span>
								</div>
								<template v-else>开始阅读</template>
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
								<span class="chapter-btn-text">{{ item.title }}</span>
							</v-btn>
						</div>
					</div>
				</section>
			</main>

			<!-- 右侧 25% 推荐区 -->
			<aside class="detail-right-panel" :aria-label="props.recommendedTitle">
				<div class="detail-recommend-card recommendation-paper">
					<div class="detail-recommend-header">
						<h2 class="detail-recommend-title">
							<svg
								class="recommendation-orange"
								viewBox="600 165 300 400"
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
							>
								<image href="/moelian-logo.png" width="2172" height="724" />
							</svg>
							你可能也喜欢
						</h2>
						<NuxtLink
							class="detail-recommend-more"
							:to="`/${props.contentType}`"
							>更多 ›</NuxtLink
						>
					</div>
					<div class="recommendation-list">
						<NuxtLink
							v-for="card in recommendationsData"
							:key="card.id"
							class="recommendation-item"
							:to="`/${props.contentType}/${card.id}`"
						>
							<div class="recommendation-content">
								<div class="recommendation-cover">
									<Book3D
										homepage
										:cover-url="card.coverUrl"
										:title="card.title"
										:author="card.author"
										:height="110"
										:width="78"
										:show-title="false"
										:show-spine-text="false"
									/>
								</div>
								<div class="recommendation-info">
									<h3 class="recommendation-title">{{ card.title }}</h3>
									<span class="recommendation-author-name">{{
										card.author || '未知作者'
									}}</span>
									<div class="recommendation-meta">
										<span
											:class="{
												'recommendation-meta--finished':
													card.serialType !== 'Serializing',
											}"
											>{{
												card.serialType === 'Serializing' ? '连载中' : '已完结'
											}}</span
										>
										<span>共 {{ card.lastNo ?? 0 }} 章</span>
									</div>
									<p class="recommendation-description">
										{{ card.description || '暂无简介，点击了解作品详情。' }}
									</p>
								</div>
							</div>
						</NuxtLink>
						<p v-if="!recommendationsData?.length" class="recommendation-empty">
							暂时没有更多推荐
						</p>
					</div>
				</div>
			</aside>
		</template>
	</div>

	<v-dialog v-model="showShareDialog" max-width="520">
		<div class="share-dialog-content">
			<div class="share-dialog-header">
				<div>
					<span class="share-dialog-eyebrow">SHARE POSTER</span>
					<h3 class="share-dialog-title">生成分享海报</h3>
				</div>
				<v-btn
					icon="mdi-close"
					variant="text"
					@click="showShareDialog = false"
				/>
			</div>
			<ShareCard
				ref="shareCardRef"
				:cover-url="workDetail?.coverUrl"
				:share-url="shareUrl"
				:title="workDetail?.title"
				:author="workDetail?.author"
			/>
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

const props = defineProps({
	mobile: { type: Boolean, default: false },
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
const notebookElement = ref<HTMLElement | null>(null);
const notebookOpened = ref(false);

// 数据就绪且活页本进入视口时，仅播放一次开书动画。
onMounted(() => {
	watch(
		notebookElement,
		(element, _, onCleanup) => {
			notebookOpened.value = false;
			if (!element) return;
			if (typeof IntersectionObserver === 'undefined') {
				notebookOpened.value = true;
				return;
			}
			const observer = new IntersectionObserver(
				(entries) => {
					if (entries.some((entry) => entry.isIntersecting)) {
						notebookOpened.value = true;
						observer.disconnect();
					}
				},
				{ threshold: 0.15 },
			);
			observer.observe(element);
			onCleanup(() => observer.disconnect());
		},
		{ immediate: true, flush: 'post' },
	);
});

const store = useWebWorkStore();
const { findLatestProgress } = useReadingProgress();
const continueProgress = ref<ReadingProgress | null>(null);

const showShareDialog = ref(false);
const shareCardRef = ref<InstanceType<
	typeof import('~/components/common/ShareCard.vue').default
> | null>(null);

const shareUrl = computed(() => {
	if (typeof window === 'undefined') return '';
	return `${window.location.origin}/${props.contentType}/${workId.value}`;
});

watch(showShareDialog, (visible) => {
	if (visible) {
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

useSeoMeta({
	title: () =>
		[workDetail.title, workDetail.author].filter(Boolean).join(' - ') ||
		'moelian',
	description: () =>
		workDetail.description ||
		`${workDetail.title}，作者：${workDetail.author}。在线查看作品简介与最新章节。`,
	ogTitle: () => workDetail.title,
	ogDescription: () => workDetail.description,
	ogImage: () => workDetail.coverUrl,
	twitterTitle: () => workDetail.title,
	twitterDescription: () => workDetail.description,
	twitterImage: () => workDetail.coverUrl,
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
	/* 简介不足四行时仍保留空间，稳定下方章节数的位置。 */
	min-height: 6.4em;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 4;
	line-clamp: 4;
	overflow: hidden;
}

/* 章节数 */
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

.continue-read-content {
	display: flex;
	align-items: center;
	gap: 14px;
}

.continue-read-progress {
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

.continue-read-label {
	font-size: 9px;
	font-weight: 900;
	opacity: 0.72;
}

.continue-read-underline {
	position: absolute;
	right: 0;
	bottom: 0;
	left: 14px;
	height: 2px;
	border-radius: 9999px;
	background: linear-gradient(to right, rgba(255, 255, 255, 0.9), transparent);
}

.start-read-btn {
	height: 48px !important;
	background: #ff758c !important;
	color: white !important;
	font-weight: 900 !important;
	padding: 0 48px !important;
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

.start-read-btn.has-progress {
	padding-right: 28px !important;
	padding-left: 28px !important;
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
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 16px;
}

@media (max-width: 1200px) {
	.detail-chapter-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
}

@media (max-width: 768px) {
	.detail-chapter-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.chapter-btn {
	width: 100%;
	min-width: 0 !important;
	max-width: 100%;
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

.chapter-btn-text {
	display: block;
	min-width: 0;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.chapter-btn :deep(.v-btn__content) {
	display: block;
	min-width: 0;
	max-width: 100%;
	overflow: hidden;
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
	border-radius: 22px;
	padding: 24px;
}

.share-dialog-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 16px;
}

.share-dialog-eyebrow {
	color: #ff758c;
	font-size: 10px;
	font-weight: 900;
	letter-spacing: 0.16em;
}

.share-dialog-title {
	font-size: 18px;
	font-weight: 900;
	color: #5a463d;
	margin: 2px 0 0;
}
/* 展开的活页本：两页共用封皮，中缝装订环浮在纸面上。 */
.detail-main-container {
	max-width: 1440px;
}
.detail-main-card {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
	gap: 12px;
	padding: 8px;
	align-items: stretch;
	background: #c19c99;
	border: 5px solid #d5bcb0;
	border-radius: 10px;
	box-shadow:
		0 4px 0 -1px #b58d8b,
		0 12px 24px rgba(105, 72, 55, 0.1) !important;
	overflow: visible;
}
.detail-main-card .detail-cover-wrapper,
.detail-main-card .detail-info-wrapper {
	width: auto;
	min-width: 0;
	background: #fff9ef;
	border: 3px solid #f0e2ce;
	box-shadow: inset 0 0 0 1px rgba(177, 142, 107, 0.12);
}
.detail-main-card .detail-cover-wrapper {
	padding: 42px 24px;
	border-radius: 3px 0 0 3px;
}
.detail-main-card .detail-cover-inner {
	height: 400px;
	min-height: 400px;
}
.detail-main-card .detail-info-wrapper {
	padding: 32px 28px 28px 34px;
	border-radius: 0 3px 3px 0;
}
.notebook-binding {
	position: absolute;
	left: 45.45%;
	top: 42px;
	bottom: 42px;
	width: 62px;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	z-index: 2;
	pointer-events: none;
}
.notebook-ring {
	display: block;
	width: 62px;
	height: 38px;
	flex-shrink: 0;
	overflow: visible;
}
@media (max-width: 1100px) {
	.detail-main-card {
		gap: 8px;
		padding: 6px;
	}
	.detail-main-card .detail-cover-wrapper {
		padding: 32px 16px;
	}
	.detail-main-card .detail-info-wrapper {
		padding: 26px 18px 24px 24px;
	}
	.notebook-binding {
		width: 52px;
	}
	.notebook-ring {
		width: 52px;
		height: 32px;
	}
}
/* 左页藏书卡：页边无独立内框，封面由四个相片角固定。 */
.detail-main-card .detail-cover-wrapper {
	position: relative;
	border: 0;
	box-shadow: none;
	padding: 56px 26px 74px;
	background: #fff9ef;
}
.detail-main-card .detail-cover-wrapper::after {
	content: '';
	position: absolute;
	top: 0;
	bottom: 0;
	right: -6px;
	width: 42px;
	background: linear-gradient(
		90deg,
		transparent,
		rgba(151, 112, 89, 0.06) 60%,
		rgba(124, 88, 72, 0.17)
	);
	pointer-events: none;
}
.detail-main-card .detail-cover-inner {
	width: 94%;
	max-width: 290px;
	height: auto;
	min-height: 0;
	aspect-ratio: 266 / 369;
	transform: rotate(-4deg);
	background: #fffcf6;
	border: 9px solid #fffcf6;
	box-shadow: 2px 7px 12px rgba(112, 81, 54, 0.14);
}
.detail-cover-inner :deep(.book-3d-container) {
	height: 100%;
}
.detail-cover-inner :deep(.book-3d-container.book-3d-home .book-3d-wrapper) {
	width: 100% !important;
	max-width: 100%;
}
.photo-corner {
	position: absolute;
	width: 25px;
	height: 25px;
	background: #e9ddc6;
	clip-path: polygon(0 0, 100% 0, 0 100%);
	z-index: 3;
	pointer-events: none;
}
.photo-corner--tl {
	top: -11px;
	left: -11px;
}
.photo-corner--tr {
	top: -11px;
	right: -11px;
	transform: rotate(90deg);
}
.photo-corner--bl {
	bottom: -11px;
	left: -11px;
	transform: rotate(-90deg);
}
.photo-corner--br {
	bottom: -11px;
	right: -11px;
	transform: rotate(180deg);
}
.notebook-page-footer {
	position: absolute;
	left: 24px;
	right: 24px;
	bottom: 20px;
	display: flex;
	align-items: center;
	gap: 8px;
	color: #b59c82;
	font-family: Georgia, serif;
	font-size: 12px;
	letter-spacing: 2px;
}
.notebook-logo {
	width: 88px;
	height: auto;
	object-fit: contain;
}
.notebook-page-number {
	margin-left: auto;
}
/* 参考活页本的开启动作：两页绕中缝展开，右页稍慢收稳。 */
@keyframes notebook-arrive {
	0% {
		transform: translate(5%, 15%);
		opacity: 0;
		background-color: transparent;
		border-color: transparent;
		box-shadow: none;
	}
	60% {
		transform: translate(-1%, -2%);
		opacity: 1;
		background-color: transparent;
		border-color: transparent;
		box-shadow: none;
	}
	100% {
		transform: translate(0, 0);
		opacity: 1;
		background-color: #c19c99;
		border-color: #d5bcb0;
		box-shadow:
			0 4px 0 -1px #b58d8b,
			0 12px 24px rgba(105, 72, 55, 0.1);
	}
}
@keyframes notebook-open-left {
	from {
		transform: perspective(3000px) rotateY(60deg);
	}
	to {
		transform: perspective(3000px) rotateY(0deg);
	}
}
@keyframes notebook-open-right {
	from {
		transform: perspective(3000px) rotateY(-60deg);
	}
	to {
		transform: perspective(3000px) rotateY(0deg);
	}
}
@keyframes notebook-open-rings {
	from {
		transform: translateX(-50%) scaleX(0.7);
	}
	to {
		transform: translateX(-50%) scaleX(1);
	}
}
@media (prefers-reduced-motion: no-preference) {
	.detail-main-card.notebook-opening {
		animation: notebook-arrive 1s ease-in-out both;
	}
	.notebook-opening .detail-cover-wrapper {
		transform-origin: right bottom;
		animation: notebook-open-left 0.9s ease-in-out both;
	}
	.notebook-opening .detail-info-wrapper {
		transform-origin: left bottom;
		animation: notebook-open-right 1.2s ease-in-out both;
	}
	.notebook-opening .notebook-binding {
		animation: notebook-open-rings 1s ease-out both;
	}
}
/* 推荐采用轻量纸质书签栏，避免和主详情重复展示信息。 */
.detail-right-panel {
	align-items: flex-start;
}
.recommendation-paper {
	position: relative;
	height: auto;
	margin-top: 8px;
	background: #fffdf8;
	border: 1px solid #ebe2d6;
	border-radius: 3px 10px 10px 3px;
	box-shadow: 2px 5px 14px rgba(108, 82, 57, 0.06);
}
.recommendation-paper::before {
	content: '';
	position: absolute;
	top: -9px;
	left: 22px;
	width: 21px;
	height: 31px;
	background: #c3c6af;
	clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
}
.recommendation-paper .detail-recommend-header {
	padding: 30px 16px 14px;
	background: transparent;
	border-bottom: 1px solid #eee6da;
	gap: 8px;
}
.recommendation-paper .detail-recommend-title {
	display: flex;
	align-items: center;
	gap: 6px;
	font-family: 'Songti SC', 'STSong', serif;
	font-size: 16px;
	font-weight: 600;
	letter-spacing: 0;
	color: #765b46;
}
.recommendation-orange {
	width: 18px;
	height: 24px;
	flex-shrink: 0;
}
.recommendation-paper .detail-recommend-more {
	font-size: 11px !important;
	font-weight: 400 !important;
	text-decoration: none;
	white-space: nowrap;
	color: #a28b73 !important;
}
.recommendation-paper .recommendation-list {
	padding: 0 16px;
	justify-content: flex-start;
}
.recommendation-paper .recommendation-item {
	display: block;
	padding: 17px 0;
	margin: 0;
	border-bottom: 1px dashed #e5dacb;
	text-decoration: none;
	color: inherit;
}
.recommendation-paper .recommendation-item:last-child {
	border-bottom: 0;
}
.recommendation-paper .recommendation-content {
	gap: 12px;
	margin: 0;
}
.recommendation-paper .recommendation-cover {
	width: 78px;
	height: 110px;
	border-radius: 2px 4px 4px 2px;
	overflow: hidden;
	box-shadow: 2px 3px 5px rgba(91, 67, 45, 0.1);
	transition: transform 180ms ease;
}
.recommendation-paper .recommendation-info {
	padding: 2px 0;
}
.recommendation-paper .recommendation-title {
	font-size: 14px;
	font-weight: 500;
	line-height: 1.6;
	margin-bottom: 8px;
}
.recommendation-paper .recommendation-author-name {
	margin: 0;
	font-size: 12px;
	font-weight: 400;
	color: #aa927b;
}
.recommendation-empty {
	padding: 24px 0;
	color: #aa927b;
	font-size: 13px;
}
.recommendation-image-placeholder {
	width: 100%;
	height: 100%;
	background: #e9dfd1;
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
	.recommendation-paper .recommendation-item:hover .recommendation-cover {
		transform: translateY(-3px);
	}
}
.recommendation-paper .recommendation-item:focus-visible {
	outline: 2px solid #c3c6af;
	outline-offset: 3px;
}
.recommendation-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 4px 10px;
	margin-top: 8px;
	font-size: 11px;
	line-height: 1.5;
	color: #a28b73;
}
.recommendation-meta > span:first-child {
	color: #cc8c91;
}
.recommendation-meta > .recommendation-meta--finished:first-child {
	color: #8d9c7c;
}
.recommendation-description {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	overflow: hidden;
	margin: 8px 0 0;
	font-size: 12px;
	line-height: 1.7;
	color: #9b8674;
	overflow-wrap: anywhere;
}
.recommendation-paper .recommendation-cover {
	overflow: visible;
	box-shadow: none;
}
.recommendation-paper .recommendation-cover :deep(.book-3d-container) {
	width: 100%;
	height: 110px;
	margin: 0;
}
.recommendation-paper
	.recommendation-cover
	:deep(.book-3d-container.book-3d-home .book-3d-wrapper) {
	width: 100% !important;
	max-width: 100%;
}
/* 手机沿用同一本活页本，将左右页改为上下页，装订环横排。 */
.detail-main-container--mobile {
	flex-direction: column;
	padding: 24px 12px;
	min-height: 0;
	gap: 24px;
}
.detail-main-container--mobile .detail-left-panel {
	width: 100%;
	padding-right: 0;
	gap: 24px;
}
.detail-main-container--mobile .detail-main-card {
	grid-template-columns: minmax(0, 1fr);
	gap: 0;
	padding: 5px;
	border-width: 4px;
	border-radius: 9px;
}
.detail-main-container--mobile .detail-main-card .detail-cover-wrapper {
	padding: 32px 30px 62px;
	min-height: 360px;
	border-radius: 2px 2px 0 0;
}
.detail-main-container--mobile .detail-main-card .detail-cover-inner {
	width: 80%;
	max-width: 240px;
}
.detail-main-container--mobile .detail-cover-wrapper::after {
	top: auto;
	bottom: 0;
	left: 0;
	right: 0;
	width: 100%;
	height: 28px;
	background: linear-gradient(transparent, rgba(124, 88, 72, 0.13));
}
.detail-main-container--mobile .notebook-binding {
	position: relative;
	left: auto;
	top: auto;
	bottom: auto;
	width: 100%;
	height: 24px;
	transform: none;
	flex-direction: row;
	align-items: center;
	justify-content: space-evenly;
}
.detail-main-container--mobile .notebook-ring {
	width: 39px;
	height: 24px;
	transform: rotate(90deg);
	flex-shrink: 1;
}
.detail-main-container--mobile .detail-main-card .detail-info-wrapper {
	padding: 36px 18px 24px;
	border-width: 2px;
	border-radius: 0 0 2px 2px;
}
.detail-main-container--mobile .detail-title-row {
	gap: 8px;
	margin-bottom: 20px;
}
.detail-main-container--mobile .yuri-title {
	font-size: 24px;
	white-space: normal;
	overflow-wrap: anywhere;
}
.detail-main-container--mobile .share-btn {
	padding: 0 8px !important;
	font-size: 12px !important;
}
.detail-main-container--mobile .detail-info-row {
	flex-wrap: wrap;
	gap: 12px;
}
.detail-main-container--mobile .detail-info-item-full {
	display: block;
	width: 100%;
	min-width: 0;
	max-width: 100%;
	margin-bottom: 20px;
}
.detail-main-container--mobile .detail-info-content .info-content {
	overflow-wrap: anywhere;
}
.detail-main-container--mobile .detail-action-button {
	justify-content: center;
}
.detail-main-container--mobile .start-read-btn {
	width: 100%;
	padding-inline: 12px !important;
}
.detail-main-container--mobile .notebook-page-footer {
	left: 18px;
	right: 18px;
	bottom: 16px;
}
.detail-main-container--mobile .detail-chapter-section {
	padding: 18px 14px;
}
.detail-main-container--mobile .detail-right-panel {
	width: 100%;
	padding-left: 0;
}
.detail-main-container--mobile .recommendation-paper {
	margin-top: 0;
}
.detail-main-container--mobile .recommendation-list {
	flex-direction: column;
	gap: 0;
	overflow-x: visible;
	padding: 0 16px;
}
.detail-main-container--mobile .recommendation-item {
	flex: 0 0 auto;
	width: 100%;
	min-width: 0;
	border-bottom: 1px dashed #e5dacb;
}
.detail-main-container--mobile .recommendation-item:last-child {
	border-bottom: 0;
}
@keyframes notebook-open-top {
	from {
		transform: perspective(1000px) rotateX(-50deg);
	}
	to {
		transform: perspective(1000px) rotateX(0deg);
	}
}
@keyframes notebook-open-bottom {
	from {
		transform: perspective(1000px) rotateX(50deg);
	}
	to {
		transform: perspective(1000px) rotateX(0deg);
	}
}
@keyframes notebook-open-rings-mobile {
	from {
		transform: scaleY(0.55);
	}
	to {
		transform: scaleY(1);
	}
}
@media (prefers-reduced-motion: no-preference) {
	.detail-main-container--mobile .notebook-opening .detail-cover-wrapper {
		transform-origin: center bottom;
		animation-name: notebook-open-top;
	}
	.detail-main-container--mobile .notebook-opening .detail-info-wrapper {
		transform-origin: center top;
		animation-name: notebook-open-bottom;
	}
	.detail-main-container--mobile .notebook-opening .notebook-binding {
		animation-name: notebook-open-rings-mobile;
	}
}
</style>

<style scoped>
.detail-main-container--mobile {
	min-width: 0;
	max-width: 100%;
	overflow-x: clip;
}
.detail-main-container--mobile .detail-left-panel,
.detail-main-container--mobile .detail-right-panel,
.detail-main-container--mobile .detail-main-card,
.detail-main-container--mobile .detail-chapter-section,
.detail-main-container--mobile .detail-chapter-content,
.detail-main-container--mobile .recommendation-paper {
	min-width: 0;
	max-width: 100%;
}
.detail-main-container--mobile .detail-chapter-grid {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}
.detail-main-container--mobile .detail-chapter-chips {
	min-width: 0;
	max-width: 100%;
}
</style>
