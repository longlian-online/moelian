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
							:src="imgUrl"
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
						</v-img>
					</template>
				</div>
			</v-window-item>
		</v-window>

		<!-- 遮罩 -->
		<v-overlay v-model="sheet" z-index="100" scroll-strategy="none"></v-overlay>

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
							<v-btn v-bind="props" stacked prepend-icon="mdi-cog-outline" flat>
								阅读设置
							</v-btn>
						</template>
						<v-list>
							<v-list-item title="页面设置">
								<v-tabs v-model="pageLayout" color="#32AAFF">
									<v-tab :value="false">单页</v-tab>
									<v-tab :value="true">双页</v-tab>
								</v-tabs>
							</v-list-item>
							<v-list-item v-model="scrollDirection" title="阅读模式">
								<v-tabs v-model="scrollDirection" color="#32AAFF">
									<v-tab :value="false" :disabled="pageLayout">上下滚动</v-tab>
									<v-tab :value="true">左右滚动</v-tab>
								</v-tabs>
							</v-list-item>
							<v-list-item title="页面设置">
								<v-tabs v-model="readingMode" color="#32AAFF">
									<v-tab :value="false">普通模式</v-tab>
									<v-tab :value="true">日漫模式</v-tab>
								</v-tabs>
							</v-list-item>
						</v-list>
					</v-menu>

					<v-btn
						stacked
						prepend-icon="mdi-fullscreen"
						flat
						@click="toggleFullscreen"
						>全屏</v-btn
					>
				</div>
			</v-sheet>

			<v-sheet
				class="justify-space-between d-flex justify-center align-center rounded-xl mt-4 mb-4"
				style="width: 60%"
			>
				<div class="d-flex justify-space-between align-center w-100">
					<!-- <v-btn elevation="0" prepend-icon="mdi-chevron-left">上一章</v-btn> -->

					<v-select
						class="pa-2 flex-grow-1"
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

					<!-- <v-btn elevation="0" append-icon="mdi-chevron-right">下一章</v-btn> -->
				</div>
			</v-sheet>
			<v-sheet
				v-if="!isSelectActive"
				class="justify-space-between d-flex justify-center align-center rounded-xl mt-4 mb-4"
				style="width: 60%"
			>
				<v-btn v-if="displayIndex === totalPages" variant="plain">下一章</v-btn>
				<v-btn icon="mdi-chevron-left" @click="prev"></v-btn>
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
						</div></template
					>
				</v-slider>
				<v-btn icon="mdi-chevron-right" variant="plain" @click="next"></v-btn>
			</v-sheet>
		</div>
	</v-container>
</template>

<script setup lang="ts">
import type { VWindow } from 'vuetify/components';
import type { WorkDetailChapterItem } from '~/shared/dto/web/work';
// 当前章节的数据
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

const isNavbarVisible = inject('isNavbarVisible') as Ref<boolean>;
const windowRef = ref<VWindow | null>(null);
const isLeft = ref(false);
const isRight = ref(false);
const sheet = ref(false);
const onboarding = ref(0);
const displayIndex = ref(1);
const isSelectActive = ref(false);
//tabs变量
const pageLayout = inject('pageLayout') as Ref<boolean>;
const scrollDirection = inject('scrollDirection') as Ref<boolean>;
const readingMode = inject('readingMode') as Ref<boolean>;
//切换左右页翻页 false为向左翻页
const windowReverse = ref(false);
const sortedUrls = computed(() =>
	sortUrlArrayByFilenameNaturalOrder(propsList.data),
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
//全屏逻辑
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
//如果是双页模式（true），则强制锁定为左右滚动
watch(
	() => pageLayout.value,
	(newVal) => {
		if (newVal === true) {
			scrollDirection.value = true;
		}
	},
	{ immediate: true },
);
//修改页码移动
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
</script>

<style scoped>
.relative-container {
	background-color: white !important;
}

.my-menu .v-btn {
	background-color: transparent;
}

/* 定义左右箭头的光标样式 */
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
