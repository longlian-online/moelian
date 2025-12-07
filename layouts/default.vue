<template>
	<v-app id="app">
		<AppDrawer></AppDrawer>
		<Transition name="fade">
			<BaseNav v-if="!$route.meta.baseNav && isNavbarVisible"></BaseNav>
		</Transition>
		<v-main>
			<slot></slot>
		</v-main>
		<!-- <MobileFooter v-if="isMobile"></MobileFooter> -->
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
		<!-- 在阅读器中不显示页脚 -->
		<DesktopFooter v-if="!$route.meta.hideFooter"></DesktopFooter>
	</v-app>
</template>

<script setup lang="ts">
// const { isMobile } = useDevice();
const { dialogState } = useConfirm();
// 控制导航抽屉的显示/隐藏状态
const drawer = ref(false);
const toggleDrawer = () => {
	drawer.value = !drawer.value;
};
//在阅读器中注入 不显示导航条
const isNavbarVisible = ref(true);
provide('isNavbarVisible', isNavbarVisible);
provide('drawer-state', drawer);
provide('toggle-drawer-fn', toggleDrawer);

const theme = useTheme();
const route = useRoute();

const { applyReaderTheme, themeChoice } = useReaderTheme();

watch(
	() => route.meta.readerTheme,
	(mode) => {
		if (mode === 'novel' || mode === 'setting') {
			applyReaderTheme(themeChoice.value);
		} else if (mode === 'manga') {
			theme.change('dark');
		} else {
			theme.change('light');
		}
	},
	{ immediate: true },
);
</script>

<style>
.v-main {
	padding-bottom: 56px;
}
/* 定义进入和离开的动画效果 */
.fade-enter-active,
.fade-leave-active {
	/* 同时过渡 opacity 和 transform，持续时间设为 0.3 秒 */
	transition: all 0.3s ease;
}

.fade-enter-from {
	opacity: 0;
	transform: translateY(-20px);
}

.fade-leave-to {
	opacity: 0;
	transform: translateY(20px);
}
</style>
