import { describe, expect, it } from 'vitest';
import {
	createNovelShareData,
	formatNovelChapterLabel,
	getNovelPosterLayout,
	normalizeNovelQuote,
} from '~/utils/novelShare';

describe('小说选段分享', () => {
	it('移除选中文本中的空白行并保留正常换行', () => {
		expect(
			normalizeNovelQuote('  第一段 内容  \n \t\n\n  第二段\t内容  '),
		).toBe('第一段 内容\n第二段\t内容');
	});

	it('超过海报容量时保留完整前缀并用省略号截断', () => {
		expect(normalizeNovelQuote('春'.repeat(11), 10)).toBe('春'.repeat(9) + '…');
	});

	it('将章节序号和标题格式化为海报元信息', () => {
		expect(formatNovelChapterLabel(12, '雨夜来信')).toBe('第 12 章 · 雨夜来信');
	});

	it('创建海报数据时清理空白行并保留引用的有效换行', () => {
		expect(
			createNovelShareData({
				quote: '  这是一段选中的话  \n\n  这是下一段  ',
				title: '雨季来信',
				author: '青鸟',
				chapterNo: 12,
				chapterTitle: '雨夜来信',
				shareUrl: 'https://moelian.example/novel/chapter/8',
			}),
		).toEqual({
			quote: '这是一段选中的话\n这是下一段',
			title: '雨季来信',
			author: '青鸟',
			chapterLabel: '第 12 章 · 雨夜来信',
			shareUrl: 'https://moelian.example/novel/chapter/8',
		});
	});

	it('海报高度会随引用和作品标题的换行数增加，二维码对齐左侧信息区', () => {
		const compact = getNovelPosterLayout({
			quoteLineCount: 1,
			titleLineCount: 1,
			authorLineCount: 1,
		});
		const longQuote = getNovelPosterLayout({
			quoteLineCount: 5,
			titleLineCount: 1,
			authorLineCount: 1,
		});
		const longTitle = getNovelPosterLayout({
			quoteLineCount: 1,
			titleLineCount: 4,
			authorLineCount: 1,
		});
		const longAuthor = getNovelPosterLayout({
			quoteLineCount: 1,
			titleLineCount: 1,
			authorLineCount: 4,
		});

		expect(longQuote.canvasHeight).toBeGreaterThan(compact.canvasHeight);
		expect(longTitle.canvasHeight).toBeGreaterThan(compact.canvasHeight);
		expect(longAuthor.canvasHeight).toBeGreaterThan(compact.canvasHeight);
		expect(longAuthor.qrTop).toBeGreaterThan(compact.qrTop);
		expect(compact.quoteTop).toBeLessThan(300);
		expect(compact.qrTop + compact.qrBlockHeight / 2).toBe(
			compact.footerTop + compact.metadataContentCenterY,
		);
	});
});
