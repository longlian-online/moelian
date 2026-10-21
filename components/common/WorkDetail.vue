<template>
	<div
		class="detail-main-container"
		:class="{ 'detail-main-container--mobile': props.mobile }"
	>
		<NotFoundState
			v-if="responseStatus === 404"
			@home="navigateTo(`/${props.contentType}`)"
		/>
		<NetworkErrorState
			v-else-if="responseStatus === 503"
			:retrying="pending"
			@retry="refresh()"
			@home="navigateTo(`/${props.contentType}`)"
		/>
		<template v-else>
			<!-- 左侧 75% 详情区 -->
			<main class="detail-left-panel">
				<!-- 作品主卡片 - 强制 flex-row 确保图片和内容左右排列 -->
				<section
					:key="workId"
					ref="notebookElement"
					class="detail-main-card"
					:class="{
						'notebook-opening': notebookOpened,
						'detail-loading-card': pending || !workDetail,
					}"
				>
					<!-- 封面图 (左侧) -->
					<div class="detail-cover-wrapper">
						<NuxtLink
							:to="`/${props.contentType}`"
							class="detail-back-button"
							aria-label="返回主页"
							title="返回书架"
						>
							<svg viewBox="0 0 36 24" fill="none" aria-hidden="true">
								<path
									d="M31 13C23 11.5 15 12.7 5 12M12 5C9.5 7.2 7.4 9.7 4.5 12.1C7.5 14 9.2 16.9 12.5 19"
								/>
							</svg>
							<span>书架</span>
						</NuxtLink>
						<div v-if="workDetail && !pending" class="detail-cover-inner">
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
						<div v-else class="detail-loading-cover" aria-hidden="true" />
						<img
							v-if="workDetail && !pending"
							class="notebook-doodle notebook-doodle--cover"
							:src="notebookArtwork[0]"
							alt=""
							aria-hidden="true"
							width="600"
							height="600"
						/>
						<div
							v-if="workDetail && !pending"
							class="notebook-page-footer"
							aria-hidden="true"
						>
							<img :src="publicAssets.logo" class="notebook-logo" alt="" />
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
						<div v-if="workDetail && !pending" class="detail-info-content">
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

						<v-skeleton-loader
							v-else
							type="heading, text, text, paragraph, paragraph, button"
						/>
						<div v-if="workDetail && !pending" class="detail-action-button">
							<v-btn
								class="start-read-btn"
								:class="{ 'has-progress': continueProgress }"
								:to="primaryReadTo"
								:disabled="!primaryReadTo"
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
							<img
								class="notebook-doodle notebook-doodle--info"
								:src="notebookArtwork[1]"
								alt=""
								aria-hidden="true"
								width="600"
								height="600"
							/>
						</div>
					</div>
				</section>

				<!-- 章节列表 - 自动填充余下空间 -->
				<WorkChapterList
					v-if="workDetail && !pending"
					:key="workId"
					:chapters="sortedChapterList"
					:content-type="props.contentType"
					:mobile="props.mobile"
				/>
				<v-skeleton-loader v-else type="heading, list-item-three-line" />
			</main>

			<!-- 右侧 25% 推荐区 -->
			<WorkRecommendations
				:works="recommendationsData"
				:content-type="props.contentType"
				:work-id="workId"
				:title="props.recommendedTitle"
				:mobile="props.mobile"
				:pending="recommendationPending"
				:error="recommendationError"
				@retry="refreshRecommendations()"
			/>
		</template>
	</div>

	<WorkShareDialog
		v-model="showShareDialog"
		:work="workDetail"
		:share-url="shareUrl"
	/>
</template>

<script setup lang="ts">
import { publicAssets } from '~/utils/assets';
import type { WorkDetailRes, WorkListRes } from '~/shared/dto/web/work';
import type { ReadingProgress } from '~/shared/types/reading-progress';
import dayjs from 'dayjs';
import type { ApiResponse } from '~/shared/types/api';
import { getWorkDetailStatus } from '~/utils/workDetailStatus';

const props = withDefaults(
	defineProps<{
		mobile?: boolean;
		recommendedTitle: string;
		contentType: 'manga' | 'novel';
	}>(),
	{ mobile: false },
);

const router = useRouter();
const route = useRoute();
const workId = computed(() => Number(route.params.id));
const pickArtwork = useRandomArtwork();
const notebookArtwork = computed(() =>
	['cover', 'info'].map((page) =>
		pickArtwork(`${props.contentType}/${workId.value}:${page}`),
	),
);
const notebookElement = ref<HTMLElement | null>(null);
const notebookOpened = ref(false);

// 骨架与内容共用书本节点，进入视口时开书，数据返回时不重复播放。
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

const { findLatestProgress } = useReadingProgress();
const continueProgress = ref<ReadingProgress | null>(null);

const showShareDialog = ref(false);
const requestUrl = useRequestURL();
const shareUrl = computed(
	() => `${requestUrl.origin}/${props.contentType}/${workId.value}`,
);

const { data, pending, status, error, refresh } = await useFetch<
	ApiResponse<WorkDetailRes>
>(() => `/api/web/work/${workId.value}`, {
	method: 'GET',
	lazy: true,
});
const workDetail = computed(() =>
	data.value?.code === 0 ? data.value.data : undefined,
);
const responseStatus = computed(() =>
	getWorkDetailStatus(
		data.value,
		error.value,
		pending.value || status.value === 'idle',
	),
);
const requestEvent = useRequestEvent();
if (import.meta.server && requestEvent) {
	watch(responseStatus, (code) => setResponseStatus(requestEvent, code), {
		immediate: true,
	});
}

onMounted(() => {
	watch(
		() => workDetail.value?.chapterList,
		(chapters) => {
			continueProgress.value = chapters
				? findLatestProgress(
						props.contentType,
						chapters.map((chapter) => chapter.id),
					)
				: null;
		},
		{ immediate: true },
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
	return chapterId ? `/${props.contentType}/chapter/${chapterId}` : undefined;
});

//排序数组根据no属性
const sortedChapterList = computed(
	() => workDetail.value?.chapterList?.slice() ?? [],
);

// 独立加载推荐，不占用书架列表状态，也不阻塞客户端导航。
const {
	data: recommendationResponse,
	pending: recommendationPending,
	error: recommendationError,
	refresh: refreshRecommendations,
} = await useApiFetch<WorkListRes>('/api/web/work', {
	lazy: true,
	query: computed(() => ({
		type: props.contentType === 'manga' ? 'Manga' : 'Novel',
		page: 1,
		sortType: 'UPDATE',
	})),
});
const recommendationsData = computed(() =>
	(recommendationResponse.value?.data?.list ?? [])
		.filter((work) => work.id !== workId.value)
		.slice(0, 4),
);

function handleCoverClick() {
	const firstChapterId = sortedChapterList.value[0]?.id;
	if (firstChapterId) {
		router.push(`/${props.contentType}/chapter/${firstChapterId}`);
	}
}

useSeoMeta({
	title: () =>
		[workDetail.value?.title, workDetail.value?.author]
			.filter(Boolean)
			.join(' - ') || 'moelian',
	description: () =>
		workDetail.value
			? workDetail.value.description ||
				`${workDetail.value.title}，作者：${workDetail.value.author}。在线查看作品简介与最新章节。`
			: '在线查看作品简介与最新章节。',
	ogTitle: () => workDetail.value?.title,
	ogDescription: () => workDetail.value?.description,
	ogImage: () => workDetail.value?.coverUrl,
	twitterTitle: () => workDetail.value?.title,
	twitterDescription: () => workDetail.value?.description,
	twitterImage: () => workDetail.value?.coverUrl,
});
</script>

<style scoped>
.detail-back-button {
	position: absolute;
	top: 10px;
	left: 18px;
	z-index: 5;
	display: inline-flex;
	align-items: center;
	gap: 5px;
	min-height: 44px;
	padding: 0 6px;
	color: #956e64;
	text-decoration: none;
	font-family: 'Noto Serif SC', 'Songti SC', serif;
	font-size: 14px;
	letter-spacing: 0.14em;
	transition: color 180ms ease;
}
.detail-back-button svg {
	width: 30px;
	height: 24px;
	stroke: currentColor;
	stroke-width: 1.7;
	stroke-linecap: round;
	stroke-linejoin: round;
}
.detail-back-button:hover {
	color: #8b6259;
}
.detail-back-button:focus-visible {
	outline: 2px dashed #b58d83;
	outline-offset: 2px;
	border-radius: 4px;
}
.detail-main-container {
	display: flex;
	width: 100%;
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
.detail-main-card {
	flex-direction: row;
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
.detail-cover-inner :deep(.book-3d-container) {
	width: 100%;
	margin: 0;
}
.detail-cover-inner :deep(.book-3d-wrapper) {
	width: 100%;
	max-width: 280px;
}
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
.detail-action-button {
	margin-top: 24px;
	display: flex;
	align-items: center;
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
}
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
	border-radius: 3px 0 0 3px;
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
.detail-right-panel {
	align-items: flex-start;
}
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
.detail-main-container--mobile .detail-right-panel {
	width: 100%;
	padding-left: 0;
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
.detail-main-container--mobile {
	min-width: 0;
	max-width: 100%;
	overflow-x: clip;
}
.detail-main-container--mobile .detail-left-panel,
.detail-main-container--mobile .detail-right-panel,
.detail-main-container--mobile .detail-main-card {
	min-width: 0;
	max-width: 100%;
}
.notebook-doodle {
	display: block;
	object-fit: contain;
	pointer-events: none;
	user-select: none;
}
.detail-main-card .detail-cover-wrapper {
	padding-bottom: 112px;
}
.notebook-doodle--cover {
	position: absolute;
	right: 32px;
	bottom: 36px;
	width: 80px;
	height: 80px;
}
.detail-action-button {
	gap: 16px;
	flex-wrap: wrap;
	justify-content: space-between;
}
.notebook-doodle--info {
	margin-left: auto;
	width: clamp(64px, 8vw, 100px);
	height: auto;
	aspect-ratio: 1;
	flex-shrink: 0;
}
.detail-main-container--mobile .detail-main-card .detail-cover-wrapper {
	padding-bottom: 104px;
}
.detail-main-container--mobile .notebook-doodle--cover {
	right: 24px;
	bottom: 30px;
	width: 64px;
	height: 64px;
}
.detail-main-container--mobile .notebook-doodle--info {
	display: none;
}
.detail-loading-card {
	min-height: 560px;
}
.detail-loading-card .detail-cover-wrapper {
	padding: 40px 26px;
}
.detail-loading-cover {
	width: 266px;
	max-width: 100%;
	height: 369px;
	flex-shrink: 0;
	border-radius: 6px;
	background: #e8ded0;
	animation: detail-cover-pulse 1.5s ease-in-out infinite alternate;
}
@keyframes detail-cover-pulse {
	to {
		opacity: 0.55;
	}
}
@media (prefers-reduced-motion: reduce) {
	.detail-loading-cover {
		animation: none;
	}
}
.detail-loading-card :deep(.v-skeleton-loader) {
	background-color: transparent;
}
.detail-main-container--mobile .detail-loading-card {
	min-height: 0;
}
.detail-main-card .detail-cover-wrapper,
.detail-main-container--mobile .detail-main-card .detail-cover-wrapper {
	position: relative;
	padding-top: 60px;
}
</style>
