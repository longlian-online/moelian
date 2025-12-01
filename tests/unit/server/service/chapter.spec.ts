import { describe, expect, test, vi } from 'vitest';
import {
	create,
	updateByID,
	deleteById,
	updateStatus,
	createChapterFormConsumer,
	updateChapterFormConsumer,
	deleteChapterFromConsumer,
	getContentByID,
	mangaExtractHandler,
} from '~/server/service/chapter';
import * as dao from '~/server/repository/chapter';
import * as workRepo from '~/server/repository/work';
import * as resourceRepo from '~/server/repository/resource';
import { getDirAllObjectURLs } from '~/server/service/cos';
import { getResourceURLByID } from '~/server/service/resource';
import logger from '~/server/lib/winston';
import type { Chapter, Resource, Work } from '_db';
import { ContentType, ResourceType } from '~/server/lib/prisma';
import { Status } from '_db';
import { uuidv7 } from 'uuidv7';

vi.mock('~/server/repository/chapter');
vi.mock('~/server/repository/work');
vi.mock('~/server/repository/resource');
vi.mock('~/server/service/cos');
vi.mock('~/server/service/resource');
vi.mock('~/server/lib/winston');
vi.mock('uuidv7');

describe('章节服务', () => {
	describe('创建章节', () => {
		test('标题不重复，创建成功', async () => {
			vi.mocked(dao.getWorkChapterByTitle).mockResolvedValue(null);

			await create({
				biz_no: uuidv7(),
				title: '新章节',
				content_type: 'Manga',
				work_id: 1,
			});

			expect(dao.create).toHaveBeenCalled();
		});

		test('标题重复，创建失败', async () => {
			vi.mocked(dao.count).mockResolvedValue(1);
			vi.mocked(dao.getWorkChapterByTitle).mockResolvedValue({} as Chapter);
			vi.mocked(dao.create).mockResolvedValue({} as Chapter);

			const p = create({
				biz_no: uuidv7(),
				title: '重复章节',
				content_type: 'Novel',
				work_id: 1,
			});

			await expect(p).rejects.toThrowError();
		});
	});

	describe('更新章节', () => {
		test('章节不存在，更新失败', async () => {
			vi.mocked(dao.getById).mockResolvedValue(null);

			const p = updateByID(1, {
				title: '更新标题',
			});

			await expect(p).rejects.toThrowError();
			expect(dao.update).not.toHaveBeenCalled();
		});

		test('修改了标题，标题重复，更新失败', async () => {
			vi.mocked(dao.getById).mockResolvedValue({
				title: '修改后标题',
			} as Chapter);
			vi.mocked(dao.count).mockResolvedValue(2);

			const p = updateByID(1, {
				title: '重复标题',
			});

			await expect(p).rejects.toThrowError();
			expect(dao.update).not.toHaveBeenCalled();
		});
		test('未修改标题，更新成功', async () => {
			vi.mocked(dao.getById).mockResolvedValue({
				title: '重复标题',
			} as Chapter);
			vi.mocked(dao.count).mockResolvedValue(1);

			await updateByID(1, {
				title: '重复标题',
			});

			expect(dao.update).toHaveBeenCalled();
		});

		test('更新成功', async () => {
			vi.mocked(dao.getById).mockResolvedValue({} as Chapter);
			vi.mocked(dao.count).mockResolvedValue(0);

			await updateByID(1, {
				title: '新标题',
			});
		});
	});

	describe('删除章节', () => {
		test('章节不存在，删除失败', async () => {
			vi.mocked(dao.getById).mockResolvedValue(null);

			const p = deleteById(1);

			await expect(p).rejects.toThrowError();
			expect(dao.deleteChapter).not.toHaveBeenCalled();
		});
	});

	describe('更新状态', () => {
		test('章节不存在，更新状态失败', async () => {
			vi.mocked(dao.getById).mockResolvedValue(null);

			const p = updateStatus(1, Status.Enable);

			await expect(p).rejects.toThrowError();
		});

		test('启用章节，漫画资源未准备，更新失败', async () => {
			vi.mocked(dao.getById).mockResolvedValue({
				product_id: null,
				content_type: ContentType.Manga,
			} as Chapter);

			const p = updateStatus(1, Status.Enable);

			await expect(p).rejects.toThrowError();
		});

		test('启用章节，小说内容未准备，更新失败', async () => {
			vi.mocked(dao.getById).mockResolvedValue({
				content_id: null,
				content_type: ContentType.Novel,
			} as Chapter);

			const p = updateStatus(1, Status.Enable);

			await expect(p).rejects.toThrowError();
		});

		test('更新状态成功', async () => {
			vi.mocked(dao.getById).mockResolvedValue({
				product_id: 1,
				content_id: 1,
				content_type: ContentType.Manga,
			} as Chapter);

			await updateStatus(1, Status.Enable);
		});
	});

	describe('异步创建章节', () => {
		test('作品不存在，创建失败', async () => {
			vi.mocked(workRepo.getWorkByBizNo).mockResolvedValue(null);

			const p = createChapterFormConsumer({
				biz_no: 'test',
				title: 'title',
				content_type: 1,
				work_biz_no: '',
			});

			await expect(p).rejects.toThrowError();
		});

		test('标题重复，警告并返回', async () => {
			vi.mocked(workRepo.getWorkByBizNo).mockResolvedValue({ id: 1 } as Work);
			vi.mocked(dao.count).mockResolvedValue(1);

			await createChapterFormConsumer({
				biz_no: 'test',
				title: 'title',
				content_type: 1,
				work_biz_no: '',
			});
		});
	});

	describe('异步更新章节', () => {
		test('章节不存在，更新失败', async () => {
			vi.mocked(dao.getChapterByBizID).mockResolvedValue(null);

			const p = updateChapterFormConsumer({
				biz_no: 'test',
				title: 'title',
				content_type: 1,
			});

			await expect(p).rejects.toThrowError();
		});

		test('标题重复，警告并返回', async () => {
			vi.mocked(dao.getChapterByBizID).mockResolvedValue({
				title: 'old',
				work_id: 1,
			} as Chapter);
			vi.mocked(dao.count).mockResolvedValue(1);

			await updateChapterFormConsumer({
				biz_no: 'test',
				title: 'title',
				content_type: 1,
			});

			expect(logger.warn).toHaveBeenCalled();
		});
	});

	describe('异步删除章节', () => {
		test('章节不存在，删除失败', async () => {
			vi.mocked(dao.getChapterByBizID).mockResolvedValue(null);

			const p = deleteChapterFromConsumer({
				biz_no: 'test',
			});

			await expect(p).rejects.toThrowError();
			expect(dao.deleteChapter).not.toHaveBeenCalled();
		});
	});

	describe('漫画提取处理器', () => {
		test('章节不存在，处理失败', async () => {
			vi.mocked(dao.getChapterByBizID).mockResolvedValue(null);

			const p = mangaExtractHandler('test');

			await expect(p).rejects.toThrowError();
			expect(dao.mangaExtractCompleted).not.toHaveBeenCalled();
		});
	});

	describe('获取内容', () => {
		test('章节不存在，获取失败', async () => {
			vi.mocked(dao.getById).mockResolvedValue(null);

			const p = getContentByID(1, 'baseURL');

			await expect(p).rejects.toThrowError();
		});

		test('漫画内容，获取成功', async () => {
			vi.mocked(dao.getById).mockResolvedValue({
				content_type: ContentType.Manga,
				product_id: 1,
			} as Chapter);
			vi.mocked(resourceRepo.getResourceById).mockResolvedValue({
				key: 'key',
			} as Resource);
			vi.mocked(getDirAllObjectURLs).mockResolvedValue(['url1', 'url2']);

			const result = await getContentByID(1, 'baseURL');

			expect(result.type).toBe(ResourceType.Manga);
		});

		test('小说内容，获取成功', async () => {
			vi.mocked(dao.getById).mockResolvedValue({
				content_type: ContentType.Novel,
				content_id: 1,
			} as Chapter);
			vi.mocked(getResourceURLByID).mockResolvedValue('url');

			const result = await getContentByID(1, 'baseURL');

			expect(result.type).toBe(ResourceType.Novel);
		});
	});
});
