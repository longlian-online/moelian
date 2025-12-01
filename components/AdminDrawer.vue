<template>
	<v-navigation-drawer permanent>
		<v-list-item
			title="梦怜龙华管理端"
			prepend-icon="mdi-desktop-classic"
		></v-list-item>

		<v-divider></v-divider>
		<v-list-item
			link
			title="项目管理"
			to="/admin"
			prepend-icon="mdi-folder-multiple"
		></v-list-item>

		<v-divider></v-divider>

		<v-list-item
			link
			title="用户管理"
			prepend-icon="mdi-account-group"
			to="/admin/user"
		></v-list-item>

		<v-divider></v-divider>
	</v-navigation-drawer>
</template>

<script setup lang="ts"></script>

<style scoped></style>
