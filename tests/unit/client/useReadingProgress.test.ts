// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useReadingProgress } from '~/composables/useReadingProgress';

describe('useReadingProgress', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('保存并恢复漫画物理页码', () => {
		const { getProgress, saveMangaProgress } = useReadingProgress();

		saveMangaProgress({
			chapterId: 12,
			chapterNo: 3,
			pageIndex: 8,
			totalPages: 20,
		});

		const progress = getProgress('manga', 12);
		expect(progress?.chapterNo).toBe(3);
		expect(progress?.position).toEqual({
			kind: 'manga',
			pageIndex: 8,
			totalPages: 20,
		});
	});

	it('将越界进度限制在有效范围内', () => {
		const { getProgress, saveMangaProgress, saveNovelProgress } =
			useReadingProgress();

		saveMangaProgress({
			chapterId: 13,
			chapterNo: 4,
			pageIndex: 99,
			totalPages: 10,
		});
		saveNovelProgress({
			chapterId: 14,
			chapterNo: 5,
			percentage: 1.5,
			anchorIndex: 7.8,
			offsetRatio: -1,
		});

		expect(getProgress('manga', 13)?.position).toMatchObject({ pageIndex: 9 });
		expect(getProgress('novel', 14)?.position).toMatchObject({
			percentage: 1,
			anchorIndex: 7,
			offsetRatio: 0,
		});
	});

	it('从作品章节列表中选择最近更新的记录', () => {
		const { findLatestProgress, saveNovelProgress } = useReadingProgress();
		const dateSpy = vi.spyOn(Date, 'now');

		dateSpy.mockReturnValueOnce(100);
		saveNovelProgress({
			chapterId: 21,
			chapterNo: 1,
			percentage: 0.8,
			anchorIndex: 4,
			offsetRatio: 0.2,
		});
		dateSpy.mockReturnValueOnce(200);
		saveNovelProgress({
			chapterId: 22,
			chapterNo: 2,
			percentage: 0.1,
			anchorIndex: 1,
			offsetRatio: 0,
		});

		expect(findLatestProgress('novel', [21, 22])?.chapterId).toBe(22);
		dateSpy.mockRestore();
	});

	it('忽略损坏的本地数据', () => {
		localStorage.setItem('moelian:reading-progress:v1', '{broken');
		const { getProgress } = useReadingProgress();
		expect(getProgress('manga', 1)).toBeNull();
	});
});
