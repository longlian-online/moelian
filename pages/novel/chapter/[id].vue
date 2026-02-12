<template>
	<div :key="String($route.params.id)">
		<div v-if="isMobile">
			<v-system-bar class="my-theme-color">
				<!-- 章节序号和章节标题 -->
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
				<!-- 避免服务器渲染时间 -->
				<ClientOnly
					><span class="ms-2">{{ formattedTime }}</span>
				</ClientOnly>
			</v-system-bar>
			<v-sheet class="pa-2">
				<div class="content-box">
					<template
						v-for="({ content, isCenter }, index) in loadedContent"
						:key="index"
					>
						<p
							class="my-content"
							:style="{ textAlign: isCenter ? 'center' : 'left' }"
						>
							<span>{{ content }}</span>
						</p>
						<br />
					</template>
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
						v-model="selectedChapterId"
						class="pa-2"
						label="选择章节"
						variant="underlined"
						:items="chapters"
						item-value="id"
						item-title="title"
					>
						<template #selection="{ item }">
							<span class="selection-text-ellipsis">
								{{ item.raw.title ?? '' }}
							</span>
						</template>
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
						:disabled="isLastChapter"
						@click="nextChapter && navigateToChapter(nextChapter)"
					>
						<!-- 这里的文本内容由 isLastChapter 决定，现在 SSR 时状态会一致 -->
						{{ isLastChapter ? '没有更多了哦' : '下一章' }}
					</v-btn>
				</div>
				<div class="d-flex justify-center">
					<v-btn
						elevation="0"
						prepend-icon="mdi-home"
						variant="text"
						to="/novel"
						>返回主页</v-btn
					>
				</div>
			</v-sheet>
		</div>

		<v-dialog v-model="isChangeTheme" max-width="600">
			<ThemeSetting> </ThemeSetting>
		</v-dialog>

		<v-container v-if="!isMobile" width="50%">
			<v-sheet>
				<div class="bar">
					<div class="novel-bar d-flex justify-space-between align-center pa-2">
						<!-- 面包屑导航依赖客户端为ClientOnly -->
						<ClientOnly>
							<v-breadcrumbs :items="items" class="custom-breadcrumbs">
								<template #divider>
									<v-icon icon="mdi-chevron-right"></v-icon>
								</template>
							</v-breadcrumbs>
						</ClientOnly>
						<v-btn
							elevation="0"
							prepend-icon="mdi-cog"
							@click="isChangeTheme = true"
							>阅读设置</v-btn
						>
					</div>

					<v-sheet elevation="1" class="pa-6">
						<div class="content-box">
							<template
								v-for="({ content, isCenter }, index) in loadedContent"
								:key="index"
							>
								<p
									class="my-content"
									:style="{ textAlign: isCenter ? 'center' : 'left' }"
								>
									<span>{{ content }}</span>
								</p>
								<br />
							</template>
						</div>
						<div class="d-flex justify-space-between align-center">
							<v-btn
								elevation="0"
								prepend-icon="mdi-chevron-left"
								:disabled="isFirstChapter"
								variant="text"
								@click="prevChapter && navigateToChapter(prevChapter)"
							>
								上一章
							</v-btn>

							<v-select
								v-model="selectedChapterId"
								class="pa-2"
								label="选择章节"
								variant="underlined"
								:items="chapters"
								item-value="id"
								item-title="title"
							>
								<template #selection="{ item }">
									<span class="selection-text-ellipsis">
										{{ item.raw.title ?? '' }}
									</span>
								</template>
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
								:disabled="isLastChapter"
								@click="nextChapter && navigateToChapter(nextChapter)"
							>
								{{ isLastChapter ? '没有更多了哦' : '下一章' }}
							</v-btn>
						</div>
						<div>
							<v-btn
								elevation="0"
								class="d-flex justify-center"
								prepend-icon="mdi-home"
								variant="text"
								to="/novel"
								>返回主页</v-btn
							>
						</div>
					</v-sheet>
				</div>
			</v-sheet>
		</v-container>
	</div>
</template>

<script setup lang="ts">
import { useCurrentTime } from '@/composables/useCurrentTime';
import mammoth from 'mammoth';
import type {
	WorkContentRes,
	WorkDetailChapterItem,
} from '~/shared/dto/web/work';

definePageMeta({
	readerTheme: 'novel',
	baseNav: true,
	hideFooter: true,
});

const route = useRoute();
const chapterId = computed(() => Number(route.params.id));
const docxUrl = ref('');
const rawChapters = ref<WorkDetailChapterItem[]>([]);
const loadedContent = ref<{ content: string; isCenter: boolean }[]>([]);
const isLoading = ref(false);
const selectedChapterId = ref<number | null>(null);
// 导航栏控制
const isNavbarVisible = inject('isNavbarVisible') as Ref<boolean>;
const { isMobile } = useDevice();
const isChangeTheme = ref(false);
// 解析 DOCX 函数 (保持不变)
async function parseDocx(url: string) {
	isLoading.value = true;
	loadedContent.value = [];

	try {
		// 由于 mammoth 和 fetch 是客户端 API，SSR 时不会运行
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const arrayBuffer = await response.arrayBuffer();

		//@ts-expect-error mammoth 支持 styleMap 但类型定义未暴露
		const result = await mammoth.convertToMarkdown(
			{ arrayBuffer },
			{
				styleMap: ["p[align='center'] => p[CENTER]"],
			},
		);

		loadedContent.value = processMammothOutput(result.value);
	} catch (err) {
		console.error('❌ DOCX 解析失败:', err);
	} finally {
		isLoading.value = false;
	}
}

// 把 mammoth 输出转成对象数组 (保持不变)
function processMammothOutput(markdown: string) {
	const CENTER_TAG = '[CENTER]';
	const result: { content: string; isCenter: boolean }[] = [];

	for (const line of markdown.split('\n')) {
		if (!line.trim()) continue;

		let content = line.trim();
		let isCenter = false;

		if (content.includes(CENTER_TAG)) {
			isCenter = true;
			content = content.replace(CENTER_TAG, '').trim();
		}

		// 清理 Markdown 特殊符号
		content = content
			.replace(/(\*\*|__|\*|_)/g, '')
			.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
			.replace(/^[#*-]\s*/, '')
			.replace(/\\./g, '.')
			.replace(/\s+/g, ' ')
			.trim();

		if (content) result.push({ content, isCenter });
	}

	return result;
}

// 使用自定义的 useApiFetch 和 useLazyAsyncData 获取章节内容
const { data: chapterData } = await useLazyAsyncData(
	// 确保 key 包含路由 ID，以便在路由变化时触发重新获取
	() => `chapter-content-${chapterId.value}`,
	async () => {
		const res = await useApiFetch<WorkContentRes>(
			`/api/web/work/chapter/${chapterId.value}/content`,
			{ method: 'GET' },
		);

		return res.data.value?.data || null;
	},
	{
		// 监听 chapterId 变化，触发重新获取
		watch: [chapterId],
		// 如果数据获取失败或为空，返回 null
		default: () => null,
	},
);

// 监听 useLazyAsyncData 的结果来更新本地 ref 状态
watch(
	chapterData,
	async (newVal) => {
		if (newVal) {
			// 填充状态
			docxUrl.value = newVal.novel?.url ?? '';
			rawChapters.value = newVal.chapters ?? [];
			// 在此处设置选中 ID，确保和路由 ID 一致
			selectedChapterId.value = chapterId.value;

			// 客户端专属逻辑：执行 DOCX 解析
			if (import.meta.client && docxUrl.value) {
				await parseDocx(docxUrl.value);
			}
		} else {
			// 处理错误或空数据情况，重置状态
			docxUrl.value = '';
			rawChapters.value = [];
			loadedContent.value = [];
		}
	},
	{ immediate: true },
); // 立即执行一次，确保 SSR 时填充数据

// 当用户切换章节时跳转
watch(selectedChapterId, (id) => {
	if (id && id !== chapterId.value) {
		navigateTo(`/novel/chapter/${id}`);
	}
});

// 排序章节（安全）
const chapters = computed(() => {
	return (rawChapters.value ?? []).slice();
});

// 当前章节相关计算属性
const currentChapter = computed(() => {
	return (
		chapters.value.find((c) => c.id === chapterId.value) ?? {
			id: 0,
			no: 0,
			title: '正在加载',
		}
	);
});

const currentIndex = computed(() =>
	currentChapter.value
		? chapters.value.findIndex((c) => c.id === currentChapter.value!.id)
		: -1,
);

const isFirstChapter = computed(() => currentIndex.value === 0);
const isLastChapter = computed(
	() => currentIndex.value === chapters.value.length - 1,
);

const prevChapter = computed(() =>
	isFirstChapter.value ? null : chapters.value[currentIndex.value - 1],
);

const nextChapter = computed(() =>
	isLastChapter.value ? null : chapters.value[currentIndex.value + 1],
);

// 跳转函数
function navigateToChapter(chapter: WorkDetailChapterItem) {
	navigateTo(`/novel/chapter/${chapter.id}`);
}

onMounted(() => {
	if (isNavbarVisible) isNavbarVisible.value = false;
});

onUnmounted(() => {
	if (isNavbarVisible) isNavbarVisible.value = true;
});

const { formattedTime } = useCurrentTime();

// 根据路由参数动态生成面包屑导航项
const items = computed(() => {
	const items = [
		{
			title: '小说',
			disabled: false,
			to: `/novel`,
		},
	];

	if (chapterId.value) {
		const currentChapter = chapters.value.find((c) => c.id === chapterId.value);
		if (currentChapter) {
			items.push({
				title: `${currentChapter.title}`,
				disabled: true,
				to: '',
			});
		}
	}

	return items;
});

watchEffect(() => {
	const chapter = currentChapter.value;

	useHead({
		title: chapter.id !== 0 ? `${chapter.title} - 小说阅读` : '小说阅读', // 如果仍在加载，显示一个通用的标题
	});
});
</script>

<style scoped>
.reader-setting {
	display: flex;
	justify-content: space-between;
}

.content-box p {
	text-indent: 2em;
}

.custom-breadcrumbs :deep(.v-breadcrumbs-item) {
	max-width: 400px;
	min-width: 50px;
	display: inline-block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.custom-breadcrumbs :deep(.v-breadcrumbs-item--link):hover {
	color: #a6a897;
}

/* 下划线动画 */
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

/* 处理 v-select 选中项的文本溢出 */
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
</style>
