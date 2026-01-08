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

			<v-overlay
				v-model="sheet"
				z-index="100"
				scroll-strategy="none"
			></v-overlay>

			<div
				v-show="sheet"
				:class="{ 'my-bottom-sheet-active': sheet }"
				class="my-bottom-sheet d-flex flex-column justify-center align-center pa-2"
			>
				<v-sheet
					v-if="!isSelectActive"
					class="rounded-xl d-flex justify-center align-center"
					style="background-color: transparent"
					elevation="0"
				>
					<div style="background-color: black" class="my-menu rounded-xl pa-2">
						<v-menu transition="slide-x-transition">
							<template #activator="{ props }">
								<v-btn
									v-bind="props"
									stacked
									prepend-icon="mdi-cog-outline"
									flat
								>
									阅读设置
								</v-btn>
							</template>
							<v-list>
								<v-list-item title="页面设置">
									<v-tabs v-model="pageLayout" color="#32AAFF">
										<v-tab :value="false">单页</v-tab>
										<!-- 手机端禁用双页 -->
										<v-tab :value="true" :disabled="isMobile">双页</v-tab>
									</v-tabs>
								</v-list-item>
								<v-list-item v-model="scrollDirection" title="阅读模式">
									<v-tabs v-model="scrollDirection" color="#32AAFF">
										<v-tab :value="false">上下滚动</v-tab>
										<v-tab :value="true">左右滚动</v-tab>
									</v-tabs>
								</v-list-item>
								<v-list-item title="翻页方向">
									<v-tabs v-model="readingMode" color="#32AAFF">
										<!-- 单页模式并且为上下滚动时候禁用 -->
										<v-tab
											:value="false"
											:disabled="!pageLayout && !scrollDirection"
											>普通模式</v-tab
										>
										<v-tab
											:value="true"
											:disabled="!pageLayout && !scrollDirection"
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
							@click="toggleFullscreen"
						>
							全屏
						</v-btn>
					</div>
				</v-sheet>

				<v-sheet
					class="justify-space-between d-flex justify-center align-center rounded-xl mt-4 mb-4"
					:style="{ width: !isMobile ? '40%' : '45vh' }"
				>
					<div class="d-flex justify-space-between align-center w-100">
						<v-btn
							elevation="0"
							prepend-icon="mdi-chevron-left"
							variant="text"
							:disabled="isFirst"
							@click="goToPrevChapter"
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
							<template #item="{ props, item }">
								<v-list-item
									v-bind="props"
									:to="`/manga/chapter/${item.raw.id}`"
									:title="`${item.raw.title}`"
								></v-list-item>
							</template>
						</v-select>

						<v-btn
							elevation="0"
							variant="text"
							append-icon="mdi-chevron-right"
							:disabled="isLast"
							@click="goToNextChapter"
							>下一章</v-btn
						>
					</div>
				</v-sheet>

				<v-sheet
					v-if="!isSelectActive"
					class="justify-space-between d-flex justify-center align-center rounded-xl mt-4 mb-4"
					:style="{ width: !isMobile ? '40%' : '45vh' }"
				>
					<v-btn icon="mdi-chevron-left" @click="handleManualPrev"></v-btn>
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
					></v-btn>
				</v-sheet>
			</div>

			<v-sheet
				v-if="isMobile"
				class="justify-space-between d-flex justify-center align-center w-100"
			>
				<div class="d-flex justify-space-between align-center w-100">
					<v-btn to="/manga" prepend-icon="mdi-home" stacked> 首页</v-btn>
					<v-btn
						elevation="0"
						prepend-icon="mdi-chevron-left"
						:disabled="isFirst"
						variant="text"
						@click="goToPrevChapter"
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
						<template #item="{ props, item }">
							<v-list-item
								v-bind="props"
								:to="`/manga/chapter/${item.raw.id}`"
								:title="`${item.raw.title}`"
							></v-list-item>
						</template>
					</v-select>

					<v-btn
						elevation="0"
						append-icon="mdi-chevron-right"
						variant="text"
						:disabled="isLast"
						@click="goToNextChapter"
						>下一章</v-btn
					>
				</div>
			</v-sheet>
		</v-container>
	</div>
</template>

<script setup lang="ts">
import type { VWindow } from 'vuetify/components';
import type { WorkDetailChapterItem } from '~/shared/dto/web/work';
const propsList = defineProps({
	data: {
		type: Array as () => string[],
		required: true,
	},
	chapters: {
		type: Array as () => WorkDetailChapterItem[],
		required: true,
	},
});

const { isMobile } = useDevice();
const isNavbarVisible = inject('isNavbarVisible') as Ref<boolean>;
const isSelectActive = ref(false);
// 声明一个响应式变量来存放当前章节数据

const windowRef = ref<VWindow | null>(null);
const isLeft = ref(false);
const isRight = ref(false);
const sheet = ref(false);
const onboarding = ref(0);
const displayIndex = ref(1);

const pageLayout = inject('pageLayout') as Ref<boolean>;
const scrollDirection = inject('scrollDirection') as Ref<boolean>;
const readingMode = inject('readingMode') as Ref<boolean>;

const windowReverse = ref(false);
const isReversed = computed(() => readingMode.value);

const sortedUrls = computed(() =>
	sortUrlArrayByFilenameNaturalOrder(propsList.data),
);

// 获取当前章节ID
const route = useRoute();
const currentChapterId = computed(() => Number(route.params.id));

// 计算是否是第一章
const isFirst = computed(() => {
	const currentChapterIndex = propsList.chapters.findIndex(
		(chapter) => chapter.id === currentChapterId.value,
	);
	return currentChapterIndex === 0;
});

// 计算是否是最后一章
const isLast = computed(() => {
	const currentChapterIndex = propsList.chapters.findIndex(
		(chapter) => chapter.id === currentChapterId.value,
	);
	return currentChapterIndex === propsList.chapters.length - 1;
});

const totalPages = computed(() => {
	return sortedUrls.value?.length ?? 0;
});

const getPageImage = (pageIndex: number) => {
	return sortedUrls.value?.[pageIndex - 1] ?? '';
};

onMounted(() => {
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

const isFullscreen = ref(false);
function toggleFullscreen() {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen();
		isFullscreen.value = true;
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
			isFullscreen.value = false;
		}
	}
}

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
});

watch(displayIndex, (newVal) => {
	onboarding.value = newVal - 1;
});

watch(
	sheet,
	(newVal) => {
		if (isNavbarVisible) {
			isNavbarVisible.value = newVal;
		}
	},
	{ immediate: true },
);

// 获取下一章
const goToNextChapter = () => {
	const route = useRoute();
	const currentChapterId = Number(route.params.id);

	// 找到当前章节在章节列表中的索引
	const currentChapterIndex = propsList.chapters.findIndex(
		(chapter) => chapter.id === currentChapterId,
	);

	if (currentChapterIndex === -1) {
		console.error('当前章节未找到');
		return;
	}

	// 检查是否有下一章
	if (currentChapterIndex < propsList.chapters.length - 1) {
		const nextChapter = propsList.chapters[currentChapterIndex + 1];
		navigateTo(`/manga/chapter/${nextChapter.id}`);
	} else {
		// 已经是最后一章，提示用户
		console.log('已经是最后一章了');
		// 这里可以添加用户提示，比如使用 toast 消息
	}
};

// 获取上一章
const goToPrevChapter = () => {
	const route = useRoute();
	const currentChapterId = Number(route.params.id);

	// 找到当前章节在章节列表中的索引
	const currentChapterIndex = propsList.chapters.findIndex(
		(chapter) => chapter.id === currentChapterId,
	);

	if (currentChapterIndex === -1) {
		console.error('当前章节未找到');
		return;
	}

	// 检查是否有上一章
	if (currentChapterIndex > 0) {
		const prevChapter = propsList.chapters[currentChapterIndex - 1];
		navigateTo(`/manga/chapter/${prevChapter.id}`);
	} else {
		// 已经是第一章，提示用户
		console.log('已经是第一章了');
		// 这里可以添加用户提示，比如使用 toast 消息
	}
};
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

.my-menu .v-btn {
	background-color: transparent;
}

.cursor-prev {
	cursor: url('/left-arrow.png'), auto;
}

.cursor-next {
	cursor: url('/right-arrow.png'), auto;
}

.my-bottom-sheet {
	position: fixed;
	bottom: -400px;
	left: 50%;
	transform: translateX(-50%);
	width: 75%;
	z-index: 1000;
	transition: bottom 0.3s ease-out;
}

.my-bottom-sheet-active {
	bottom: 10px;
}
</style>
