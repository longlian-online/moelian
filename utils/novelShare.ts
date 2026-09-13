export function normalizeNovelQuote(text: string, maxLength = 300) {
	const normalized = text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.join('\n');

	if (normalized.length <= maxLength) return normalized;
	return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function formatNovelChapterLabel(no: number, title: string) {
	return title ? `第 ${no} 章 · ${title}` : `第 ${no} 章`;
}

export const NOVEL_POSTER_METRICS = {
	width: 900,
	cardLeft: 54,
	cardTop: 48,
	cardWidth: 792,
	cardRadius: 28,
	quoteTop: 180,
	quoteFont: '600 42px "Noto Serif SC", "Songti SC", serif',
	quoteMaxWidth: 660,
	quoteLineHeight: 68,
	quoteToMetadataGap: 32,
	metadataHeight: 64,
	detailFont: '700 24px "Noto Serif SC", "Songti SC", serif',
	detailMaxWidth: 430,
	detailLineHeight: 36,
	footerMinHeight: 204,
	footerBaseHeight: 150,
	footerBottomMargin: 52,
	qrSize: 132,
	qrBlockHeight: 160,
} as const;

export function getNovelPosterLayout(input: {
	quoteLineCount: number;
	titleLineCount: number;
	authorLineCount: number;
}) {
	const quoteLineCount = Math.max(1, input.quoteLineCount);
	const titleLineCount = Math.max(1, input.titleLineCount);
	const authorLineCount = Math.max(1, input.authorLineCount);
	const quoteTop = NOVEL_POSTER_METRICS.quoteTop;
	const quoteBottom =
		quoteTop + (quoteLineCount - 1) * NOVEL_POSTER_METRICS.quoteLineHeight;
	const metadataTop = quoteBottom + NOVEL_POSTER_METRICS.quoteToMetadataGap;
	const cardBottom = metadataTop + NOVEL_POSTER_METRICS.metadataHeight;
	const footerTop = cardBottom;
	const footerHeight = Math.max(
		NOVEL_POSTER_METRICS.footerMinHeight,
		NOVEL_POSTER_METRICS.footerBaseHeight +
			(titleLineCount + authorLineCount) *
				NOVEL_POSTER_METRICS.detailLineHeight,
	);
	const qrBlockHeight = NOVEL_POSTER_METRICS.qrBlockHeight;
	const metadataContentCenterY =
		79.5 +
		(NOVEL_POSTER_METRICS.detailLineHeight / 2) *
			(titleLineCount + authorLineCount);
	const qrTop = footerTop + metadataContentCenterY - qrBlockHeight / 2;

	return {
		quoteTop,
		metadataTop,
		cardBottom,
		footerTop,
		footerHeight,
		metadataContentCenterY,
		qrTop,
		qrBlockHeight,
		canvasHeight:
			footerTop + footerHeight + NOVEL_POSTER_METRICS.footerBottomMargin,
	};
}

export type NovelShareData = {
	quote: string;
	title: string;
	author: string;
	chapterLabel: string;
	shareUrl: string;
};

export function createNovelShareData(input: {
	quote: string;
	title: string;
	author: string;
	chapterNo: number;
	chapterTitle: string;
	shareUrl: string;
}): NovelShareData {
	return {
		quote: normalizeNovelQuote(input.quote),
		title: input.title,
		author: input.author,
		chapterLabel: formatNovelChapterLabel(input.chapterNo, input.chapterTitle),
		shareUrl: input.shareUrl,
	};
}
