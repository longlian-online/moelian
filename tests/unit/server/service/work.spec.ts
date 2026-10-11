import { describe, expect, test, vi } from 'vitest';
import {
	create,
	updateByID,
	listForWeb,
	detailForWeb,
} from '~/server/service/work';
import * as dao from '~/server/repository/work';
import type { Work } from '_db';

vi.mock('~/server/repository/work');
vi.mock('~/server/repository/chapter');

describe('作品', () => {
	describe('创建作品', () => {
		test('创建成功', async () => {
			vi.mocked(dao.count).mockResolvedValue(0);

			await create({
				biz_no: null,
				title: '',
				type_id: 0,
				content_type: 'Manga',
				author: '',
				description: '',
				status: 'Disable',
				serial_status: 'Serializing',
				length_type: 'Short',
				creator_id: 0,
			});
		});

		test('标题重复', async () => {
			vi.mocked(dao.count).mockResolvedValue(1);
			vi.mocked(dao.create).mockResolvedValue({} as Work);

			const p = create({
				biz_no: null,
				title: '',
				type_id: 0,
				content_type: 'Manga',
				author: '',
				description: '',
				status: 'Disable',
				serial_status: 'Serializing',
				length_type: 'Short',
				creator_id: 0,
			});
			await expect(p).rejects.toThrowError();
		});
	});

	describe('修改作品', () => {
		test('标题重复', async () => {
			vi.mocked(dao.count).mockResolvedValue(1);
			const p = updateByID(1, {
				serial_status: undefined,
				author: undefined,
				content_type: undefined,
				description: undefined,
				length_type: undefined,
				title: undefined,
				type_id: undefined,
			});

			await expect(p).rejects.toThrowError();
		});
		test('修改成功', async () => {
			vi.mocked(dao.count).mockResolvedValue(0);
			vi.mocked(dao.getWorkByID).mockResolvedValue({
				biz_no: '',
				title: '',
				type_id: 0,
				content_type: 'Manga',
				author: '',
				description: '',
				status: 'Disable',
				serial_status: 'Serializing',
				length_type: 'Short',
				creator_id: 0,
				id: 0,
				created_at: undefined,
				updated_at: undefined,
				deleted_at: undefined,
				cover_id: 0,
			});
			await updateByID(1, {
				serial_status: undefined,
				author: undefined,
				content_type: undefined,
				description: undefined,
				length_type: undefined,
				title: undefined,
				type_id: undefined,
			});
		});
	});
});

describe('作品列表空页', () => {
	test('超出最后一页时保留总数并跳过章节查询', async () => {
		vi.mocked(dao.listForWeb).mockResolvedValue({ list: [], total: 30 });
		const { listLastChapterByWorkIDs } =
			await import('~/server/repository/chapter');
		vi.mocked(listLastChapterByWorkIDs).mockClear();
		expect(
			await listForWeb({ type: 'Manga', page: { page: 3, limit: 24 } }),
		).toEqual({ list: [], total: 30 });
		expect(listLastChapterByWorkIDs).not.toHaveBeenCalled();
	});
});

describe('前台作品详情最新章节', () => {
	test.each([true, false])(
		'仅使用已发布章节查询（有已发布章节：%s）',
		async (hasPublished) => {
			const chapterDao = await import('~/server/repository/chapter');
			vi.mocked(dao.detailForWeb).mockResolvedValue({
				id: 10,
				biz_no: 'work',
				title: '作品',
				type_id: null,
				content_type: 'Novel',
				author: '作者',
				description: '',
				status: 'Enable',
				serial_status: 'Serializing',
				length_type: 'Short',
				creator_id: null,
				cover_id: null,
				created_at: new Date('2026-10-01'),
				updated_at: null,
				deleted_at: null,
				Cover: null,
				workTags: [],
			});
			const published = {
				id: 1,
				biz_no: 'chapter',
				work_id: 10,
				no: 1,
				priority: 10,
				title: '已发布章节',
				total_page: null,
				product_id: null,
				content_type: 'Novel' as const,
				status: 'Enable' as const,
				uploader_id: null,
				created_at: new Date('2026-10-01'),
				updated_at: null,
				deleted_at: null,
				content_id: null,
			};
			vi.mocked(chapterDao.getLastChapterByWorkID).mockResolvedValue({
				...published,
				id: 2,
				status: 'Disable',
			});
			vi.mocked(chapterDao.getLastChapterByWorkIDs).mockResolvedValue(
				hasPublished ? published : null,
			);
			vi.mocked(chapterDao.listChapterForIndex).mockResolvedValue(
				hasPublished ? [published] : [],
			);
			const result = await detailForWeb(10);
			expect(result.lastChapter).toEqual(hasPublished ? published : null);
			expect(result.chapters).toEqual(hasPublished ? [published] : []);
		},
	);
});
