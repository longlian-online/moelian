<template>
	<div class="chapter-navigation">
		<div class="chapter-navigation-row">
			<v-btn
				variant="text"
				prepend-icon="mdi-chevron-left"
				:disabled="isFirstChapter"
				@click="prevChapter && navigateToChapter(prevChapter)"
				>上一章</v-btn
			>
			<v-select
				:model-value="selectedChapterId"
				:items="chapters"
				item-title="title"
				item-value="id"
				label="选择章节"
				variant="underlined"
				density="compact"
				hide-details
				class="chapter-picker"
				@update:model-value="$emit('update:selectedChapterId', $event)"
			/>
			<v-btn
				variant="text"
				append-icon="mdi-chevron-right"
				:disabled="isLastChapter"
				@click="nextChapter && navigateToChapter(nextChapter)"
				>下一章</v-btn
			>
		</div>
		<v-btn variant="text" prepend-icon="mdi-home-outline" to="/novel"
			>返回主页</v-btn
		>
	</div>
</template>
<script setup lang="ts">
import type { WorkDetailChapterItem } from '~/shared/dto/web/work';
defineProps<{
	chapters: WorkDetailChapterItem[];
	selectedChapterId: number | null;
	isFirstChapter: boolean;
	isLastChapter: boolean;
	prevChapter: WorkDetailChapterItem | null;
	nextChapter: WorkDetailChapterItem | null;
	navigateToChapter: (chapter: WorkDetailChapterItem) => void;
}>();
defineEmits<{ 'update:selectedChapterId': [value: number | null] }>();
</script>
<style scoped>
.chapter-navigation {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 12px 8px;
}
.chapter-navigation-row {
	display: flex;
	align-items: center;
	gap: 6px;
	width: 100%;
	min-width: 0;
	justify-content: center;
}
.chapter-navigation-row > .v-btn {
	flex-shrink: 0;
	min-width: 88px;
	padding-inline: 8px;
}
.chapter-picker {
	flex: 0 1 180px;
	width: 0;
	min-width: 0;
}
.chapter-picker :deep(.v-select__selection-text) {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
