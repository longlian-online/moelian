<template>
	<v-container width="50%">
		<v-sheet>
			<div class="bar">
				<div class="novel-bar d-flex justify-space-between align-center pa-2">
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
					<div class="content-box">
						<template
							v-for="({ content, isCenter }, index) in loadedContent"
							:key="index"
						>
							<p
								class="my-content"
								:style="{ textAlign: isCenter ? 'center' : 'left' }"
							>
								<span>{{ content }}</span>
							</p>
							<br />
						</template>
					</div>
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
 * @prop breadcrumbItems - 面包屑导航项数组
 * @prop navigateToChapter - 跳转到指定章节的方法
 */
defineProps<{
	loadedContent: { content: string; isCenter: boolean }[];
	chapters: WorkDetailChapterItem[];
	selectedChapterId: number | null;
	isFirstChapter: boolean;
	isLastChapter: boolean;
	prevChapter: WorkDetailChapterItem | null;
	nextChapter: WorkDetailChapterItem | null;
	currentChapter: WorkDetailChapterItem | { id: number; no: number; title: string };
	breadcrumbItems: { title: string; disabled: boolean; to: string }[];
	navigateToChapter: (chapter: WorkDetailChapterItem) => void;
}>();

/**
 * Emits
 * @emit update:selectedChapterId - 章节选择变更时触发，用于 v-model:selectedChapterId 双向绑定
 * @emit openThemeSetting - 点击「阅读设置」按钮时触发，通知父组件打开主题设置对话框
 */
defineEmits<{
	'update:selectedChapterId': [value: number | null];
	openThemeSetting: [];
}>();

/** 此组件不对外暴露 slot */
</script>

<style scoped>
.content-box p {
	text-indent: 2em;
}

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
