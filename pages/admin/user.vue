<template>
	<v-container>
		<v-card class="pa-4 mb-4" flat>
			<v-dialog v-model="isDialogOpen" max-width="500">
				<template #default>
					<v-card title="创建用户">
						<v-form ref="form" v-model="isFormValid" @submit.prevent>
							<v-card-text>
								<v-row dense>
									<v-col cols="12" md="12" sm="12">
										<v-text-field
											v-model="newUsername"
											:rules="usernameRules"
											label="用户名"
											required
										></v-text-field>
									</v-col>
									<v-col cols="12" sm="12">
										<v-select
											v-model="newRole"
											:items="roles"
											item-title="title"
											item-value="value"
											label="类型"
											required
										></v-select>
									</v-col>
								</v-row>
							</v-card-text>

							<v-card-actions>
								<v-spacer></v-spacer>
								<v-btn
									text="关闭"
									variant="plain"
									@click="isDialogOpen = false"
								></v-btn>
								<v-btn
									color="primary"
									text="注册"
									variant="tonal"
									:disabled="postPending"
									@click="handleCreateUser()"
								>
									<v-progress-circular
										v-if="postPending"
										indeterminate
										size="24"
									></v-progress-circular>
									注册
								</v-btn>
							</v-card-actions>
						</v-form>
					</v-card>
				</template>
			</v-dialog>
			<v-form>
				<v-row dense>
					<v-col cols="3">
						<v-text-field
							v-model="searchForm.username"
							label="输入关键词搜索"
							variant="outlined"
							density="compact"
							hide-details
							clearable
							prepend-inner-icon="mdi-magnify"
						>
						</v-text-field>
					</v-col>

					<v-col cols="2">
						<v-text-field
							v-model="searchForm.id"
							type="number"
							label="ID"
							variant="outlined"
							density="compact"
							hide-details
							clearable
							@input="(val) => (searchForm.id = val ? Number(val) : undefined)"
						></v-text-field>
					</v-col>

					<v-col cols="2">
						<v-select
							v-model="searchForm.status"
							label="状态"
							:items="[
								{
									title: '禁用',
									value: 'Disable',
								},
								{
									title: '启用',
									value: 'Enable',
								},
							]"
							variant="outlined"
							density="compact"
							hide-details
							clearable
						></v-select>
					</v-col>

					<v-col cols="2">
						<v-select
							v-model="searchForm.role"
							label="角色"
							:items="[
								{
									title: '用户',
									value: 'Normal',
								},
								{
									title: '管理员',
									value: 'SuperAdmin',
								},
							]"
							variant="outlined"
							density="compact"
							hide-details
							clearable
						></v-select>
					</v-col>

					<v-col cols="2" class="px-4">
						<div class="d-flex ga-4">
							<v-btn
								prepend-icon="mdi-broom"
								variant="outlined"
								color="primary"
								@click="clearAll()"
								>一键清空</v-btn
							>
							<v-btn
								prepend-icon="mdi-plus"
								variant="outlined"
								color="primary"
								@click="isDialogOpen = true"
								>创建用户</v-btn
							>
						</div>
					</v-col>
				</v-row>
			</v-form>
		</v-card>

		<div>
			<v-card elevation="0">
				<v-data-table
					:items="listData"
					:items-per-page="searchForm.limit"
					:headers="headers"
					:loading="isPending"
					loading-text="加载中...请稍等"
				>
					<template #[`item.avatar`]="{ item }">
						<v-avatar :image="item.avatar" size="40"></v-avatar>
					</template>

					<template #[`item.role`]="{ item }">
						<span v-if="item.role === 'Normal'">用户</span>
						<span v-else>管理员</span>
					</template>
					<template #[`item.status`]="{ item }">
						<div class="d-flex align-center">
							<template v-if="item.status === 'Enable'">
								<v-icon color="success" class="mr-1" size="x-small"
									>mdi-circle</v-icon
								>
								<span>启用</span>
							</template>

							<template v-else>
								<v-icon color="red" class="mr-1" size="x-small"
									>mdi-circle</v-icon
								>
								<span>禁用</span>
							</template>
						</div>
					</template>
					<template #[`item.created_at`]="{ item }">
						<span>{{
							dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')
						}}</span>
					</template>

					<template #[`item.actions`]="{ item }">
						<div class="d-flex justify-center align-center">
							<v-btn
								prepend-icon="mdi-lock-reset"
								stacked
								size="x-small"
								variant="text"
								color="primary"
								text="重置"
								@click="showResetPasswordConfirm(item.id, item.username)"
							>
							</v-btn>

							<v-btn
								:prepend-icon="
									item.status === 'Enable'
										? 'mdi-account-off'
										: 'mdi-account-check'
								"
								stacked
								size="x-small"
								variant="text"
								:text="item.status === 'Enable' ? '禁用' : '启用'"
								:color="item.status === 'Enable' ? '' : 'success'"
								@click="showUpdateStatusConfirm(item.id, item.status)"
							></v-btn>

							<v-btn
								prepend-icon="mdi-delete"
								stacked
								size="x-small"
								text="删除"
								variant="text"
								color="red"
								@click="showDeleteConfirm(item.id)"
							>
							</v-btn>
						</div>
					</template>

					<template #bottom>
						<div class="text-center pt-2">
							<v-pagination
								v-model="searchForm.page"
								:length="pageCount"
							></v-pagination>
						</div>
					</template>
				</v-data-table>
			</v-card>
		</div>

		<ConfirmDialog
			v-model="isResetPassword"
			title="修改成功"
			:message="
				resetInfo
					? `用户名：${resetInfo.username}\n密码：${resetInfo.password}`
					: ''
			"
			prepend-icon="mdi-check"
			@update:model-value="isResetPassword = $event"
		>
			<template #confirm-button>
				<v-btn
					color="primary"
					text="一键复制"
					variant="tonal"
					@click="
						copyText(
							`用户名：${resetInfo.username}\n密码：${resetInfo.password}`,
						);
						isResetPassword = false;
					"
				>
					一键复制
				</v-btn>
			</template>
		</ConfirmDialog>

		<ConfirmDialog
			v-model="isShowNewUserInfo"
			title="用户创建成功"
			:message="
				newUserInfo
					? `用户名：${newUserInfo.username}\n密码：${newUserInfo.password}`
					: ''
			"
			prepend-icon="mdi-check"
		>
			<template #confirm-button>
				<v-btn
					color="primary"
					text
					variant="tonal"
					@click="
						copyText(
							`用户名：${newUserInfo.username}\n密码：${newUserInfo.password}`,
						);
						isShowNewUserInfo = false;
					"
				>
					一键复制
				</v-btn>
			</template>
		</ConfirmDialog>
	</v-container>
</template>

<script setup lang="ts">
import { useNuxtApp } from '#app';
import dayjs from 'dayjs';
import { showConfirm } from '~/composables/useConfirm';
definePageMeta({
	layout: 'admin',
});

const { copyText } = useClipboard();
const { $tip } = useNuxtApp();
const isDialogOpen = ref(false);
const userIdToDelete = ref<number | null>(null);
const userStatus = ref('');
const userStatusId = ref<number | null>(null);
const userResetId = ref<number | null>(null);
const isResetPassword = ref(false);
const userResetName = ref<string>('');
const isShowNewUserInfo = ref(false); // 控制新建用户弹窗
const newUserInfo = ref<{ username: string; password: string } | null>(null);
const roles = [
	{ title: '普通用户', value: 'Normal' },
	{ title: '管理员', value: 'SuperAdmin' },
];
// 存储重置后的账号信息
const resetInfo = ref<{ username: string; password: string } | null>(null);

const headers = [
	{ title: 'id', key: 'id', width: '80px' },
	{ title: '头像', key: 'avatar', width: '100px', sortable: false },
	{
		title: '注册时间',
		key: 'created_at',
		width: '180px',
		sortable: true,
	},
	{
		title: '状态',
		key: 'status',
		width: '10%',
		sortable: true,
	},
	{
		title: '角色',
		key: 'role',
		width: '120px',
		sortable: true,
	},
	{
		title: '用户名',
		key: 'username',
		sortable: true,
	},
	{
		title: '名称',
		key: 'nickname',
		sortable: true,
	},
	{
		title: '操作',
		key: 'actions',
		sortable: false,
		align: 'center',
	},
] as const;

const userStore = useUserStore();
const {
	// 状态
	listData,
	postPending,
	newUsername,
	newRole,
	searchForm,
	isPending,
	pageCount,
} = storeToRefs(userStore);

// === API 调用和逻辑处理 ===
async function handleCreateUser() {
	//使用 form ref 来调用 validate() 方法
	const validation = await form.value?.validate();

	// 如果验证失败 (Vuetify 3: validate() 返回一个对象)
	if (validation && !validation.valid) {
		$tip('请检查表单中所有必填项和格式！', {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
		return;
	}

	const { postData } = await userStore.createUser();
	if (postData.value) {
		const userData = postData.value.data;
		newUserInfo.value = {
			username: userData.username,
			password: userData.password,
		};
		isShowNewUserInfo.value = true; // 弹出 dialog
		isDialogOpen.value = false; // 关闭创建用户表单
		userStore.refreshList(); // 刷新列表

		//提交成功后重置表单（清空数据和验证状态）
		form.value?.reset();
	}
}

async function handleDeleteUser() {
	const { deleteRes } = await userStore.deleteUser(userIdToDelete.value!);
	if (deleteRes.value) {
		$tip('用户删除成功！', { color: 'success', icon: 'mdi-check-circle' });
		userStore.refreshList();
	}
}

async function handleUpdateUserStatus() {
	const { updateRes } = await userStore.updateUserStatus(
		userStatusId.value!,
		userStatus.value,
	);
	if (updateRes.value) {
		$tip('用户状态更新成功！', { color: 'success', icon: 'mdi-check-circle' });
		userStore.refreshList();
	}
}

async function handleResetPassword() {
	const { resetRes } = await userStore.resetPassword(userResetId.value!);
	if (resetRes.value?.data?.newPassword) {
		resetInfo.value = {
			username: userResetName.value, // 来自点击按钮时保存的值
			password: resetRes.value.data.newPassword,
		};
		isResetPassword.value = true;
		$tip(`用户 ${userResetName.value} 密码已重置。`);
		userStore.refreshList();
	}
}

function clearAll() {
	searchForm.value.username = '';
	searchForm.value.role = null;
	searchForm.value.status = null;
	searchForm.value.id = undefined;
}

// 1. 删除确认
function showDeleteConfirm(id: number) {
	userIdToDelete.value = id; // 临时保存 ID，供 handleDeleteUser 使用
	showConfirm({
		title: '确认删除',
		message: '你确认要删除这个用户吗？',
		icon: 'mdi-delete',
		confirmText: '确认删除',
		onConfirm: handleDeleteUser, // 传入回调函数
	});
}

// 2. 状态更新确认 (禁用/启用)
function showUpdateStatusConfirm(id: number, currentStatus: string) {
	userStatusId.value = id;
	// 确定新状态和提示信息
	const newStatus = currentStatus === 'Enable' ? 'Disable' : 'Enable';
	const message =
		newStatus === 'Enable'
			? '你确认要恢复这个用户吗？'
			: '你确认要禁用这个用户吗？';

	// 临时保存新状态，供 handleUpdateUserStatus 使用
	userStatus.value = newStatus;

	showConfirm({
		title: '确认更改',
		message: message,
		icon: 'mdi-alert-circle',
		confirmText: '确认',
		onConfirm: handleUpdateUserStatus, // 传入回调函数
	});
}

// 3. 重置密码确认
function showResetPasswordConfirm(id: number, username: string) {
	userResetId.value = id;
	userResetName.value = username; // 临时保存用户名
	showConfirm({
		title: '确认更改？',
		message: `你确认要重置用户 **${username}** 的密码吗？`, // 提示中包含用户名
		icon: 'mdi-lock-reset',
		confirmText: '确认重置',
		onConfirm: handleResetPassword, // 传入回调函数
	});
}

type VForm = {
	validate: () => Promise<{ valid: boolean }>;
	reset: () => void;
};
const form = ref<VForm | null>(null);
const isFormValid = ref(false);
//用户处理验证
const usernameRules = [
	(value: string) => {
		if (!value) return '用户名不能为空。'; // 检查是否为空
		if (/^[a-zA-Z_]+$/.test(value)) return true; // 检查是否符合规则
		return '用户名只能包含英文字母和下划线 (_)。'; // 不符合规则的错误信息
	},
];

useHead({
	title: '用户管理',
});
</script>

<style scoped></style>
