<template>
	<div
		class="mobile-reader"
		@pointerdown="recordPointer"
		@click="handleReadingTap"
	>
		<v-system-bar class="my-theme-color" data-novel-top-bar :class="{ 'reader-status--hidden': controlsVisible }" :aria-hidden="controlsVisible">
			<div class="title-box d-flex align-center pa-2">
				<div v-if="currentChapter.id !== 0" class="title-box d-flex pa-2">
					<div class="ml-4 text-ellipsis-single-line">
						{{ currentChapter?.title }}
					</div>
				</div>
				<div v-else class="title-box d-flex pa-2">
					<v-skeleton-loader type="text" width="150px"></v-skeleton-loader>
				</div>
			</div>
			<v-spacer></v-spacer>
			<v-icon icon="mdi-battery" class="ms-2"></v-icon>
			<ClientOnly>
				<span class="ms-2">{{ formattedTime }}</span>
			</ClientOnly>
		</v-system-bar>
		<v-sheet class="pa-2">
			<NovelSelectionShare @share="$emit('shareSelection', $event)">
				<div
					class="content-box"
					:class="{ 'content-box--loading': loading }"
					:aria-busy="loading"
				>
					<NetworkErrorState
						v-if="loadFailed && !loading"
						@retry="$emit('retry')"
						@home="navigateTo('/')"
					/>
					<NovelContentSkeleton v-else-if="loading" />
					<div
						v-for="({ content, isCenter, type, label }, index) in loadedContent"
						:key="index"
						:data-reading-block="index"
						class="novel-reading-block"
					>
						<template v-if="type === 'img'">
							<div class="d-flex flex-column align-center my-6 w-100">
								<v-card
									elevation="4"
									class="pa-2 rounded-lg lily-frame"
									max-width="92%"
								>
									<v-img :src="content" width="100%" class="rounded-lg">
										<template #placeholder>
											<v-skeleton-loader
												type="image"
												width="100%"
												height="250"
												class="rounded-lg"
											></v-skeleton-loader>
										</template>
										<template #error>
											<v-img
												src="/error-default.jpg"
												width="100%"
												class="rounded-lg"
											></v-img>
										</template>
									</v-img>
								</v-card>
								<div class="lily-label-container mt-3 d-flex align-center">
									<svg
										class="lily-icon"
										viewBox="0 0 100 100"
										width="16"
										height="16"
									>
										<path
											d="M50 10 C60 40 90 50 50 90 C10 50 40 40 50 10"
											fill="#ff6b9d"
										/>
									</svg>
									<span v-if="label" class="lily-text mx-2">{{ label }}</span>
									<svg
										class="lily-icon"
										viewBox="0 0 100 100"
										width="16"
										height="16"
										style="transform: scaleX(-1)"
									>
										<path
											d="M50 10 C60 40 90 50 50 90 C10 50 40 40 50 10"
											fill="#ff6b9d"
										/>
									</svg>
								</div>
							</div>
						</template>
						<template v-else>
							<p
								class="my-content"
								:style="{ textAlign: isCenter ? 'center' : 'left' }"
							>
								<span>{{ content }}</span>
							</p>
							<br />
						</template>
					</div>
				</div>
			</NovelSelectionShare>
			<MobileNovelChapterNav
				v-bind="chapterNavigationProps"
				@update:selected-chapter-id="$emit('update:selectedChapterId', $event)"
			/>
		</v-sheet>
		<Transition name="reader-top">
			<header
				v-if="controlsVisible"
				class="mobile-reader-top"
				@click.stop
				@pointerdown.stop
			>
				<div class="reader-back">
					<v-btn
						icon="mdi-chevron-left"
						variant="text"
						:to="workId ? `/novel/${workId}` : '/novel'"
						aria-label="返回作品详情"
					/>
				</div>
				<div class="reader-work-title">{{ workTitle || '小说' }}</div>
				<div class="reader-tools">
					<v-btn
						icon="mdi-cog-outline"
						variant="text"
						aria-label="阅读设置"
						@click="$emit('openThemeSetting')"
					/>
					<v-btn
						icon="mdi-share-variant-outline"
						variant="text"
						aria-label="分享作品"
						@click="$emit('shareWork')"
					/>
				</div>
			</header>
		</Transition>
		<Transition name="reader-bottom">
			<footer
				v-if="controlsVisible"
				class="mobile-reader-bottom"
				@click.stop
				@pointerdown.stop
			>
				<MobileNovelChapterNav
					v-bind="chapterNavigationProps"
					@update:selected-chapter-id="
						$emit('update:selectedChapterId', $event)
					"
				/>
			</footer>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import type { WorkDetailChapterItem } from '~/shared/dto/web/work';

/**
 * Props
 * @prop loadedContent - 章节正文内容数组，每项包含 content 文本和 isCenter 是否居中
 * @prop chapters - 章节列表
 * @prop selectedChapterId - 当前选中的章节 ID（v-model 绑定）
 * @prop isFirstChapter - 是否为第一章
 * @prop isLastChapter - 是否为最后一章
 * @prop prevChapter - 上一章信息，无则为 null
 * @prop nextChapter - 下一章信息，无则为 null
 * @prop currentChapter - 当前章节信息
 * @prop formattedTime - 格式化后的当前时间（用于顶部状态栏显示）
 * @prop navigateToChapter - 跳转到指定章节的方法
 */
const props = defineProps<{
	workTitle?: string;
	workId?: number;
	loading?: boolean;
	loadFailed?: boolean;
	loadedContent: {
		content: string;
		isCenter: boolean;
		type?: 'text' | 'img';
		label?: string;
	}[];
	chapters: WorkDetailChapterItem[];
	selectedChapterId: number | null;
	isFirstChapter: boolean;
	isLastChapter: boolean;
	prevChapter: WorkDetailChapterItem | null;
	nextChapter: WorkDetailChapterItem | null;
	currentChapter:
		| WorkDetailChapterItem
		| { id: number; no: number; title: string };
	formattedTime: string;
	navigateToChapter: (chapter: WorkDetailChapterItem) => void;
}>();

/**
 * Emits
 * @emit update:selectedChapterId - 章节选择变更时触发，用于 v-model:selectedChapterId 双向绑定
 */
defineEmits<{
	openThemeSetting: [];
	shareWork: [];
	retry: [];
	'update:selectedChapterId': [value: number | null];
	shareSelection: [quote: string];
}>();

const controlsVisible = ref(false);
const chapterNavigationProps = computed(() => ({
	chapters: props.chapters,
	selectedChapterId: props.selectedChapterId,
	isFirstChapter: props.isFirstChapter,
	isLastChapter: props.isLastChapter,
	prevChapter: props.prevChapter,
	nextChapter: props.nextChapter,
	navigateToChapter: props.navigateToChapter,
}));
let pointerStart = { x: 0, y: 0, time: 0 };
function recordPointer(event: PointerEvent) {
	pointerStart = { x: event.clientX, y: event.clientY, time: Date.now() };
}
function handleReadingTap(event: MouseEvent) {
	if (
		Date.now() - pointerStart.time > 500 ||
		Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) >
			10
	)
		return;
	if (!window.getSelection()?.isCollapsed) return;
	const target = event.target instanceof Element ? event.target : null;
	if (
		!target ||
		target.closest(
			'button, a, input, .v-select, .v-overlay, .novel-selection-share__menu',
		)
	)
		return;
	const paragraph = target.closest('.my-content');
	if (paragraph) {
		const range = document.createRange();
		range.selectNodeContents(paragraph);
		const onText = Array.from(range.getClientRects()).some(
			(rect) =>
				event.clientX >= rect.left &&
				event.clientX <= rect.right &&
				event.clientY >= rect.top &&
				event.clientY <= rect.bottom,
		);
		if (onText) return;
	}
	controlsVisible.value = !controlsVisible.value;
}
const hideControls = () => {
	controlsVisible.value = false;
};
onMounted(() =>
	window.addEventListener('scroll', hideControls, { passive: true }),
);
onBeforeUnmount(() => window.removeEventListener('scroll', hideControls));

/** 此组件不对外暴露 slot */
</script>

<style scoped>
.content-box p {
	text-indent: 2em;
}

.content-box :deep(.v-img__img) {
	position: relative !important;
}

.lily-frame {
	background-color: #fff0f5;
	border: 3px solid #ff6b9d;
	border-radius: 12px;
	box-shadow: 0 3px 12px rgba(255, 107, 157, 0.25);
}

.lily-text {
	color: #ff6b9d !important;
	font-weight: 600;
	font-size: 0.75rem;
}

.selection-text-ellipsis {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: block;
	width: 100%;
}

.text-ellipsis-single-line {
	max-width: 240px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.my-theme-color {
	background-color: rgb(var(--v-theme-background));
	color: rgb(var(--v-theme-on-background));
}

.my-content span {
	background-image: linear-gradient(orange, orange);
	background-repeat: no-repeat;
	background-size: 0% 2px;
	background-position: right bottom;
	transition: background-size 1s ease-out;
}
.my-content span:hover {
	background-size: 100% 2px;
	background-position: left bottom;
	transition: background-size 1s ease-out;
}
</style>

<style scoped>
.content-box {
	position: relative;
	min-height: 70vh;
}
.novel-reading-block {
	opacity: 1;
	animation: novel-content-reveal 0.35s ease both;
}
@keyframes novel-content-reveal {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
.content-box--loading .novel-reading-block {
	opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
	.novel-reading-block {
		animation: none;
	}
}
</style>

<style scoped>
.mobile-reader {
	min-height: 100dvh;
}
.mobile-reader-top,
.mobile-reader-bottom {
	position: fixed;
	left: 0;
	right: 0;
	z-index: 40;
	background: rgb(var(--v-theme-surface));
	color: rgb(var(--v-theme-on-surface));
	box-shadow: 0 0 20px rgba(0, 0, 0, 0.12);
}
.mobile-reader-top {
	top: 0;
	display: grid;
	grid-template-columns: 88px minmax(0, 1fr) 88px;
	align-items: center;
	padding: calc(8px + env(safe-area-inset-top)) 8px 8px;
}
.reader-work-title {
	text-align: center;
	font-size: 14px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.reader-tools {
	display: flex;
	justify-content: flex-end;
}
.reader-tools .v-btn,
.reader-back .v-btn {
	width: 40px;
	height: 40px;
}
.mobile-reader-bottom {
	bottom: 0;
	padding-bottom: env(safe-area-inset-bottom);
}
.reader-top-enter-active,
.reader-top-leave-active,
.reader-bottom-enter-active,
.reader-bottom-leave-active {
	transition:
		transform 0.2s ease,
		opacity 0.2s ease;
}
.reader-top-enter-from,
.reader-top-leave-to {
	transform: translateY(-100%);
	opacity: 0;
}
.reader-bottom-enter-from,
.reader-bottom-leave-to {
	transform: translateY(100%);
	opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
	.reader-top-enter-active,
	.reader-top-leave-active,
	.reader-bottom-enter-active,
	.reader-bottom-leave-active {
		transition: none;
	}
}
</style>

<style scoped>
.reader-status--hidden { opacity: 0; pointer-events: none; }
</style>
