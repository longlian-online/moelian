import type {
	MangaReadingPosition,
	NovelReadingPosition,
	ReadingContentType,
	ReadingProgress,
	ReadingProgressStore,
} from '~/shared/types/reading-progress';

const STORAGE_KEY = 'moelian:reading-progress:v1';
const STORE_VERSION = 1 as const;
const MAX_RECORDS = 200;

const emptyStore = (): ReadingProgressStore => ({
	version: STORE_VERSION,
	records: {},
});

const recordKey = (contentType: ReadingContentType, chapterId: number) =>
	`${contentType}:${chapterId}`;

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

const isFiniteNonNegative = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isReadingProgress = (value: unknown): value is ReadingProgress => {
	if (!value || typeof value !== 'object') return false;
	const progress = value as Partial<ReadingProgress>;
	if (
		progress.version !== STORE_VERSION ||
		(progress.contentType !== 'manga' && progress.contentType !== 'novel') ||
		!isFiniteNonNegative(progress.chapterId) ||
		!isFiniteNonNegative(progress.chapterNo) ||
		!isFiniteNonNegative(progress.updatedAt) ||
		!progress.position
	) {
		return false;
	}

	if (progress.position.kind === 'manga') {
		return (
			progress.contentType === 'manga' &&
			isFiniteNonNegative(progress.position.pageIndex) &&
			isFiniteNonNegative(progress.position.totalPages)
		);
	}

	return (
		progress.position.kind === 'novel' &&
		progress.contentType === 'novel' &&
		isFiniteNonNegative(progress.position.percentage) &&
		isFiniteNonNegative(progress.position.anchorIndex) &&
		isFiniteNonNegative(progress.position.offsetRatio)
	);
};

const readStore = (): ReadingProgressStore => {
	if (!import.meta.client) return emptyStore();

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return emptyStore();
		const parsed = JSON.parse(raw) as Partial<ReadingProgressStore>;
		if (parsed.version !== STORE_VERSION || !parsed.records)
			return emptyStore();

		const records = Object.fromEntries(
			Object.entries(parsed.records).filter(([, value]) =>
				isReadingProgress(value),
			),
		);
		return { version: STORE_VERSION, records };
	} catch {
		return emptyStore();
	}
};

const writeStore = (store: ReadingProgressStore) => {
	if (!import.meta.client) return;

	const records = Object.fromEntries(
		Object.entries(store.records)
			.sort(([, left], [, right]) => right.updatedAt - left.updatedAt)
			.slice(0, MAX_RECORDS),
	);

	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ version: STORE_VERSION, records }),
		);
	} catch {
		// Storage can be disabled or full. Reading must continue without failing.
	}
};

export const useReadingProgress = () => {
	const getProgress = (
		contentType: ReadingContentType,
		chapterId: number,
	): ReadingProgress | null =>
		readStore().records[recordKey(contentType, chapterId)] ?? null;

	const findLatestProgress = (
		contentType: ReadingContentType,
		chapterIds: number[],
	): ReadingProgress | null => {
		const store = readStore();
		return (
			chapterIds
				.map((chapterId) => store.records[recordKey(contentType, chapterId)])
				.filter((progress): progress is ReadingProgress => Boolean(progress))
				.sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null
		);
	};

	const saveProgress = (progress: ReadingProgress) => {
		const store = readStore();
		store.records[recordKey(progress.contentType, progress.chapterId)] =
			progress;
		writeStore(store);
	};

	const saveMangaProgress = (input: {
		chapterId: number;
		chapterNo: number;
		pageIndex: number;
		totalPages: number;
	}) => {
		const totalPages = Math.max(0, Math.floor(input.totalPages));
		const position: MangaReadingPosition = {
			kind: 'manga',
			pageIndex: clamp(
				Math.floor(input.pageIndex),
				0,
				Math.max(0, totalPages - 1),
			),
			totalPages,
		};
		saveProgress({
			version: STORE_VERSION,
			contentType: 'manga',
			chapterId: input.chapterId,
			chapterNo: input.chapterNo,
			updatedAt: Date.now(),
			position,
		});
	};

	const saveNovelProgress = (input: {
		chapterId: number;
		chapterNo: number;
		percentage: number;
		anchorIndex: number;
		offsetRatio: number;
	}) => {
		const position: NovelReadingPosition = {
			kind: 'novel',
			percentage: clamp(input.percentage, 0, 1),
			anchorIndex: Math.max(0, Math.floor(input.anchorIndex)),
			offsetRatio: clamp(input.offsetRatio, 0, 1),
		};
		saveProgress({
			version: STORE_VERSION,
			contentType: 'novel',
			chapterId: input.chapterId,
			chapterNo: input.chapterNo,
			updatedAt: Date.now(),
			position,
		});
	};

	return {
		getProgress,
		findLatestProgress,
		saveMangaProgress,
		saveNovelProgress,
	};
};
