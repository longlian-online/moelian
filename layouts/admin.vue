<template>
	<v-app id="app">
		<AdminBar></AdminBar>
		<!-- 未登录时候隐藏导航栏 -->
		<template v-if="isLoggedIn">
			<AdminDrawer></AdminDrawer>
		</template>
		<v-main>
			<slot></slot>
			<DesktopFooter></DesktopFooter>
		</v-main>
		<!-- 全局组件 -->
		<Tip></Tip>
		<ConfirmDialog
			v-model="dialogState.isVisible"
			:title="dialogState.title"
			:message="dialogState.message"
			:prepend-icon="dialogState.icon"
			:confirm-text="dialogState.confirmText"
			@confirm="handleGlobalConfirm"
		/>
	</v-app>
</template>

<script setup lang="ts">
const { dialogState } = useConfirm();
const authStore = useAuthStore();
// 添加响应式
const { isLoggedIn } = storeToRefs(authStore);
</script>

<style scoped></style>
