<template>
	<v-navigation-drawer
		v-model="drawer"
		temporary
		location="left"
		color="#fffaf1"
	>
		<div class="drawer-brand"><NavBrand /></div>
		<v-divider></v-divider>
		<v-tabs
			direction="vertical"
			color="#a8786f"
			slider-color="#a8786f"
			class="my-drawer-tabs"
		>
			<v-tab value="manga" to="/manga">
				<v-icon start icon="mdi-image-multiple"></v-icon>
				漫画
			</v-tab>
			<v-tab value="novel" to="/novel">
				<v-icon start icon="mdi-book"></v-icon>
				小说
			</v-tab>
			<v-tab value="classify" to="/classify">
				<v-icon start icon="mdi-tag"></v-icon>
				分类
			</v-tab>
			<!-- <v-tab value="classify" to="/timeline">
				<v-icon start icon="mdi-alarm"></v-icon>
				时间表
			</v-tab> -->
			<v-tab value="classify" to="/setting">
				<v-icon start icon="mdi-cog"></v-icon>
				设置
			</v-tab>
		</v-tabs>
	</v-navigation-drawer>
</template>

<script setup lang="ts">
// 从 provide 注入 drawer 的状态和切换函数
const drawer = inject('drawer-state', ref(false));
</script>

<style scoped>
.drawer-brand {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 80px;
	padding: 12px;
	background: #fffaf1;
}
.drawer-brand :deep(.nav-brand) {
	gap: 8px;
}
.drawer-brand :deep(.brand-moelian) {
	width: 96px;
}
.drawer-brand :deep(.brand-chinese) {
	width: 88px;
}
.drawer-brand :deep(.brand-cross) {
	width: 16px;
	height: 16px;
}
</style>
