<template>
	<v-overlay v-model="sheetModel" z-index="100" scroll-strategy="none" />
	<div
		v-show="sheetModel"
		:class="{ 'manga-reader-bottom-sheet-active': sheetModel }"
		class="manga-reader-bottom-sheet d-flex flex-column justify-center align-center pa-2"
	>
		<!-- 阅读设置 + 全屏 -->
		<v-sheet
			v-if="!isSelectActive"
			class="rounded-xl d-flex justify-center align-center"
			style="background-color: transparent"
			elevation="0"
		>
			<div
				style="background-color: black"
				class="manga-reader-menu rounded-xl pa-2 d-flex justify-center align-center"
			>
				<v-menu transition="slide-x-transition">
					<template #activator="{ props }">
						<v-btn v-bind="props" stacked prepend-icon="mdi-cog-outline" flat>
							阅读设置
						</v-btn>
					</template>
					<v-list>
						<v-list-item title="页面设置">
							<v-tabs v-model="pageLayout" color="#32AAFF">
								<v-tab :value="false">单页</v-tab>
								<v-tab :value="true" :disabled="isMobile">双页</v-tab>
							</v-tabs>
						</v-list-item>
						<v-list-item v-model="scrollDirection" title="阅读模式">
							<v-tabs v-model="scrollDirection" color="#32AAFF">
								<v-tab :value="false" :disabled="pageLayout">上下滚动</v-tab>
								<v-tab :value="true">左右滚动</v-tab>
							</v-tabs>
						</v-list-item>
						<v-list-item title="翻页方向">
							<v-tabs v-model="readingMode" color="#32AAFF">
								<v-tab
									:value="false"
									:disabled="!pageLayout && !scrollDirection"
									>普通模式</v-tab
								>
								<v-tab :value="true" :disabled="!pageLayout && !scrollDirection"
									>日漫模式</v-tab
								>
							</v-tabs>
						</v-list-item>
					</v-list>
				</v-menu>
				<v-btn
					stacked
					prepend-icon="mdi-fullscreen"
					flat
					@click="toggleFullscreen?.()"
					>全屏</v-btn
				>
			</div>
		</v-sheet>

		<!-- 章节选择 -->
		<v-sheet
			class="justify-space-between d-flex justify-center align-center rounded-xl mt-4 mb-4"
			:style="{ width: contentWidthStyle }"
		>
			<div class="d-flex justify-space-between align-center w-100">
				<v-btn
					v-if="showChapterNav"
					elevation="0"
					prepend-icon="mdi-chevron-left"
					variant="text"
					:disabled="isFirstChapter"
					@click="goToPrevChapter?.()"
					>上一章</v-btn
				>
				<v-select
					:class="showChapterNav ? 'pa-2' : 'pa-2 flex-grow-1'"
					label="选择章节"
					variant="underlined"
					:items="chapters"
					item-value="chapterNumber"
					@focus="isSelectActive = true"
					@blur="isSelectActive = false"
				>
					<template #item="{ props: itemProps, item }">
						<v-list-item
							v-bind="itemProps"
							:to="`/manga/chapter/${item.raw.id}`"
							:title="`${item.raw.title}`"
						/>
					</template>
				</v-select>
				<v-btn
					v-if="showChapterNav"
					elevation="0"
					append-icon="mdi-chevron-right"
					variant="text"
					:disabled="isLastChapter"
					@click="goToNextChapter?.()"
					>下一章</v-btn
				>
			</div>
		</v-sheet>

		<!-- 页码滑块（由父组件通过 slot 传入，各模式不同） -->
		<v-sheet
			v-if="!isSelectActive && $slots.pageSlider"
			class="justify-space-between d-flex justify-center align-center rounded-xl mt-4 mb-4"
			:style="{ width: contentWidthStyle }"
		>
			<slot name="pageSlider" />
		</v-sheet>
	</div>

	<!-- 移动端底部导航栏 -->
	<v-sheet
		v-if="showMobileBar && isMobile"
		class="justify-space-between d-flex justify-center align-center w-100"
	>
		<div class="d-flex justify-space-between align-center w-100">
			<v-btn to="/manga" prepend-icon="mdi-home" stacked>首页</v-btn>
			<v-btn
				elevation="0"
				prepend-icon="mdi-chevron-left"
				variant="text"
				:disabled="isFirstChapter"
				@click="goToPrevChapter?.()"
				>上一章</v-btn
			>
			<v-select
				class="pa-2"
				label="选择章节"
				variant="underlined"
				:items="chapters"
				item-value="chapterNumber"
				@focus="isSelectActive = true"
				@blur="isSelectActive = false"
			>
				<template #item="{ props: itemProps, item }">
					<v-list-item
						v-bind="itemProps"
						:to="`/manga/chapter/${item.raw.id}`"
						:title="`${item.raw.title}`"
					/>
				</template>
			</v-select>
			<v-btn
				elevation="0"
				append-icon="mdi-chevron-right"
				variant="text"
				:disabled="isLastChapter"
				@click="goToNextChapter?.()"
				>下一章</v-btn
			>
		</div>
	</v-sheet>
</template>

<script setup lang="ts">
import type { WorkDetailChapterItem } from '~/shared/dto/web/work';

/**
 * Props
 * @prop modelValue - 遮罩层显示状态（v-model 绑定）
 * @prop chapters - 章节列表
 * @prop isFirstChapter - 是否为第一章
 * @prop isLastChapter - 是否为最后一章
 * @prop goToPrevChapter - 跳转到上一章的方法
 * @prop goToNextChapter - 跳转到下一章的方法
 * @prop toggleFullscreen - 切换全屏的方法
 * @prop showChapterNav - 是否显示上一章/下一章按钮（双页模式不显示），默认 true
 * @prop showMobileBar - 是否显示移动端底部导航栏，默认 false
 * @prop contentWidth - 内容区宽度（桌面端），默认 '60%'
 * @prop contentWidthMobile - 内容区宽度（移动端），默认 '45vh'
 */
const props = withDefaults(
	defineProps<{
		modelValue: boolean;
		chapters: WorkDetailChapterItem[];
		isFirstChapter: boolean;
		isLastChapter: boolean;
		goToPrevChapter?: () => void;
		goToNextChapter?: () => void;
		toggleFullscreen?: () => void;
		showChapterNav?: boolean;
		showMobileBar?: boolean;
		contentWidth?: string;
		contentWidthMobile?: string;
	}>(),
	{
		showChapterNav: true,
		showMobileBar: false,
		contentWidth: '60%',
		contentWidthMobile: '45vh',
		goToPrevChapter: undefined,
		goToNextChapter: undefined,
		toggleFullscreen: undefined,
	},
);

/**
 * Slots
 * @slot pageSlider - 页码滑块区域，各阅读模式传入不同的滑块 UI（双页/单页上下/单页左右）
 */
const { isMobile } = useDevice();
const isNavbarVisible = inject('isNavbarVisible') as Ref<boolean>;
const pageLayout = inject('pageLayout') as Ref<boolean>;
const scrollDirection = inject('scrollDirection') as Ref<boolean>;
const readingMode = inject('readingMode') as Ref<boolean>;

const isSelectActive = ref(false);

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const sheetModel = computed({
	get: () => props.modelValue,
	set: (val) => emit('update:modelValue', val),
});

const contentWidthStyle = computed(() =>
	isMobile ? props.contentWidthMobile : props.contentWidth,
);

watch(
	() => props.modelValue,
	(newVal) => {
		if (isNavbarVisible) isNavbarVisible.value = newVal;
	},
	{ immediate: true },
);
</script>

<style scoped>
.manga-reader-menu .v-btn {
	background-color: transparent;
}

.manga-reader-bottom-sheet {
	position: fixed;
	bottom: -400px;
	left: 50%;
	transform: translateX(-50%);
	width: 75%;
	z-index: 1000;
	transition: bottom 0.3s ease-out;
}

.manga-reader-bottom-sheet-active {
	bottom: 10px;
}
</style>
