<template>
	<v-container width="50%" class="desktop-novel-reader">
		<v-sheet elevation="0" class="pa-0">
			<div class="bar">
				<div class="novel-bar-spacer" aria-hidden="true" />
				<div
					class="novel-bar d-flex justify-space-between align-center pa-2"
					:class="{ 'novel-bar--hidden': !headerVisible }"
					:inert="!headerVisible"
				>
					<ClientOnly>
						<v-breadcrumbs :items="breadcrumbItems" class="custom-breadcrumbs">
							<template #divider>
								<v-icon icon="mdi-chevron-right"></v-icon>
							</template>
						</v-breadcrumbs>
					</ClientOnly>
					<v-btn
						elevation="0"
						prepend-icon="mdi-cog"
						@click="$emit('openThemeSetting')"
						>阅读设置</v-btn
					>
				</div>

				<v-sheet elevation="1" class="pa-6">
					<NovelReadingContent
						:loaded-content="loadedContent"
						:loading="loading"
						:load-failed="loadFailed"
						@retry="$emit('retry')"
						@share="$emit('shareSelection', $event)"
					/>
					<div class="d-flex justify-space-between align-center">
						<v-btn
							elevation="0"
							prepend-icon="mdi-chevron-left"
							:disabled="isFirstChapter"
							variant="text"
							@click="prevChapter && navigateToChapter(prevChapter)"
						>
							上一章
						</v-btn>

						<v-select
							:model-value="selectedChapterId"
							class="pa-2"
							label="选择章节"
							variant="underlined"
							:items="chapters"
							item-value="id"
							item-title="title"
							@update:model-value="$emit('update:selectedChapterId', $event)"
						>
							<template #selection="{ item }">
								<span class="selection-text-ellipsis">
									{{ item.raw.title ?? '' }}
								</span>
							</template>
							<template #item="{ props: itemProps, item }">
								<v-list-item
									v-bind="itemProps"
									:to="`/novel/chapter/${item.raw.id}`"
									:title="`${item.raw.title}`"
								></v-list-item>
							</template>
						</v-select>

						<v-btn
							elevation="0"
							append-icon="mdi-chevron-right"
							variant="text"
							:disabled="isLastChapter"
							@click="nextChapter && navigateToChapter(nextChapter)"
						>
							{{ isLastChapter ? '没有更多了哦' : '下一章' }}
						</v-btn>
					</div>
					<div>
						<v-btn
							elevation="0"
							class="d-flex justify-center"
							prepend-icon="mdi-home"
							variant="text"
							to="/novel"
							>返回主页</v-btn
						>
					</div>
				</v-sheet>
			</div>
		</v-sheet>
	</v-container>
	<nav class="novel-quick-actions" aria-label="小说阅读快捷操作">
		<v-btn
			class="novel-action-button"
			stacked
			variant="text"
			title="上一章"
			aria-label="上一章"
			:disabled="isFirstChapter"
			@click="prevChapter && navigateToChapter(prevChapter)"
			><v-icon icon="mdi-chevron-left" /><span>上一章</span></v-btn
		>
		<v-menu
			v-model="catalogVisible"
			location="left center"
			:close-on-content-click="false"
			:offset="12"
		>
			<template #activator="{ props: menuProps }">
				<v-btn
					v-bind="menuProps"
					class="novel-action-button"
					stacked
					variant="text"
					title="目录"
					aria-label="打开章节目录"
					><v-icon icon="mdi-format-list-bulleted" /><span>目录</span></v-btn
				>
			</template>
			<v-card class="novel-catalog" width="360" max-width="80vw">
				<div class="novel-catalog-heading">
					<span>章节目录 · {{ chapters.length }} 章</span
					><v-btn
						icon="mdi-close"
						size="small"
						variant="text"
						aria-label="关闭目录"
						@click="catalogVisible = false"
					/>
				</div>
				<v-divider />
				<v-list aria-label="章节目录">
					<v-virtual-scroll :items="chapters" :height="420" :item-height="52">
						<template #default="{ item }">
							<v-list-item
								:title="item.title"
								:active="item.id === currentChapter.id"
								color="primary"
								:aria-current="
									item.id === currentChapter.id ? 'page' : undefined
								"
								@click="selectCatalogChapter(item)"
							/>
						</template>
					</v-virtual-scroll>
					<v-list-item v-if="!chapters.length" title="暂无章节" />
				</v-list>
			</v-card>
		</v-menu>
		<v-btn
			class="novel-action-button"
			stacked
			variant="text"
			title="下一章"
			aria-label="下一章"
			:disabled="isLastChapter"
			@click="nextChapter && navigateToChapter(nextChapter)"
			><v-icon icon="mdi-chevron-right" /><span>下一章</span></v-btn
		>
		<v-btn
			class="novel-action-button"
			stacked
			variant="text"
			to="/novel"
			title="返回主页"
			aria-label="返回小说主页"
			><v-icon icon="mdi-home-outline" /><span>回主页</span></v-btn
		>
	</nav>
</template>

<script setup lang="ts">
import type { NovelReadingBlock } from '~/shared/types/novel-content';
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
 * @prop breadcrumbItems - 面包屑导航项数组
 * @prop navigateToChapter - 跳转到指定章节的方法
 */
const props = defineProps<{
	loading?: boolean;
	loadFailed?: boolean;
	loadedContent: NovelReadingBlock[];
	chapters: WorkDetailChapterItem[];
	selectedChapterId: number | null;
	isFirstChapter: boolean;
	isLastChapter: boolean;
	prevChapter: WorkDetailChapterItem | null;
	nextChapter: WorkDetailChapterItem | null;
	currentChapter:
		| WorkDetailChapterItem
		| { id: number; no: number; title: string };
	breadcrumbItems: { title: string; disabled: boolean; to: string }[];
	navigateToChapter: (chapter: WorkDetailChapterItem) => void;
}>();

/**
 * Emits
 * @emit update:selectedChapterId - 章节选择变更时触发，用于 v-model:selectedChapterId 双向绑定
 * @emit openThemeSetting - 点击「阅读设置」按钮时触发，通知父组件打开主题设置对话框
 */
defineEmits<{
	retry: [];
	'update:selectedChapterId': [value: number | null];
	openThemeSetting: [];
	shareSelection: [quote: string];
}>();

const headerVisible = useScrollReveal(true, {
	showAtTop: 63,
	animationFrame: true,
});
const catalogVisible = ref(false);
function selectCatalogChapter(chapter: WorkDetailChapterItem) {
	catalogVisible.value = false;
	props.navigateToChapter(chapter);
}

/** 此组件不对外暴露 slot */
</script>

<style scoped>
.custom-breadcrumbs :deep(.v-breadcrumbs-item) {
	max-width: 400px;
	min-width: 50px;
	display: inline-block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.custom-breadcrumbs :deep(.v-breadcrumbs-item--link):hover {
	color: #a6a897;
}

.selection-text-ellipsis {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: block;
	width: 100%;
}

.novel-bar-spacer {
	height: 64px;
}
.novel-bar {
	position: fixed;
	top: 0;
	left: 50%;
	width: calc(50% - 32px);
	min-width: 0;
	height: 64px;
	z-index: 20;
	transform: translateX(-50%);
	background: rgb(var(--v-theme-surface));
	box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
	transition:
		transform 0.22s ease,
		opacity 0.22s ease;
}
.novel-bar--hidden {
	transform: translate(-50%, -105%);
	opacity: 0;
	pointer-events: none;
}
.novel-bar .custom-breadcrumbs {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	flex-wrap: nowrap;
}
.novel-bar :deep(.v-btn) {
	flex-shrink: 0;
}
.novel-quick-actions {
	position: fixed;
	top: 50%;
	right: max(24px, calc(25vw - 76px));
	transform: translateY(-50%);
	z-index: 20;
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 8px 4px;
	border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
	border-radius: 14px;
	background: rgb(var(--v-theme-surface));
	color: rgb(var(--v-theme-on-surface));
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07);
}
.novel-catalog {
	background: rgb(var(--v-theme-surface));
}
.novel-catalog-heading {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	font-size: 14px;
}
.novel-catalog :deep(.v-virtual-scroll) {
	max-height: 60vh;
}
@media (prefers-reduced-motion: reduce) {
	.novel-bar {
		transition: none;
	}
}

.novel-quick-actions .novel-action-button {
	min-width: 64px;
	height: 68px;
	padding: 8px;
	border-radius: 10px;
}
.novel-action-button :deep(.v-btn__content) {
	flex-direction: column;
	gap: 5px;
}
.novel-action-button span {
	font-size: 11px;
	line-height: 16px;
	letter-spacing: 0;
}
</style>
