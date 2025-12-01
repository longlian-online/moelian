// stores/admin.ts
import { defineStore } from 'pinia';

import { useApiFetch } from '#imports';
import { debounce } from 'radash';
import type {
	WorkAdminListReq,
	WorkAdminListRes,
	WorkPutReq,
} from '~/shared/dto/admin/work';

export const useAdminWorkStore = defineStore('admin', () => {
	let searchForm = reactive<WorkAdminListReq>({
		page: 1,
		limit: 10,
	});
	const { $tip } = useNuxtApp();
	// 这个 ref 保存防抖后的参数
	const debouncedQuery = ref(searchForm);
	// Actions

	// watch searchForm，添加调试日志
	watch(
		() => ({ ...searchForm }),
		debounce({ delay: 500 }, (val) => {
			debouncedQuery.value = val;
		}),
		{ deep: true },
	);

	const {
		data: work,
		refresh: refreshList,
		pending: isPending,
	} = useApiFetch<WorkAdminListRes>('/api/admin/work', {
		query: computed(() => {
			return Object.fromEntries(
				Object.entries(debouncedQuery.value).filter(([_, value]) => {
					return value != null && value !== '';
				}),
			);
		}),
	});

	//删除
	const deleteWork = async (id: number) => {
		const { error } = await useApiFetch(`/api/admin/work/${id}`, {
			method: 'DELETE',
		});
		if (error.value) {
			return;
		}
		// 只有 error.value 为 null 时，才会执行下面的成功逻辑
		$tip('删除成功');
		await refreshList();
	};

	//修改状态设置
	const updateWorkStatus = async (id: number, status: 'Enable' | 'Disable') => {
		const { error } = await useApiFetch(`/api/admin/work/${id}/status`, {
			method: 'PATCH',
			body: { status },
		});
		if (error.value) return;
		// 异步刷新列表，不阻塞 UI
		await refreshList();

		$tip(status === 'Enable' ? '发布成功' : '下架成功');
	};

	//重置所有状态
	function resetSearch() {
		searchForm = reactive<WorkAdminListReq>({
			page: 1,
			limit: 10,
		});
		refreshList();
	}

	// 修改作品
	const updateWork = async (id: number, payload: WorkPutReq) => {
		const { error } = await useApiFetch(`/api/admin/work/${id}`, {
			method: 'PUT',
			body: payload,
		});
		if (error.value) return;

		await refreshList();
		$tip('更新成功');
	};

	// 修改作品封面
	const updateWorkCover = async (id: number, coverId: number) => {
		const { error } = await useApiFetch(`/api/admin/work/${id}/cover`, {
			method: 'PATCH',
			body: { coverId },
		});
		if (error.value) return;

		await refreshList();
		$tip('封面更新成功');
	};
	//  Getter
	const workList = computed(() => work.value?.data?.list || []);
	const totalItems = computed(() => work.value?.data?.total || 0);
	const pageCount = computed(() =>
		Math.ceil(totalItems.value / searchForm.limit),
	);

	// 根据 id 从 workList 中获取作品
	const getWorkById = (id: number) => {
		return workList.value.find((work) => work.id === id) || null;
	};
	return {
		page: searchForm.page,
		limit: searchForm.limit,
		isPending,
		workList,
		totalItems,
		pageCount,
		searchForm,
		//方法
		deleteWork,
		refreshList,
		updateWorkStatus,
		resetSearch,
		updateWork,
		updateWorkCover,
		getWorkById,
	};
});
