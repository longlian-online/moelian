<template>
	<div :key="String($route.params.id)">
		<MobileNovelReader
			v-if="isMobile"
			:work-title="chapterData?.work?.title"
			:work-id="chapterData?.work?.id"
			@open-theme-setting="isChangeTheme = true"
			@share-work="openWorkShare"
			v-model:selected-chapter-id="selectedChapterId"
			:loaded-content="loadedContent"
			:loading="isLoading"
			:load-failed="loadFailed"
			@retry="retryContent"
			:chapters="chapters"
			:is-first-chapter="isFirstChapter"
			:is-last-chapter="isLastChapter"
			:prev-chapter="prevChapter"
			:next-chapter="nextChapter"
			:current-chapter="currentChapter"
			:formatted-time="formattedTime"
			:navigate-to-chapter="navigateToChapter"
			@share-selection="openSharePoster"
		/>

		<DesktopNovelReader
			v-else
			v-model:selected-chapter-id="selectedChapterId"
			:loaded-content="loadedContent"
			:loading="isLoading"
			:load-failed="loadFailed"
			@retry="retryContent"
			:chapters="chapters"
			:is-first-chapter="isFirstChapter"
			:is-last-chapter="isLastChapter"
			:prev-chapter="prevChapter"
			:next-chapter="nextChapter"
			:current-chapter="currentChapter"
			:breadcrumb-items="items"
			:navigate-to-chapter="navigateToChapter"
			@open-theme-setting="isChangeTheme = true"
			@share-selection="openSharePoster"
		/>

		<v-dialog v-model="isChangeTheme" max-width="600">
			<ThemeSetting />
		</v-dialog>

		<WorkShareDialog
			v-model="isWorkShareDialog"
			:work="workShareDetail"
			:share-url="workShareUrl"
		/>

		<v-dialog v-model="isShareDialog" max-width="560" scrollable>
			<NovelQuoteShareCard
				@close="isShareDialog = false"
				v-if="shareData"
				ref="quoteShareCardRef"
				v-bind="shareData"
			/>
		</v-dialog>
	</div>
</template>

<script setup lang="ts">
import { formatChapterTitle } from '~/utils/chapterSeo';
import { useCurrentTime } from '@/composables/useCurrentTime';
import mammoth from 'mammoth';
import type {
	WorkContentRes,
	WorkDetailRes,
	WorkDetailChapterItem,
} from '~/shared/dto/web/work';
import { createNovelShareData, type NovelShareData } from '~/utils/novelShare';

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
const isLoading = ref(true);
const loadFailed = ref(false);
const selectedChapterId = ref<number | null>(null);
const isNavbarVisible = inject('isNavbarVisible') as Ref<boolean>;
const { isMobile } = useDevice();
const isChangeTheme = ref(false);
const isShareDialog = ref(false);
const isWorkShareDialog = ref(false);
const workShareDetail = ref<WorkDetailRes | null>(null);
const workShareUrl = ref('');
const { $tip } = useNuxtApp();
let loadingWorkShare = false;
async function openWorkShare() {
	const work = chapterData.value?.work;
	if (!work || loadingWorkShare) return;
	loadingWorkShare = true;
	try {
		const response = await $fetch<{ code: number; data?: WorkDetailRes }>(
			`/api/web/work/${work.id}`,
		);
		if (response.code !== 0 || !response.data) throw new Error('分享加载失败');
		workShareDetail.value = response.data;
		workShareUrl.value = `${window.location.origin}/novel/${work.id}`;
		isWorkShareDialog.value = true;
	} catch {
		$tip('作品分享加载失败，请重试', { color: 'error' });
	} finally {
		loadingWorkShare = false;
	}
}

const shareData = ref<NovelShareData | null>(null);
const quoteShareCardRef = ref<InstanceType<
	typeof import('~/components/novel/NovelQuoteShareCard.vue').default
> | null>(null);
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
	loadFailed.value = false;
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
		if (!loadedContent.value.length) throw new Error('正文内容为空');
	} catch (err) {
		loadFailed.value = true;
		console.error('❌ DOCX 解析失败:', err);
	} finally {
		isLoading.value = false;
	}
}

// 解析新的 urlMap 格式
async function parseUrlMap(urlMap: Record<string, string>) {
	isLoading.value = true;
	loadFailed.value = false;
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
		if (!loadedContent.value.length) throw new Error('正文内容为空');
	} catch (err) {
		loadFailed.value = true;
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

const { data: chapterData, refresh: refreshChapter } = await useAsyncData(
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
				} else {
					loadFailed.value = true;
					isLoading.value = false;
				}
			}
		} else {
			docxUrl.value = '';
			urlMap.value = null;
			rawChapters.value = [];
			loadedContent.value = [];
			loadFailed.value = true;
			isLoading.value = false;
		}
	},
	{ immediate: true },
);

async function retryContent() {
	if (isLoading.value) return;
	if (urlMap.value) await parseUrlMap(urlMap.value);
	else if (docxUrl.value) await parseDocx(docxUrl.value);
	else {
		isLoading.value = true;
		loadFailed.value = false;
		try {
			await refreshChapter();
		} finally {
			if (!docxUrl.value && !urlMap.value) {
				isLoading.value = false;
				loadFailed.value = true;
			}
		}
	}
}

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

const getNovelTopInset = () => {
	const bar = document.querySelector<HTMLElement>('[data-novel-top-bar]');
	return bar ? Math.max(0, bar.getBoundingClientRect().bottom) : 0;
};

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
		blocks.find(
			(element) => element.getBoundingClientRect().bottom > getNovelTopInset(),
		) ?? blocks.at(-1);
	const anchorIndex = Number(anchor?.dataset.readingBlock ?? 0);
	const rect = anchor?.getBoundingClientRect();
	const offsetRatio = rect
		? Math.min(
				1,
				Math.max(0, (getNovelTopInset() - rect.top) / Math.max(1, rect.height)),
			)
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
			anchor.offsetHeight * initialNovelPosition.offsetRatio -
			getNovelTopInset();
		window.scrollTo({
			top:
				initialNovelPosition.anchorIndex === 0 &&
				initialNovelPosition.offsetRatio === 0
					? 0
					: Math.max(0, top),
			behavior: 'auto',
		});
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

function openSharePoster(quote: string) {
	const work = chapterData.value?.work;
	const chapter = currentChapter.value;
	if (!work || chapter.id === 0 || !import.meta.client) return;

	shareData.value = createNovelShareData({
		quote,
		title: work.title,
		author: work.author,
		chapterNo: chapter.no,
		chapterTitle: chapter.title,
		shareUrl: `${window.location.origin}${route.fullPath}`,
	});
	isShareDialog.value = true;
}

watch(isShareDialog, async (visible) => {
	if (!visible || !shareData.value) return;
	await nextTick();
	await quoteShareCardRef.value?.generateCard();
});

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

const chapterSeoTitle = computed(() => {
	const chapter = currentChapter.value;
	const work = chapterData.value?.work;
	if (!work || chapter.id === 0) return 'moelian';
	return `${formatChapterTitle(chapter.title, chapter.no, 'novel')} - ${work.title}`;
});
const chapterSeoDescription = computed(() => {
	const work = chapterData.value?.work;
	return work ? `${chapterSeoTitle.value}。作者：${work.author}。` : 'moelian';
});
useSeoMeta({
	title: () => chapterSeoTitle.value,
	description: () => chapterSeoDescription.value,
	ogTitle: () => chapterSeoTitle.value,
	ogDescription: () => chapterSeoDescription.value,
	twitterTitle: () => chapterSeoTitle.value,
	twitterDescription: () => chapterSeoDescription.value,
});
</script>
