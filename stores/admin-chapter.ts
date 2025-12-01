// stores/admin-chapter.ts
import { defineStore } from 'pinia';
import type { ChapterAdminListRes } from '~/shared/dto/admin/chapter';

export const useAdminChapterStore = defineStore('adminChapter', () => {
	const searchForm = reactive({
		page: 1,
		limit: 10,
		workId: undefined as number | undefined, // 用于筛选作品
	});

	const {
		data: chapter,
		refresh: refreshList,
		pending: isPending,
	} = useApiFetch<ChapterAdminListRes>('/api/admin/chapter', {
		query: computed(() => ({
			page: searchForm.page,
			limit: searchForm.limit,
			workId: searchForm.workId,
		})),
		immediate: false, // 避免 workId 还没设置就请求
	});

	//删除章节
	const deleteChapter = async (id: number) => {
		const { error } = await useApiFetch(`/api/admin/chapter/${id}`, {
			method: 'DELETE',
		});
		if (error.value) return;

		await refreshList(); // 删除后刷新列表
	};
	//更新章节状态
	const updateChapterStatus = async (
		id: number,
		status: 'Enable' | 'Disable',
	) => {
		const { error } = await useApiFetch(`/api/admin/chapter/${id}/status`, {
			method: 'PATCH',
			body: { status },
		});
		if (error.value) return;

		await refreshList(); // 修改后刷新列表
	};

	const chapterList = computed(() => chapter.value?.data?.list || []);
	const totalItems = computed(() => chapter.value?.data?.total || 0);
	const pageCount = computed(() =>
		Math.ceil(totalItems.value / searchForm.limit),
	);
	const fetchChapters = async (workId: number) => {
		searchForm.workId = workId;
		searchForm.page = 1;
		await refreshList();
	};
	return {
		searchForm,
		chapter,
		chapterList,
		totalItems,
		pageCount,
		isPending,

		//方法
		refreshList,
		deleteChapter,
		updateChapterStatus,
		fetchChapters,
	};
});
