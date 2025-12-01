<template>
	<div class="warpper">
		<v-sheet
			class="mx-auto mt-8"
			max-width="448"
			style="
				height: 64px;
				margin: 0 auto;
				background-color: #a6a897;
				border-radius: 4px;
			"
		>
			<v-img :src="logo" class="mx-auto my-2" width="228" height="64"></v-img>
		</v-sheet>

		<v-card
			class="mx-auto pa-12 pb-8 mb-4"
			max-width="448"
			rounded="lg"
			elevation="4"
		>
			<div class="text-subtitle-1 text-medium-emphasis">账号</div>

			<v-text-field
				v-model="username"
				density="compact"
				placeholder="请输入用户名"
				prepend-inner-icon="mdi-account"
				variant="outlined"
			></v-text-field>

			<div
				class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between"
			>
				密码
			</div>

			<v-text-field
				v-model="password"
				:append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
				:type="visible ? 'text' : 'password'"
				density="compact"
				placeholder="请输入密码"
				prepend-inner-icon="mdi-lock-outline"
				variant="outlined"
				@click:append-inner="visible = !visible"
			></v-text-field>

			<v-card class="mb-12" color="surface-variant" variant="tonal">
				<v-card-text
					class="text-medium-emphasis text-caption d-flex justify-center"
				>
					<div style="color: #a6a897">如果忘记密码，请联系管理员处理！</div>
				</v-card-text>
			</v-card>

			<v-btn
				class="mb-8"
				color="blue"
				size="large"
				variant="tonal"
				block
				:disabled="pending"
				@click="login"
			>
				<v-progress-circular
					v-if="pending"
					indeterminate
					size="24"
					class="mr-2"
				></v-progress-circular>
				登录
			</v-btn>
		</v-card>
	</div>
</template>

<script setup lang="ts">
import logo from '@/public/logo2.png';
definePageMeta({
	layout: 'admin',
});

const { $tip } = useNuxtApp();
const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const visible = ref(false);
const pending = ref(false);

async function login() {
	if (!username.value || !password.value) {
		$tip('账号和密码不能为空！', {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
		return;
	}

	pending.value = true;
	const success = await authStore.login(username.value, password.value);
	pending.value = false;

	if (success) {
		$tip(`登录成功！欢迎回来，${authStore.user?.nickname}`);
		router.push('/admin');
	}
}

useHead({
	title: '登录 - 后台管理',
});
</script>

<style scoped></style>
