<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps({
	error: {
		type: Object as () => NuxtError,
		default: null,
	},
});

const handleError = () => clearError({ redirect: '/' });
</script>

<template>
	<v-app>
		<v-container class="fill-height" fluid>
			<v-row align="center" justify="center">
				<v-col cols="12" sm="8" md="6" lg="4" class="text-center">
					<v-icon color="error" size="128" class="mb-6">
						{{
							error?.statusCode === 404
								? 'mdi-map-marker-question'
								: 'mdi-alert-circle'
						}}
					</v-icon>
					<h1 class="text-h2 font-weight-bold mb-4">
						{{ error?.statusCode || 'Error' }}
					</h1>
					<p class="text-h5 mb-6">
						{{
							error?.statusCode === 404
								? '抱歉，页面似乎迷路了'
								: '应用遇到了点问题'
						}}
					</p>
					<div class="text-body-1 mb-8 text-grey-darken-1 text-break">
						{{
							error?.statusMessage ||
							error?.message ||
							'服务器发生了预期之外的错误'
						}}
					</div>
					<v-btn
						color="primary"
						size="large"
						rounded="xl"
						elevation="2"
						@click="handleError"
					>
						<v-icon start>mdi-home</v-icon>
						返回首页
					</v-btn>
				</v-col>
			</v-row>
		</v-container>
	</v-app>
</template>

<style scoped>
.v-container {
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	min-height: 100vh;
}
.text-break {
	word-break: break-word;
}
</style>
