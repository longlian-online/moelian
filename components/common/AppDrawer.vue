<template>
	<v-navigation-drawer v-model="drawer" temporary location="left">
		<v-divider></v-divider>
		<v-tabs
			direction="vertical"
			color="primary"
			slider-color="primary"
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

<style scoped></style>
