<template>
	<div class="center-container">
		<v-container
			:width="isMobile ? '100vh' : '50%'"
			:height="isMobile ? '80vh' : '100vh'"
			class="pa-0 single-page-container"
		>
			<v-window
				ref="windowRef"
				v-model="onboarding"
				class="h-100"
				:reverse="isReversed"
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
						<v-img
							max-width="100%"
							contain
							class="pa-0 h-100 w-100"
							:src="getPageImage(i) || '/error-default.jpg'"
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
					</div>
				</v-window-item>
			</v-window>

			<MangaReaderBottomSheet
				v-model="sheet"
				:chapters="propsList.chapters"
				:is-first-chapter="propsList.isFirstChapter"
				:is-last-chapter="propsList.isLastChapter"
				:go-to-prev-chapter="propsList.goToPrevChapter"
				:go-to-next-chapter="propsList.goToNextChapter"
				:toggle-fullscreen="propsList.toggleFullscreen"
				:show-chapter-nav="true"
				:show-mobile-bar="true"
				content-width="40%"
				content-width-mobile="45vh"
			>
				<template #pageSlider>
					<v-btn icon="mdi-chevron-left" @click="handleManualPrev" />
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
							<div class="me-2 text-h6">
								{{ displayIndex }}/{{ totalPages }}
							</div>
						</template>
					</v-slider>
					<v-btn
						icon="mdi-chevron-right"
						variant="plain"
						@click="handleManualNext"
					/>
				</template>
			</MangaReaderBottomSheet>
		</v-container>
	</div>
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
 * @prop isFirstChapter - 是否为第一章（由父组件提供）
 * @prop isLastChapter - 是否为最后一章（由父组件提供）
 * @prop goToPrevChapter - 跳转到上一章的方法（由父组件提供）
 * @prop goToNextChapter - 跳转到下一章的方法（由父组件提供）
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
	isFirstChapter: {
		type: Boolean,
		default: true,
	},
	isLastChapter: {
		type: Boolean,
		default: false,
	},
	goToPrevChapter: {
		type: Function as PropType<() => void>,
		default: undefined,
	},
	goToNextChapter: {
		type: Function as PropType<() => void>,
		default: undefined,
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

const { isMobile } = useDevice();
// 声明一个响应式变量来存放当前章节数据

const windowRef = ref<VWindow | null>(null);
const isLeft = ref(false);
const isRight = ref(false);
const sheet = ref(false);
const onboarding = ref(0);
const displayIndex = ref(1);

const readingMode = inject('readingMode') as Ref<boolean>;

const windowReverse = ref(false);
const isReversed = computed(() => readingMode.value);

/** 使用父组件传入的 sortedUrls，若无则回退到本地计算 */
const sortedUrls = computed(() =>
	(propsList.sortedUrls?.length ?? 0) > 0
		? propsList.sortedUrls
		: sortUrlArrayByFilenameNaturalOrder(propsList.data),
);

const totalPages = computed(() => {
	return sortedUrls.value?.length ?? 0;
});

const getPageImage = (pageIndex: number) => {
	return sortedUrls.value?.[pageIndex - 1] ?? '';
};

onMounted(() => {
	const initialIndex = Math.min(
		Math.max(0, Math.floor(propsList.initialPageIndex)),
		Math.max(0, totalPages.value - 1),
	);
	onboarding.value = initialIndex;
	displayIndex.value = initialIndex + 1;
	// 在组件挂载时，调用异步函数来加载数据
	document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
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

function handleManualPrev() {
	if (readingMode.value) {
		next();
	} else {
		prev();
	}
}

function handleManualNext() {
	if (readingMode.value) {
		prev();
	} else {
		next();
	}
}

// 全屏逻辑：使用父组件传入的 toggleFullscreen

function handleMouseMove(event: MouseEvent) {
	if (!windowRef.value) return;
	const element = windowRef.value.$el;
	if (!element) return;
	const rect = element.getBoundingClientRect();
	const halfWidth = rect.width / 2;
	const mouseX = event.clientX - rect.left;
	isLeft.value = mouseX < halfWidth;
	isRight.value = mouseX >= halfWidth;
}

function handleClick() {
	const shouldGoNext = readingMode.value ? isLeft.value : isRight.value;
	if (shouldGoNext) {
		next();
	} else {
		prev();
	}
}

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

watch(onboarding, (newVal) => {
	displayIndex.value = newVal + 1;
	emit('progressChange', newVal);
});

watch(displayIndex, (newVal) => {
	onboarding.value = newVal - 1;
});
</script>

<style scoped>
.center-container {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
}

.single-page-container {
	background-color: transparent !important;
}

.cursor-prev {
	cursor: url('/left-arrow.png'), auto;
}

.cursor-next {
	cursor: url('/right-arrow.png'), auto;
}
</style>
