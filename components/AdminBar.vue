<template>
	<v-app-bar color="#A6A897">
		<v-container class="d-flex align-center py-0" style="max-width: 1200px">
			<v-tabs
				v-model="activeTab"
				background-color="transparent"
				color="#333"
				slider-color="#333"
				class="flex-grow-0"
			>
				<v-tab value="home" to="/">
					<v-img :src="logoUrl" class="mx-2" width="100" height="64"></v-img>
				</v-tab>
				<v-tab value="admin" to="/admin">
					<v-btn stacked prepend-icon="mdi-monitor-dashboard">管理端</v-btn>
				</v-tab>
				<v-tab value="collaboration">
					<a
						href="https://longlian.online/admin"
						style="text-decoration: none; color: inherit"
						target="_blank"
					>
						<v-btn prepend-icon="mdi-account-group" stacked>协作网站</v-btn>
					</a>
				</v-tab>
			</v-tabs>
			<v-spacer></v-spacer>

			<template v-if="!auth.isLoggedIn">
				<v-list-item
					link
					title="登录"
					to="/login"
					prepend-icon="mdi-login"
				></v-list-item>
			</template>
			<template v-else>
				<v-menu min-width="200px" open-on-hover :close-on-content-click="false">
					<template #activator="{ props }">
						<v-btn icon v-bind="props">
							<v-avatar :image="auth.user?.avatar"></v-avatar>
						</v-btn>
					</template>

					<v-card>
						<v-card-text>
							<div class="text-center">
								<v-avatar :image="auth.user?.avatar"></v-avatar>
								<p class="text-caption mt-1">
									{{ auth.user?.nickname }}
								</p>
								<v-divider class="my-3"></v-divider>
								<v-btn
									prepend-icon="mdi-key-change"
									variant="text"
									color="info"
									@click="openPasswordDialog"
									>修改密码</v-btn
								>
								<v-divider class="my-3"></v-divider>
								<v-btn
									prepend-icon="mdi-logout"
									color="error"
									variant="text"
									@click="logout"
									>登出</v-btn
								>
							</div>
						</v-card-text>
					</v-card>
				</v-menu>
			</template>

			<v-dialog v-model="passwordDialog" max-width="400">
				<v-card>
					<v-card-title class="headline">修改密码</v-card-title>
					<v-card-text>
						<v-text-field
							v-model="newPassword"
							label="新密码"
							:type="showNewPassword ? 'text' : 'password'"
							:rules="passwordRules"
							required
							:append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
							@click:append-inner="showNewPassword = !showNewPassword"
						></v-text-field>

						<v-text-field
							v-model="confirmPassword"
							label="确认新密码"
							:type="showConfirmPassword ? 'text' : 'password'"
							:rules="confirmPasswordRules"
							required
							:append-inner-icon="
								showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'
							"
							@click:append-inner="showConfirmPassword = !showConfirmPassword"
						></v-text-field>
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn color="grey" variant="text" @click="passwordDialog = false"
							>取消</v-btn
						>
						<v-btn
							color="primary"
							variant="flat"
							:disabled="!isPasswordValid"
							@click="changePassword"
						>
							确认修改
						</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>
		</v-container>
	</v-app-bar>
</template>

<script setup lang="ts">
import type { UpdatePasswordReq } from '~/shared/dto/admin/user';

const { $tip } = useNuxtApp();
const activeTab = ref('admin');
const auth = useAuthStore();
const router = useRouter();
const logoUrl = useRuntimeConfig().public.logoUrl;
const logout = async () => {
	await auth.logout();
	router.push('/login');
	$tip('已登出', { color: 'info' });
};

// --- 响应式状态 ---
const passwordDialog = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');

// 控制密码是否显示的状态
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// --- 密码校验规则 ---

// 校验密码是否包含大小写字母和数字的正则表达式
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

// 🚨 增强的密码输入规则数组
const passwordRules = [
	(v: string) => !!v || '密码不能为空',
	(v: string) => v.length >= 6 || '密码至少6位',
	(v: string) => passwordRegex.test(v) || '密码必须包含大小写字母和数字',
];

// 🚨 确认密码输入规则数组
const confirmPasswordRules = [
	(v: string) => !!v || '请确认密码',
	(v: string) => v === newPassword.value || '两次输入的密码不一致',
];

const isPasswordValid = computed(() => {
	// 确保所有基础校验通过，并且两次密码一致
	return (
		newPassword.value &&
		newPassword.value.length >= 6 &&
		passwordRegex.test(newPassword.value) && // 增加正则校验
		newPassword.value === confirmPassword.value
	);
});

const openPasswordDialog = () => {
	newPassword.value = '';
	confirmPassword.value = '';
	// 打开对话框时，默认隐藏密码
	showNewPassword.value = false;
	showConfirmPassword.value = false;
	passwordDialog.value = true;
};

const changePassword = async () => {
	// 如果验证不通过，直接返回
	if (!isPasswordValid.value) {
		$tip('请检查密码输入是否符合要求。', {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
		return;
	}

	try {
		await useApiFetch<UpdatePasswordReq>('/api/admin/me/password', {
			method: 'PATCH',

			body: {
				newPassword: newPassword.value,
			},
		});
		// 成功反馈
		$tip('密码修改成功！');
		// 关闭对话框
		passwordDialog.value = false;
	} catch (error) {
		console.error('修改密码失败:', error);
		// 错误反馈
		$tip(`修改密码失败: ${error.data?.message || '服务器错误'}`, {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
	}
};
</script>

<style scoped></style>
