<template>
	<div>
		<v-system-bar class="my-theme-color">
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
			<div class="content-box">
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
			<div class="d-flex justify-space-between align-center">
				<v-btn
					elevation="0"
					prepend-icon="mdi-chevron-left"
					variant="text"
					:disabled="isFirstChapter"
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
					variant="text"
					append-icon="mdi-chevron-right"
					:disabled="isLastChapter"
					@click="nextChapter && navigateToChapter(nextChapter)"
				>
					{{ isLastChapter ? '没有更多了哦' : '下一章' }}
				</v-btn>
			</div>
			<div class="d-flex justify-center">
				<v-btn elevation="0" prepend-icon="mdi-home" variant="text" to="/novel"
					>返回主页</v-btn
				>
			</div>
		</v-sheet>
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
defineProps<{
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
	'update:selectedChapterId': [value: number | null];
}>();

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
