<template>
	<ClientOnly>
		<div :key="String($route.params.id)">
			<!-- 双页模式 -->
			<TwoPageReader
				v-if="pageLayout"
				:data="chapterList"
				:chapters="chapters"
			></TwoPageReader>
			<!-- 单页 上下滚动 -->
			<OnePageReader
				v-if="!pageLayout && !scrollDirection"
				:data="chapterList"
				:chapters="chapters"
			></OnePageReader>
			<!-- 单页 左右滚动 -->
			<SinglePageReader
				v-if="!pageLayout && scrollDirection"
				:data="chapterList"
				:chapters="chapters"
			></SinglePageReader>
		</div>
	</ClientOnly>
</template>

<script setup lang="ts">
import type {
	WorkContentRes,
	WorkDetailChapterItem,
} from '~/shared/dto/web/work';

definePageMeta({
	hideFooter: true, // 告诉路由隐藏页脚
	readerTheme: 'manga', //漫画阅读器
});
const route = useRoute();
const chapterId = computed(() => Number(route.params.id));
const { data, error: apiError } = await useApiFetch<WorkContentRes>(
	`/api/web/work/chapter/${chapterId.value}/content`,
	{
		method: 'GET',
	},
);

if (apiError.value) {
	const statusCode =
		'statusCode' in apiError.value
			? (apiError.value.statusCode as number)
			: 500;
	throw createError({
		statusCode,
		statusMessage: '获取章节内容失败',
		fatal: true,
	});
}

const chapterList = ref<string[]>();

const rawChapters = ref<WorkDetailChapterItem[]>();
if (data.value && data.value.data) {
	// 检查漫画链接列表是否为空
	if (!data.value.data.manga.urls || data.value.data.manga.urls.length === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: '该章节暂无内容',
			fatal: true,
		});
	}
	chapterList.value = data.value.data.manga.urls;
	rawChapters.value = data.value.data.chapters;
} else {
	throw createError({
		statusCode: 404,
		statusMessage: '章节内容不存在',
		fatal: true,
	});
}

//排序章节
const chapters = computed(() => {
	// 1. 检查列表是否存在或为空
	if (!rawChapters.value || rawChapters.value.length === 0) {
		return [];
	}
	// 2. 使用 slice() 创建数组副本，避免修改原始数据
	return rawChapters.value.slice()
});

const isNavbarVisible = inject('isNavbarVisible') as Ref<boolean>;
onMounted(() => {
	//加载时默认为false
	if (isNavbarVisible) {
		isNavbarVisible.value = false;
	}
});

// 当组件即将卸载时（即离开此页面时），将导航条设置为显示
onBeforeUnmount(() => {
	if (isNavbarVisible) {
		isNavbarVisible.value = true;
	}
});

const settingsStore = useSettingsStore();
// 使用 storeToRefs 来解构 state 属性，同时保持响应式
const { pageLayout, scrollDirection, readingMode } = storeToRefs(settingsStore);

provide('pageLayout', pageLayout);
provide('scrollDirection', scrollDirection);
provide('readingMode', readingMode);

// 动态设置页面标题
const currentChapter = ref<WorkDetailChapterItem | null>(null);
currentChapter.value =
	(data.value.data.chapters || []).find((c) => c.id === chapterId.value) ||
	null;

watchEffect(() => {
	const chapter = currentChapter.value;

	// 生成标题
	let titleContent: string;
	if (chapter) {
		titleContent = `第${chapter.no}话 ${chapter.title || '无标题'} - 漫画阅读`;
	} else {
		// 数据获取中或失败时显示的默认标题
		titleContent = '漫画阅读器 - 正在加载';
	}

	useHead({
		title: titleContent,
		meta: [
			{
				name: 'description',
				content: '百合漫画阅读器，提供流畅的漫画阅读体验，支持单页和双页模式。',
			},
			{
				name: 'keywords',
				content:
					'百合, 百合漫画,夢怜龍華, 夢怜龙华, 百合小说, 百合轻小说, 百合漫画推荐, 百合漫画阅读, 百合漫画更新',
			},
		],
	});
});
</script>

<style scoped></style>
