<template>
	<footer class="site-footer">
		<v-container class="d-flex align-center py-0" style="max-width: 1200px">
			<v-footer
				tag="div"
				class="site-footer-content text-center d-flex flex-column"
			>
				<div class="text-caption font-weight-regular opacity-60">
					Powered by
					<a
						href="https://nuxt.com"
						style="color: inherit; text-decoration: none"
						><strong st>Nuxt4</strong></a
					>
				</div>
				<v-divider class="my-2" thickness="2" width="200"></v-divider>

				<div class="text-caption font-weight-regular opacity-60">
					<a
						href="https://beian.miit.gov.cn/"
						style="color: inherit; text-decoration: none"
						>ICP备案号: 粤ICP备2025414593号-1</a
					>
				</div>

				<v-divider></v-divider>

				<div>{{ new Date().getFullYear() }} — <strong>moelian</strong></div>
			</v-footer>
		</v-container>
	</footer>
</template>

<script setup lang="ts"></script>

<style scoped>
.site-footer {
	width: 100%;
	padding: 16px 0 8px;
	background: #eef0e9;
	border-top: 1px solid #dde1d6;
	color: #707766;
}
.site-footer-content {
	padding: 0 16px;
	background: transparent;
	color: inherit;
	gap: 4px;
}
.site-footer :deep(.v-divider) {
	color: #cdd3c3;
}
.site-footer a:hover {
	color: #4f5946 !important;
}
</style>
