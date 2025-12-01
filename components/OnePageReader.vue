<template>
	<v-container
		:style="{ width: !isMobile ? '50%' : '100%' }"
		class="container pa-0"
	>
		<!-- 图片区 -->
		<!-- 上下滚动 -->
		<v-sheet
			v-for="(imgUrl, index) in sortedUrls"
			:ref="(el) => setItemRef(el, index)"
			:key="index"
			width="100%"
			class="container"
			@contextmenu.prevent="sheet = !sheet"
		>
			<v-lazy
				:options="{ threshold: 0.5 }"
				min-height="200"
				transition="fade-transition"
			>
				<v-img :src="imgUrl" width="100%"
					><template #placeholder>
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
						</div> </template></v-img
			></v-lazy>
		</v-sheet>

		<!-- 遮罩 -->
		<v-overlay v-model="sheet" z-index="100" scroll-strategy="none"></v-overlay>
		<!-- 底部工作区 -->
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
				<div
					style="background-color: black"
					class="my-menu rounded-xl pa-2 d-flex justify-center align-center"
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
						>全屏</v-btn
					>
				</div>
			</v-sheet>

			<v-sheet
				class="justify-space-between d-flex justify-center align-center rounded-xl mt-4 mb-4"
				:style="{ width: !isMobile ? '80%' : '45vh' }"
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
						append-icon="mdi-chevron-right"
						variant="text"
						:disabled="isLast"
						@click="goToNextChapter"
						>下一章</v-btn
					>
				</div>
			</v-sheet>

			<v-sheet
				v-if="!isSelectActive"
				class="justify-space-between d-flex justify-center align-center rounded-xl mt-4 mb-4"
				:style="{ width: !isMobile ? '80%' : '45vh' }"
			>
				<v-slider
					v-model="currentIndex"
					class="mt-6 w-100"
					:max="chapterLength! - 1"
					:min="0"
					:step="1"
					thumb-label
					show-ticks
					@start="onSliderStart"
					@end="onSliderEnd"
				>
					<template #prepend>
						<div class="me-2 text-h6">
							{{ currentIndex + 1 }}/{{ chapterLength }}
						</div></template
					>
					<template #thumb-label>
						{{ currentIndex + 1 }}
					</template>
				</v-slider>
			</v-sheet>
		</div>

		<v-sheet
			v-if="isMobile"
			class="justify-space-between d-flex justify-center align-center w-100"
		>
			<div class="d-flex justify-space-between align-center w-100">
				<v-btn to="/manga" prepend-icon="mdi-home" stacked>首页</v-btn>
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
					append-icon="mdi-chevron-right"
					variant="text"
					:disabled="isLast"
					@click="goToNextChapter"
					>下一章</v-btn
				>
			</div>
		</v-sheet>
	</v-container>
</template>

<script setup lang="ts">
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

const pageLayout = inject('pageLayout') as Ref<boolean>;
const scrollDirection = inject('scrollDirection') as Ref<boolean>;
const readingMode = inject('readingMode') as Ref<boolean>;
const isNavbarVisible = inject('isNavbarVisible') as Ref<boolean>;

const chapterLength = computed(() => propsList.data?.length || 0);

const sheet = ref(false);
const isFullscreen = ref(false);
const currentIndex = ref(0);
const sheetRefs = ref<Element[]>([]);
const goTo = useGoTo();
const isUserSliding = ref(false);
const isSelectActive = ref(false);
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

function toggleFullscreen() {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen();
		isFullscreen.value = true;
	} else if (document.exitFullscreen) {
		document.exitFullscreen();
		isFullscreen.value = false;
	}
}

// 初始化交叉观察器
let observer: IntersectionObserver | null = null;

onMounted(() => {
	const options = {
		root: null, //null默认为浏览器视口
		threshold: 0.5,
		rootMargin: '0px',
	};

	//entries：这是一个数组，包含了所有被观察到发生交叉变化的元素。
	observer = new IntersectionObserver((entries) => {
		if (isUserSliding.value) return; // 用户拖动滑块时不更新索引

		let mostVisibleEntry = null; //存储当前最可见的itob对象
		let maxRatio = 0; // maxRatio: 存储当前最大的可见比例

		entries.forEach((entry) => {
			// entry.intersectionRatio: 元素的可见比例，从0到1
			if (entry.intersectionRatio > maxRatio) {
				maxRatio = entry.intersectionRatio;
				mostVisibleEntry = entry;
			}
		});

		if (mostVisibleEntry) {
			const index = sheetRefs.value.findIndex(
				(el) => el === mostVisibleEntry!.target,
			);
			if (index !== -1) {
				currentIndex.value = index;
			}
		}
	}, options);

	// 开始观察所有图片
	sheetRefs.value.forEach((el) => {
		if (el) observer?.observe(el);
	});
});

//离开页面时移除observer
onBeforeUnmount(() => {
	observer?.disconnect();
});

// 收集元素引用
const setItemRef = (
	el: Element | ComponentPublicInstance | null,
	index: number,
) => {
	if (el) {
		//获取到真实的HTML元素
		const domEl = (el as ComponentPublicInstance).$el ?? el;

		// 确保数组长度足够
		if (index >= sheetRefs.value.length) {
			sheetRefs.value.length = index + 1;
		}

		sheetRefs.value[index] = domEl as Element;
	}
};

// 滑块事件处理
const onSliderStart = () => {
	isUserSliding.value = true;
};

const onSliderEnd = () => {
	// 滚动到指定图片
	scrollToImage(currentIndex.value);
};

// 滚动到指定图片
const scrollToImage = (index: number) => {
	const targetElement = sheetRefs.value[index];
	if (targetElement) {
		const htmlElement = targetElement as HTMLElement;
		goTo(htmlElement, {
			duration: 0, // 滚动动画持续时间
			offset: 0, //
			// easing: 'easeInOutCubic', // 平滑过渡效果
		}).then(() => {
			// 滚动完成后重置标志位
			setTimeout(() => {
				isUserSliding.value = false;
			}, 100);
		});
	} else {
		isUserSliding.value = false;
	}
};

//实时预览
watch(currentIndex, (newIndex) => {
	if (isUserSliding.value) {
		// 如果用户正在拖动滑块，直接滚动到新位置
		scrollToImage(newIndex);
	}
});

//如果是单页模式且上下滚动，则禁用
watch(
	() => pageLayout.value,
	(newVal) => {
		if (newVal === true) {
			scrollDirection.value = true;
		}
	},
	{ immediate: true },
);

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
.container {
	background-color: white !important;
}
.my-menu .v-btn {
	background-color: transparent;
}

.my-bottom-sheet {
	position: fixed;
	bottom: -400px;
	left: 50%;
	transform: translateX(-50%);
	width: 50%;
	z-index: 1000;
	transition: bottom 0.3s ease-out;
}

.my-bottom-sheet-active {
	bottom: 10px;
}
</style>
