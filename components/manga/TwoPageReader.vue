<template>
	<v-container width="80%" height="100vh" class="pa-0 relative-container">
		<v-window
			ref="windowRef"
			v-model="onboarding"
			class="h-100"
			:reverse="windowReverse"
			:class="{ 'cursor-prev': isLeft, 'cursor-next': isRight }"
			touch
			@contextmenu.prevent="sheet = !sheet"
			@click="handleClick"
			@mousemove="handleMouseMove"
		>
			<!--  eager属性加载当前一话所有内容防止翻页卡顿 -->
			<v-window-item
				v-for="i in totalPages"
				:key="`page-${i}`"
				class="h-100"
				eager
			>
				<div class="d-flex justify-center align-center h-100">
					<template
						v-for="(imgUrl, index) in getPageImages(i)"
						:key="`img-${i}-${index}`"
					>
						<v-img
							v-if="imgUrl"
							max-height="100vh"
							max-width="50%"
							contain
							class="h-100 w-100 pa-0"
							:src="imgUrl || '/error-default.jpg'"
						>
							<template #placeholder>
								<div class="d-flex fill-height align-center justify-center">
									<v-skeleton-loader
										class="fill-height fill-width position-absolute"
									/>

									<v-progress-circular
										indeterminate
										color="primary"
										size="40"
										width="4"
										style="z-index: 1"
									/>
								</div>
							</template>
							<template #error>
								<v-img src="/error-default.jpg" width="100%" cover>
									<div
										class="d-flex fill-height align-center justify-center bg-black-alpha-50"
									>
										<div class="text-center text-white">
											<v-icon
												icon="mdi-image-off-outline"
												size="48"
												class="mb-2"
											></v-icon>
											<div class="text-subtitle-1">图片加载失败</div>
										</div>
									</div>
								</v-img>
							</template>
						</v-img>
					</template>
				</div>
			</v-window-item>
		</v-window>

		<MangaReaderBottomSheet
			v-model="sheet"
			:chapters="propsList.chapters"
			:is-first-chapter="true"
			:is-last-chapter="false"
			:toggle-fullscreen="propsList.toggleFullscreen"
			:show-chapter-nav="false"
			:show-mobile-bar="false"
			content-width="60%"
		>
			<template #pageSlider>
				<v-btn v-if="displayIndex === totalPages" variant="plain">下一章</v-btn>
				<v-btn icon="mdi-chevron-left" @click="prev" />
				<v-slider
					v-model="displayIndex"
					class="mt-6"
					:max="totalPages"
					:min="1"
					:step="1"
					thumb-label
					show-ticks
				>
					<template #prepend>
						<div class="me-2 text-h6">{{ displayIndex }}/{{ totalPages }}</div>
					</template>
				</v-slider>
				<v-btn icon="mdi-chevron-right" variant="plain" @click="next" />
			</template>
		</MangaReaderBottomSheet>
	</v-container>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { VWindow } from 'vuetify/components';
import type { WorkDetailChapterItem } from '~/shared/dto/web/work';

/**
 * Props
 * @prop data - 当前章节的图片 URL 列表
 * @prop chapters - 章节列表
 * @prop sortedUrls - 按文件名自然排序后的图片 URL 列表（由父组件提供）
 * @prop toggleFullscreen - 切换全屏的方法（由父组件提供）
 */
const propsList = defineProps({
	data: {
		type: Array as () => string[],
		required: true,
	},
	chapters: {
		type: Array as () => WorkDetailChapterItem[],
		required: true,
	},
	sortedUrls: {
		type: Array as () => string[],
		default: () => [],
	},
	toggleFullscreen: {
		type: Function as PropType<() => void>,
		default: undefined,
	},
	initialPageIndex: {
		type: Number,
		default: 0,
	},
});

const emit = defineEmits<{
	progressChange: [pageIndex: number];
}>();
/** 此组件不对外暴露 slot */

const windowRef = ref<VWindow | null>(null);
const isLeft = ref(false);
const isRight = ref(false);
const sheet = ref(false);
const onboarding = ref(0);
const displayIndex = ref(1);
//tabs变量
const pageLayout = inject('pageLayout') as Ref<boolean>;
const readingMode = inject('readingMode') as Ref<boolean>;
//切换左右页翻页 false为向左翻页
const windowReverse = ref(false);
/** 使用父组件传入的 sortedUrls，若无则回退到本地计算 */
const sortedUrls = computed(() =>
	(propsList.sortedUrls?.length ?? 0) > 0
		? propsList.sortedUrls
		: sortUrlArrayByFilenameNaturalOrder(propsList.data),
);
// 计算总页数
const totalPages = computed(() => {
	// 确保 currentChapter 存在
	const imageCount = (sortedUrls.value as string[] | undefined)?.length ?? 0;
	if (pageLayout.value) {
		return Math.ceil(imageCount / 2);
	}
	return imageCount;
});
const getPageImages = (pageIndex: number) => {
	const images = (sortedUrls.value as string[] | undefined) || [];
	const startIndex = pageIndex - 1;
	if (!pageLayout.value) {
		return [images[startIndex]];
	}
	const doublePageStartIndex = startIndex * 2;
	const doublePageImages = [
		images[doublePageStartIndex],
		images[doublePageStartIndex + 1],
	].filter(Boolean); // 过滤掉 undefined 值
	return readingMode.value ? doublePageImages.reverse() : doublePageImages;
};

onMounted(() => {
	const initialSpread = Math.min(
		Math.floor(Math.max(0, propsList.initialPageIndex) / 2),
		Math.max(0, totalPages.value - 1),
	);
	onboarding.value = initialSpread;
	displayIndex.value = initialSpread + 1;
	// 添加键盘事件监听器
	document.addEventListener('keydown', handleKeyDown);
});
onBeforeUnmount(() => {
	// 组件卸载前移除键盘事件监听器
	document.removeEventListener('keydown', handleKeyDown);
});
function prev() {
	windowReverse.value = true;
	onboarding.value =
		(onboarding.value - 1 + totalPages.value) % totalPages.value;
}
function next() {
	windowReverse.value = false;
	onboarding.value = (onboarding.value + 1) % totalPages.value;
}
//全屏逻辑：使用父组件传入的 toggleFullscreen
//鼠标切页逻辑
function handleMouseMove(event: MouseEvent) {
	if (!windowRef.value) return;
	const element = windowRef.value.$el;
	if (!element) return;
	const rect = element.getBoundingClientRect();
	const halfWidth = rect.width / 2;
	const mouseX = event.clientX - rect.left;
	if (mouseX < halfWidth) {
		isLeft.value = true;
		isRight.value = false;
	} else {
		isLeft.value = false;
		isRight.value = true;
	}
}
// 鼠标点击切页逻辑
function handleClick() {
	const shouldGoNext = readingMode.value ? isLeft.value : isRight.value;
	if (shouldGoNext) {
		next();
	} else {
		prev();
	}
}
// 键盘事件处理
function handleKeyDown(event: KeyboardEvent) {
	switch (event.key) {
		case 'ArrowLeft':
			if (readingMode.value) {
				next();
			} else {
				prev();
			}
			break;
		case 'ArrowRight':
			if (readingMode.value) {
				prev();
			} else {
				next();
			}
			break;
		case 'Escape':
			sheet.value = false;
			break;
	}
}
// 双页模式锁定逻辑已移至父组件
//修改页码移动
watch(onboarding, (newVal) => {
	displayIndex.value = newVal + 1;
	emit('progressChange', newVal * 2);
});
watch(displayIndex, (newVal) => {
	onboarding.value = newVal - 1;
});
</script>

<style scoped>
.relative-container {
	background-color: white !important;
}

/* 定义左右箭头的光标样式 */
.cursor-prev {
	cursor: url('/left-arrow.png'), auto;
}

.cursor-next {
	cursor: url('/right-arrow.png'), auto;
}
</style>
