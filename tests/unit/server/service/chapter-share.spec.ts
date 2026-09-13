import { describe, expect, test, vi } from 'vitest';
import type { Chapter, Resource, Work } from '_db';
import { ContentType, ResourceType } from '~/server/lib/prisma';
import * as dao from '~/server/repository/chapter';
import * as resourceRepo from '~/server/repository/resource';
import { getResourceURLByID } from '~/server/service/resource';
import { getContentByID } from '~/server/service/chapter';

vi.mock('~/server/repository/chapter');
vi.mock('~/server/repository/resource');
vi.mock('~/server/service/resource');

describe('章节内容分享元信息', () => {
	test('小说章节内容同时返回作品名称和作者', async () => {
		vi.mocked(dao.getEnableById).mockResolvedValue({
			id: 8,
			work_id: 3,
			content_type: ContentType.Novel,
			content_id: 9,
			Work: { id: 3, title: '雨季来信', author: '青鸟' },
		} as Chapter & { Work: Pick<Work, 'id' | 'title' | 'author'> });
		vi.mocked(dao.listChapterForIndex).mockResolvedValue([]);
		vi.mocked(resourceRepo.getResourceById).mockResolvedValue({
			key: 'novel.docx',
		} as Resource);
		vi.mocked(getResourceURLByID).mockResolvedValue(
			'https://example.com/novel.docx',
		);

		const result = await getContentByID(8, 'https://cos.example.com');

		expect(result).toMatchObject({
			type: ResourceType.Novel,
			work: { id: 3, title: '雨季来信', author: '青鸟' },
		});
	});
});
