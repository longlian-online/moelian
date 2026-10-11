import { afterEach, expect, test, vi } from 'vitest';
import { getLastChapterByWorkIDs } from '~/server/repository/chapter';
import type { Prisma } from '_db';

const chapters = [
	{
		id: 1,
		work_id: 10,
		status: 'Enable',
		deleted_at: null,
		created_at: new Date('2026-10-01'),
	},
	{
		id: 2,
		work_id: 10,
		status: 'Disable',
		deleted_at: null,
		created_at: new Date('2026-10-02'),
	},
	{
		id: 3,
		work_id: 10,
		status: 'Enable',
		deleted_at: new Date('2026-10-03'),
		created_at: new Date('2026-10-03'),
	},
	{
		id: 4,
		work_id: 20,
		status: 'Disable',
		deleted_at: null,
		created_at: new Date('2026-10-04'),
	},
];

afterEach(() => vi.unstubAllGlobals());

function mockDatabase() {
	const findFirst = vi.fn(
		async ({ where }: { where: Prisma.ChapterWhereInput }) =>
			chapters
				.filter(
					(c) =>
						c.work_id === where.work_id &&
						(!where.status || c.status === where.status) &&
						(where.deleted_at === undefined || c.deleted_at === null),
				)
				.sort((a, b) => b.id - a.id)[0] ?? null,
	);
	vi.stubGlobal('useDB', () => ({ chapter: { findFirst } }));
	return findFirst;
}

test('最新已发布章节排除更新的草稿和已删除章节', async () => {
	const findFirst = mockDatabase();
	expect(await getLastChapterByWorkIDs(10)).toEqual(chapters[0]);
	expect(findFirst).toHaveBeenCalledWith({
		where: { work_id: 10, status: 'Enable', deleted_at: { equals: null } },
		orderBy: { id: 'desc' },
	});
});

test('只有未发布章节时返回空值', async () => {
	mockDatabase();
	expect(await getLastChapterByWorkIDs(20)).toBeNull();
});
