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
				<v-img :src="imgUrl || '/error-default.jpg'" width="100%">
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
						<v-img
							src="/error-default.jpg"
							width="100%"
							aspect-ratio="16/9"
							cover
						>
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
			</v-lazy>
		</v-sheet>

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
			content-width="80%"
			content-width-mobile="45vh"
		>
			<template #pageSlider>
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
						</div>
					</template>
					<template #thumb-label>
						{{ currentIndex + 1 }}
					</template>
				</v-slider>
			</template>
		</MangaReaderBottomSheet>
	</v-container>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
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
});

/** 此组件不对外 emit 事件 */
/** 此组件不对外暴露 slot */

const { isMobile } = useDevice();


const chapterLength = computed(() => propsList.data?.length || 0);

const sheet = ref(false);
const currentIndex = ref(0);
const sheetRefs = ref<Element[]>([]);
const goTo = useGoTo();
const isUserSliding = ref(false);
/** 使用父组件传入的 sortedUrls，若无则回退到本地计算 */
const sortedUrls = computed(() =>
	(propsList.sortedUrls?.length ?? 0) > 0
		? propsList.sortedUrls
		: sortUrlArrayByFilenameNaturalOrder(propsList.data),
);

// isFirst、isLast、goToPrevChapter、goToNextChapter、toggleFullscreen 由父组件通过 props 提供

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

// 双页模式锁定逻辑已移至父组件
// sheet 与 isNavbarVisible 的同步已移至 MangaReaderBottomSheet

</script>

<style scoped>
.container {
	background-color: white !important;
}
</style>
