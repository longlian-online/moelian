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

export function getNovelPosterLayout(input: {
	quoteLineCount: number;
	titleLineCount: number;
	authorLineCount: number;
}) {
	const quoteLineCount = Math.max(1, input.quoteLineCount);
	const titleLineCount = Math.max(1, input.titleLineCount);
	const authorLineCount = Math.max(1, input.authorLineCount);
	const quoteTop = 228;
	const quoteBottom = quoteTop + (quoteLineCount - 1) * 68;
	const metadataTop = quoteBottom + 46;
	const cardBottom = metadataTop + 82;
	const footerTop = cardBottom + 38;
	const footerHeight = Math.max(
		218,
		144 + (titleLineCount + authorLineCount) * 36,
	);
	const qrBlockHeight = 160;
	const metadataContentCenterY = 79.5 + 18 * (titleLineCount + authorLineCount);
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
		canvasHeight: footerTop + footerHeight + 52,
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
