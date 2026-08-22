<template>
	<div :key="String($route.params.id)">
		<MobileNovelReader
			v-if="isMobile"
			v-model:selected-chapter-id="selectedChapterId"
			:loaded-content="loadedContent"
			:chapters="chapters"
			:is-first-chapter="isFirstChapter"
			:is-last-chapter="isLastChapter"
			:prev-chapter="prevChapter"
			:next-chapter="nextChapter"
			:current-chapter="currentChapter"
			:formatted-time="formattedTime"
			:navigate-to-chapter="navigateToChapter"
		/>

		<DesktopNovelReader
			v-else
			v-model:selected-chapter-id="selectedChapterId"
			:loaded-content="loadedContent"
			:chapters="chapters"
			:is-first-chapter="isFirstChapter"
			:is-last-chapter="isLastChapter"
			:prev-chapter="prevChapter"
			:next-chapter="nextChapter"
			:current-chapter="currentChapter"
			:breadcrumb-items="items"
			:navigate-to-chapter="navigateToChapter"
			@open-theme-setting="isChangeTheme = true"
		/>

		<v-dialog v-model="isChangeTheme" max-width="600">
			<ThemeSetting />
		</v-dialog>
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
const urlMap = ref<Record<string, string> | null>(null);
const rawChapters = ref<WorkDetailChapterItem[]>([]);
const loadedContent = ref<
	{
		content: string;
		isCenter: boolean;
		type?: 'text' | 'img';
		label?: string;
	}[]
>([]);
const isLoading = ref(false);
const selectedChapterId = ref<number | null>(null);
const isNavbarVisible = inject('isNavbarVisible') as Ref<boolean>;
const { isMobile } = useDevice();
const isChangeTheme = ref(false);
const { getProgress, saveNovelProgress } = useReadingProgress();
const savedProgress = getProgress('novel', chapterId.value);
const initialNovelPosition =
	savedProgress?.position.kind === 'novel' ? savedProgress.position : null;
const isRestoringProgress = ref(Boolean(initialNovelPosition));
let progressSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingNovelPosition = initialNovelPosition ?? {
	kind: 'novel' as const,
	percentage: 0,
	anchorIndex: 0,
	offsetRatio: 0,
};

async function parseDocx(url: string) {
	isLoading.value = true;
	loadedContent.value = [];

	try {
		// 由于 mammoth 和 fetch 是客户端 API，SSR 时不会运行
		const response = await fetch(url, {
			headers: {
				'Cache-Control': 'public, max-age=3600',
				Pragma: 'public',
			},
		});
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

// 解析新的 urlMap 格式
async function parseUrlMap(urlMap: Record<string, string>) {
	isLoading.value = true;
	loadedContent.value = [];

	try {
		const indexUrl = urlMap.index;
		if (!indexUrl) throw new Error('未找到 index.json 地址');

		const response = await fetch(indexUrl);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

		const indexData: Array<{
			type: 'text' | 'img';
			content?: string;
			url?: string;
		}> = await response.json();

		let imageCounter = 1;
		loadedContent.value = indexData.map((item) => {
			if (item.type === 'img') {
				// 尝试从 urlMap 中获取真实的图片地址
				// 兼容处理：有些 index.json 可能直接存了完整 url，有些存的是 key
				let realUrl = '';
				if (item.url) {
					// 1. 尝试作为 key 从 urlMap 获取 (例如 "placeholder_1")
					realUrl = urlMap[item.url] || '';

					// 2. 如果没找到，且 item.url 本身就是 http 开头的，则直接使用
					if (!realUrl && item.url.startsWith('http')) {
						realUrl = item.url;
					}
				}

				const label = `插画1-${imageCounter++}`;

				return {
					content: realUrl,
					isCenter: true,
					type: 'img' as const,
					label: label,
				};
			}
			return {
				content: item.content || '',
				isCenter: false,
				type: 'text' as const,
			};
		});
	} catch (err) {
		console.error('❌ urlMap 解析失败:', err);
	} finally {
		isLoading.value = false;
	}
}

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

const { data: chapterData } = await useLazyAsyncData(
	() => `chapter-content-${chapterId.value}`,
	async () => {
		const res = await useApiFetch<WorkContentRes>(
			`/api/web/work/chapter/${chapterId.value}/content`,
			{ method: 'GET' },
		);

		return res.data.value?.data || null;
	},
	{
		watch: [chapterId],
		default: () => null,
	},
);

watch(
	chapterData,
	async (newVal) => {
		if (newVal) {
			docxUrl.value = newVal.novel?.url ?? '';
			urlMap.value = newVal.novel?.urlMap ?? null;
			rawChapters.value = newVal.chapters ?? [];
			selectedChapterId.value = chapterId.value;

			if (import.meta.client) {
				if (urlMap.value) {
					await parseUrlMap(urlMap.value);
				} else if (docxUrl.value) {
					await parseDocx(docxUrl.value);
				}
			}
		} else {
			docxUrl.value = '';
			urlMap.value = null;
			rawChapters.value = [];
			loadedContent.value = [];
		}
	},
	{ immediate: true },
);

watch(selectedChapterId, (id) => {
	if (id && id !== chapterId.value) {
		navigateTo(`/novel/chapter/${id}`);
	}
});

const chapters = computed(() => {
	return (rawChapters.value ?? []).slice();
});

const currentChapter = computed(() => {
	return (
		chapters.value.find((c) => c.id === chapterId.value) ?? {
			id: 0,
			no: 0,
			title: '正在加载',
		}
	);
});

const measureNovelPosition = () => {
	const maxScroll = Math.max(
		0,
		document.documentElement.scrollHeight - window.innerHeight,
	);
	const percentage = maxScroll > 0 ? window.scrollY / maxScroll : 0;
	const blocks = Array.from(
		document.querySelectorAll<HTMLElement>('[data-reading-block]'),
	);
	const anchor =
		blocks.find((element) => element.getBoundingClientRect().bottom > 0) ??
		blocks.at(-1);
	const anchorIndex = Number(anchor?.dataset.readingBlock ?? 0);
	const rect = anchor?.getBoundingClientRect();
	const offsetRatio = rect
		? Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)))
		: 0;

	pendingNovelPosition = {
		kind: 'novel',
		percentage,
		anchorIndex,
		offsetRatio,
	};
};

const persistNovelProgress = () => {
	if (currentChapter.value.id === 0) return;
	saveNovelProgress({
		chapterId: chapterId.value,
		chapterNo: currentChapter.value.no,
		percentage: pendingNovelPosition.percentage,
		anchorIndex: pendingNovelPosition.anchorIndex,
		offsetRatio: pendingNovelPosition.offsetRatio,
	});
};

const handleNovelScroll = () => {
	if (isRestoringProgress.value) return;
	measureNovelPosition();
	if (progressSaveTimer) clearTimeout(progressSaveTimer);
	progressSaveTimer = setTimeout(persistNovelProgress, 400);
};

const restoreNovelProgress = () => {
	if (!initialNovelPosition || loadedContent.value.length === 0) {
		isRestoringProgress.value = false;
		return;
	}

	const anchor = document.querySelector<HTMLElement>(
		`[data-reading-block="${initialNovelPosition.anchorIndex}"]`,
	);
	if (anchor) {
		const top =
			window.scrollY +
			anchor.getBoundingClientRect().top +
			anchor.offsetHeight * initialNovelPosition.offsetRatio;
		window.scrollTo({ top, behavior: 'auto' });
	} else {
		const maxScroll = Math.max(
			0,
			document.documentElement.scrollHeight - window.innerHeight,
		);
		window.scrollTo({
			top: maxScroll * initialNovelPosition.percentage,
			behavior: 'auto',
		});
	}

	requestAnimationFrame(() => {
		isRestoringProgress.value = false;
	});
};

watch(
	() => loadedContent.value.length,
	async (length) => {
		if (!length || !initialNovelPosition) return;
		await nextTick();
		restoreNovelProgress();
		setTimeout(restoreNovelProgress, 500);
	},
);

const handleNovelPageHide = () => {
	if (!isRestoringProgress.value) measureNovelPosition();
	persistNovelProgress();
};

onMounted(() => {
	window.addEventListener('scroll', handleNovelScroll, { passive: true });
	window.addEventListener('pagehide', handleNovelPageHide);
});

onBeforeUnmount(() => {
	window.removeEventListener('scroll', handleNovelScroll);
	window.removeEventListener('pagehide', handleNovelPageHide);
	if (progressSaveTimer) clearTimeout(progressSaveTimer);
	handleNovelPageHide();
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

const prevChapter = computed(() => {
	if (isFirstChapter.value) return null;
	return chapters.value[currentIndex.value - 1] ?? null;
});

const nextChapter = computed(() => {
	if (isLastChapter.value) return null;
	return chapters.value[currentIndex.value + 1] ?? null;
});

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

const items = computed(() => {
	const breadcrumbItems = [
		{
			title: '小说',
			disabled: false,
			to: `/novel`,
		},
	];

	if (chapterId.value) {
		const current = chapters.value.find((c) => c.id === chapterId.value);
		if (current) {
			breadcrumbItems.push({
				title: `${current.title}`,
				disabled: true,
				to: '',
			});
		}
	}

	return breadcrumbItems;
});

watchEffect(() => {
	const chapter = currentChapter.value;

	useHead({
		title: chapter.id !== 0 ? `${chapter.title} - 小说阅读` : '小说阅读',
	});
});
</script>
