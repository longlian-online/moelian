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
		<v-container class="error-page fill-height" fluid>
			<v-row align="center" justify="center">
				<v-col
					cols="12"
					sm="10"
					md="8"
					lg="6"
					class="text-center position-relative"
				>
					<!-- 核心插画：玲奈子 -->
					<div class="renako-container mb-4">
						<v-img
							src="/error.jpg"
							alt="404 Error"
							max-height="400"
							contain
							class="mx-auto renako-img"
						></v-img>
					</div>

					<!-- 错误标题 -->
					<h1 class="error-title mb-4">
						{{
							error?.statusCode === 404
								? '呜诶？不行不行！ 这里根本什么都没有啊！\n 就像我原本就不存在的社交计划一样彻底消失了……'
								: 'ERROR - 出错了！'
						}}
					</h1>

					<!-- 按钮 -->
					<v-btn
						color="pink-accent-2"
						size="x-large"
						rounded="pill"
						class="home-btn mt-4 px-10"
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

.bg-deco-text {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	font-size: 20rem;
	font-weight: 900;
	color: rgba(255, 133, 179, 0.1);
	z-index: 0;
	user-select: none;
	font-family: 'Arial Black', sans-serif;
}

.renako-container {
	position: relative;
	z-index: 1;
}

.speech-bubble {
	position: absolute;
	right: -10%;
	top: 10%;
	background: white;
	border-radius: 20px;
	padding: 16px 24px;
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	max-width: 250px;
	text-align: left;
	font-size: 0.95rem;
	color: #d81b60;
	border: 3px solid #f06292;
}

.speech-bubble::after {
	content: '';
	position: absolute;
	left: -20px;
	top: 30px;
	border-width: 10px 20px 10px 0;
	border-style: solid;
	border-color: transparent white transparent transparent;
}

.speech-bubble::before {
	content: '';
	position: absolute;
	left: -24px;
	top: 29px;
	border-width: 11px 22px 11px 0;
	border-style: solid;
	border-color: transparent #f06292 transparent transparent;
}

.error-title {
	font-size: 2rem;
	font-weight: 800;
	color: #ad1457;
	text-shadow: 2px 2px 0px rgba(240, 98, 146, 0.3);
	position: relative;
	z-index: 1;
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
	.bg-deco-text {
		font-size: 10rem;
	}
	.speech-bubble {
		position: static;
		margin: 20px auto;
		max-width: 90%;
	}
	.speech-bubble::before,
	.speech-bubble::after {
		display: none;
	}
	.error-title {
		font-size: 1.8rem;
	}
}
</style>
