export type ReadingContentType = 'manga' | 'novel';

export type MangaReadingPosition = {
	kind: 'manga';
	pageIndex: number;
	totalPages: number;
};

export type NovelReadingPosition = {
	kind: 'novel';
	percentage: number;
	anchorIndex: number;
	offsetRatio: number;
};

export type ReadingPosition = MangaReadingPosition | NovelReadingPosition;

export type ReadingProgress = {
	version: 1;
	contentType: ReadingContentType;
	chapterId: number;
	chapterNo: number;
	updatedAt: number;
	position: ReadingPosition;
};

export type ReadingProgressStore = {
	version: 1;
	records: Record<string, ReadingProgress>;
};
