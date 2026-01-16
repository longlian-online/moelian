<template>
	<v-container class="d-flex align-center py-0" style="max-width: 1200px">
		<v-footer class="text-center d-flex flex-column">
			<div class="text-caption font-weight-regular opacity-60">
				Powered by
				<a href="https://nuxt.com" style="color: black; text-decoration: none"
					><strong st>Nuxt4</strong></a
				>
			</div>
			<v-divider class="my-2" thickness="2" width="200"></v-divider>

			<div class="text-caption font-weight-regular opacity-60">
				<a
					href="https://beian.miit.gov.cn/"
					style="color: gray; text-decoration: none"
					>ICP备案号: 粤ICP备2025414593号-1</a
				>
			</div>

			<v-divider></v-divider>

			<div>{{ new Date().getFullYear() }} — <strong>longlian</strong></div>
		</v-footer>
	</v-container>
</template>

<script setup lang="ts"></script>

<style scoped></style>
