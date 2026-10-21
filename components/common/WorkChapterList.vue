<script setup lang="ts">
import type { WorkDetailChapterItem } from '~/shared/dto/web/work';
const props = defineProps<{
	chapters: WorkDetailChapterItem[];
	contentType: 'manga' | 'novel';
	mobile?: boolean;
}>();
const activeChunkIndex = ref(0);
const chapterChips = computed(() => {
	const chips: { startIndex: number; endIndex: number; label: string }[] = [];
	for (let start = 0; start < props.chapters.length; start += 12) {
		const end = Math.min(start + 11, props.chapters.length - 1);
		chips.push({
			startIndex: start,
			endIndex: end,
			label: start === end ? String(start + 1) : `${start + 1}-${end + 1}`,
		});
	}
	return chips;
});
const filteredChapterList = computed(() => {
	const chip =
		chapterChips.value[activeChunkIndex.value] ?? chapterChips.value[0];
	return chip ? props.chapters.slice(chip.startIndex, chip.endIndex + 1) : [];
});
const selectChunkByIndex = (index: number) => {
	activeChunkIndex.value = index;
};
const isChipOverflow = (label: string) => label.length > 5;
watch(
	() => props.chapters,
	() => {
		activeChunkIndex.value = 0;
	},
);
</script>
<template>
	<section
		class="yuri-card detail-chapter-section"
		:class="{ 'work-chapters--mobile': mobile }"
	>
		<div class="detail-chapter-header">
			<h2 class="detail-chapter-title">章节列表</h2>
			<span class="detail-chapter-count">
				CHAPTERS
				{{
					chapters.length > 0
						? `01-${String(chapters.length).padStart(2, '0')}`
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
					:to="`/${contentType}/chapter/${item.id}`"
				>
					<span class="chapter-bookmark-dot" aria-hidden="true"></span>
					<span class="chapter-btn-text">{{ item.title }}</span>
				</v-btn>
			</div>
		</div>
	</section>
</template>
<style scoped>
.yuri-card {
	background: white !important;
	box-shadow: 0 20px 40px -10px rgba(125, 90, 90, 0.1) !important;
	border-radius: 20px;
	overflow: hidden;
	border: 1px solid #f2ece6;
}
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
.detail-chapter-chip:not(.detail-chapter-chip-overflow) {
	justify-content: center;
}
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
@media (max-width: 960px) {
	.detail-chapter-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}
.work-chapters--mobile.detail-chapter-section {
	padding: 18px 14px;
}
.work-chapters--mobile.detail-chapter-section,
.work-chapters--mobile .detail-chapter-content {
	min-width: 0;
	max-width: 100%;
}
.work-chapters--mobile .detail-chapter-grid {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}
.work-chapters--mobile .detail-chapter-chips {
	min-width: 0;
	max-width: 100%;
}
.detail-chapter-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12px;
}
.detail-chapter-grid .chapter-btn {
	width: 100%;
	min-width: 0 !important;
	height: 56px;
	padding: 0 24px 0 13px !important;
	border: 0 !important;
	border-radius: 0 !important;
	justify-content: flex-start !important;
	text-align: left !important;
	font-weight: 500 !important;
	color: #90756f !important;
	background: linear-gradient(145deg, #fffaf4, #f2e5dc) !important;
	box-shadow: none;
	clip-path: polygon(0 0, 100% 0, calc(100% - 13px) 50%, 100% 100%, 0 100%);
}
@media (hover: hover) {
	.detail-chapter-grid .chapter-btn:hover {
		color: white !important;
		background: linear-gradient(140deg, #ff9baa, #fb758f) !important;
	}
}
.detail-chapter-grid .chapter-btn :deep(.v-btn__content) {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
}
.chapter-bookmark-dot {
	width: 10px;
	height: 10px;
	border: 2px solid currentColor;
	border-radius: 50%;
	opacity: 0.55;
	flex-shrink: 0;
}
.detail-chapter-grid .chapter-btn:focus-visible {
	outline: 2px solid #bd8a79;
	outline-offset: -3px;
}
@media (max-width: 960px) {
	.detail-chapter-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
</style>
