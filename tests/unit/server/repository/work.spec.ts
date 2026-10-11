import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ContentType, type Prisma } from '_db';
import { listForWeb } from '~/server/repository/work';

const db = vi.hoisted(() => ({
	$queryRaw: vi.fn(),
	work: { findMany: vi.fn(), count: vi.fn() },
	tag: { findMany: vi.fn() },
}));
vi.mock('~/server/utils/db', () => ({
	pagination: ({ page, limit }: { page: number; limit: number }) => ({
		skip: (page - 1) * limit,
		take: limit,
	}),
}));

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('useDB', () => db);
	db.$queryRaw.mockResolvedValue([{ id: 2 }, { id: 1 }]);
	db.work.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
	db.work.count.mockResolvedValue(30);
	db.tag.findMany.mockResolvedValue([{ content: '百合' }]);
});

describe('首页作品排序', () => {
	test('默认在分页前按最新可见章节时间排序，并保留数据库排序', async () => {
		const result = await listForWeb({
			type: ContentType.Manga,
			page: { page: 3, limit: 24 },
		});
		expect(db.$queryRaw).toHaveBeenCalledOnce();
		const query: Prisma.Sql = db.$queryRaw.mock.calls[0][0];
		expect(query.text).toContain('ORDER BY c."work_id", c."id" DESC');
		expect(query.text).toContain('c."deleted_at" IS NULL');
		expect(query.text).toContain('c."status" = \'Enable\'');
		expect(query.text).toContain(
			'ORDER BY latest."created_at" DESC NULLS LAST, w."id" DESC',
		);
		expect(query.values.slice(-2)).toEqual([24, 48]);
		expect(db.work.findMany.mock.calls[0][0].where.id).toEqual({ in: [2, 1] });
		expect(db.work.findMany.mock.calls[0][0].skip).toBeUndefined();
		expect(result.list.map((item) => item.id)).toEqual([2, 1]);
		expect(result.total).toBe(30);
	});

	test('排序查询保留类型、关键词、标签和软删除筛选，并绑定用户输入', async () => {
		await listForWeb({
			type: ContentType.Novel,
			page: { page: 1, limit: 24 },
			key: "a'bc",
			tags: ['百合'],
		});
		expect(db.$queryRaw).toHaveBeenCalledOnce();
		const query: Prisma.Sql = db.$queryRaw.mock.calls[0][0];
		expect(query.text).toContain('w."deleted_at" IS NULL');
		expect(query.text).toContain('w."status" = \'Enable\'');
		expect(query.text).toContain('"WorkTags"');
		expect(query.text).toContain('t."deleted_at" IS NULL');
		expect(query.text).not.toContain("a'bc");
		expect(query.values).toContain('Novel');
		expect(query.values).toContain("%a'bc%");
		expect(query.values).toContain('百合');
	});

	test('发布时间仍使用作品创建时间分页', async () => {
		await listForWeb({
			type: ContentType.Manga,
			page: { page: 2, limit: 24 },
			sortType: 'PUBLISH',
		});
		expect(db.$queryRaw).not.toHaveBeenCalled();
		expect(db.work.findMany.mock.calls[0][0]).toMatchObject({
			orderBy: { created_at: 'desc' },
			skip: 24,
			take: 24,
		});
	});

	test('没有当前页作品时不查询详情', async () => {
		db.$queryRaw.mockResolvedValue([]);
		const result = await listForWeb({
			type: ContentType.Manga,
			page: { page: 3, limit: 24 },
		});
		expect(result).toEqual({ list: [], total: 30 });
		expect(db.work.findMany).not.toHaveBeenCalled();
	});
});
