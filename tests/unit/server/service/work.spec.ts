import { describe, expect, test, vi } from 'vitest';
import { create, updateByID } from '~/server/service/work';
import * as dao from '~/server/repository/work';
import type { Work } from '_db';

vi.mock('~/server/repository/work');

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
