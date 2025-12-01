import type { ChapterAdminListRes } from '#shared/dto/admin/chapter';
import { ChapterAdminListReq } from '#shared/dto/admin/chapter';
import { listForAdmin, productReady } from '~/server/service/chapter';

export default defineWrappedResponseHandler(
	async (event): Promise<ChapterAdminListRes> => {
		const query = ChapterAdminListReq.parse(getQuery(event));

		const { list, total } = await listForAdmin({
			equals: {
				id: query.id,
				status: query.status,
				work_id: query.workId,
				content_type: query.contentType,
			},
			like: {
				title: query.title,
			},
			pagination: {
				page: query.page,
				limit: query.limit,
			},
		});

		return {
			list: list.map((item) => {
				return {
					id: item.id,
					workId: item.work_id,
					bizNo: item.biz_no,
					no: item.no,
					title: item.title,
					contentType: item.content_type,
					status: item.status,
					uploaderId: item.uploader_id,
					createdAt: item.created_at,
					productReady: productReady(item),
				};
			}),
			total,
		};
	},
);
