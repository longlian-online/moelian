<script setup lang="ts">
import type { NuxtError } from '#app';
const NOT_FOUND_MESSAGE =
	'呜诶？不行不行！ 这里根本什么都没有啊！\n 就像我原本就不存在的社交计划一样彻底消失了……';
const ERROR_MESSAGE =
	'出错了！\n 可能是网络问题，或者是服务器开小差。' +
	'\n' +
	'不过别担心，玲奈子会陪你一起度过这个难关的！';
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
		<v-container class="error-page fill-height" fluid>
			<v-row align="center" justify="center">
				<v-col
					cols="12"
					sm="10"
					md="8"
					lg="6"
					class="text-center position-relative d-flex flex-column align-center"
				>
					<!-- 插画-->
					<div class="renako-container">
						<v-img
							src="/error.png"
							alt="404 Error"
							max-height="400"
							width="400"
							contain
							class="mx-auto"
						></v-img>
					</div>

					<!-- 错误标题 -->
					<h1 class="error-title">
						{{ error?.statusCode === 404 ? NOT_FOUND_MESSAGE : ERROR_MESSAGE }}
					</h1>

					<!-- 按钮 -->
					<v-btn
						color="pink-accent-2"
						size="x-large"
						rounded="pill"
						class="home-btn mt-10 px-10"
						elevation="4"
						@click="handleError"
					>
						趁没人发现，点我逃回首页！
					</v-btn>
				</v-col>
			</v-row>
		</v-container>
	</v-app>
</template>

<style scoped>
.error-page {
	background: linear-gradient(135deg, #fff0f6 0%, #ffdeeb 100%);
	background-image: radial-gradient(#ff85b322 1px, transparent 0);
	background-size: 24px 24px;
	min-height: 100vh;
	overflow: hidden;
}

.renako-container {
	position: relative;
	z-index: 1;
	/* 移除所有底部边距 */
	margin-bottom: 0;
}

.error-title {
	font-size: 1.5rem;
	font-weight: 800;
	color: #ad1457;
	text-shadow: 2px 2px 0px rgba(240, 98, 146, 0.3);
	position: relative;
	z-index: 1;
	white-space: pre-line;
	line-height: 1.4;
	/* 减小与上方图片的间距 */
	margin-top: -10px;
}

.home-btn {
	z-index: 1;
	font-weight: bold;
	font-size: 1.1rem !important;
	transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.home-btn:hover {
	transform: scale(1.1) rotate(-2deg);
}

@media (max-width: 600px) {
	.error-title {
		font-size: 1.2rem;
		margin-top: 0;
	}
}
</style>
