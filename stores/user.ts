import { useApiFetch } from '#imports';
import type {
	UserAdminListRes,
	UserAdminListReq,
	CreateUserRes,
	ResetPasswordRes,
} from '#shared/dto/admin/user';
import { debounce } from 'radash';

export const useUserStore = defineStore('user', () => {
	// === 状态 (State) ===

	// 创建用户的表单数据
	const newUsername = ref('');
	const newRole = ref('Normal');
	const postPending = ref(false);
	//搜索查询参数
	const searchForm = reactive<UserAdminListReq>({
		page: 1,
		limit: 10,
	});
	// 防抖的查询参数
	const debouncedQuery = ref(searchForm);

	watch(
		() => ({ ...searchForm }),
		debounce({ delay: 500 }, (val) => {
			debouncedQuery.value = val;
		}),
		{ deep: true },
	);

	// === API 请求 (Actions) ===
	// 获取用户列表的请求，useApiFetch 会在依赖变化时自动重新请求
	const {
		data: resData,
		error: listError,
		refresh: refreshList,
		pending: isPending,
	} = useApiFetch<UserAdminListRes>('/api/admin/user', {
		query: computed(() =>
			Object.fromEntries(
				Object.entries(debouncedQuery.value).filter(([_, value]) => {
					return value != null && value !== '';
				}),
			),
		),
	});

	// 创建用户的 Action
	async function createUser() {
		const {
			data: postData,
			error: postError,
			pending,
		} = await useApiFetch<CreateUserRes>('/api/admin/user', {
			method: 'POST',
			body: {
				username: newUsername.value,
				role: newRole.value,
			},
		});
		postPending.value = pending.value;
		return { postData, postError };
	}

	// 删除用户的 Action
	async function deleteUser(id: number) {
		const { data: deleteRes, error: deleteError } = await useApiFetch(
			`/api/admin/user/${id}`,
			{
				method: 'DELETE',
			},
		);
		return { deleteRes, deleteError };
	}

	// 更新用户状态的 Action
	async function updateUserStatus(id: number, newStatus: string) {
		const { data: updateRes, error: updateError } = await useApiFetch(
			`/api/admin/user/${id}/status`,
			{
				method: 'PATCH',
				body: {
					status: newStatus,
				},
			},
		);
		return { updateRes, updateError };
	}

	// 重置用户密码的 Action
	async function resetPassword(id: number) {
		const { data: resetRes, error: resetError } =
			await useApiFetch<ResetPasswordRes>(
				`/api/admin/user/${id}/reset-password`,
				{
					method: 'POST',
				},
			);
		return { resetRes, resetError };
	}

	//Getter
	const listData = computed(() => resData.value?.data?.list || []);
	const totalItems = computed(() => resData.value?.data?.total || 0);
	const pageCount = computed(() =>
		Math.ceil(totalItems.value / searchForm.limit),
	);
	return {
		// 状态
		searchForm,
		isPending,
		newUsername,
		newRole,
		listData,
		postPending,
		listError,
		pageCount,

		// 方法
		refreshList,
		createUser,
		deleteUser,
		updateUserStatus,
		resetPassword,
	};
});
