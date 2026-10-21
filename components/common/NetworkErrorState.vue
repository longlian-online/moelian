<script setup lang="ts">
import { publicAssets } from '~/utils/assets';
withDefaults(
	defineProps<{ fullscreen?: boolean; retrying?: boolean; message?: string }>(),
	{
		fullscreen: false,
		retrying: false,
		message: '连接好像断开了……\n检查一下网络，再试一次吧。',
	},
);
defineEmits<{ retry: []; home: [] }>();
</script>
<template>
	<section
		class="error-page network-state"
		:class="{ 'network-state--fullscreen': fullscreen }"
		role="alert"
	>
		<div class="network-content">
			<img :src="publicAssets.networkError" alt="网络错误" class="network-image" />
			<h2 class="error-title error-title--network">{{ message }}</h2>
			<div class="network-actions">
				<v-btn
					color="pink-accent-2"
					rounded="pill"
					elevation="0"
					:loading="retrying"
					@click="$emit('retry')"
					>重新加载</v-btn
				>
				<v-btn
					variant="text"
					rounded="pill"
					class="network-home"
					@click="$emit('home')"
					>返回首页</v-btn
				>
			</div>
		</div>
	</section>
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

.error-title.error-title--network {
	margin-top: 24px;
	font-size: 1.25rem;
	line-height: 1.7;
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
	.error-title.error-title--network {
		margin-top: 20px;
		font-size: 1.1rem;
	}
	.renako-container {
		max-width: 100%;
	}

	.error-title {
		font-size: 1.2rem;
		margin-top: 0;
	}
}

.network-state {
	min-height: 0;
	padding: 32px 20px;
	display: flex;
	align-items: center;
	justify-content: center;
}
.network-state--fullscreen {
	min-height: 100vh;
	min-height: 100dvh;
}
.network-content {
	width: 100%;
	max-width: 640px;
	text-align: center;
}
.network-image {
	display: block;
	width: min(100%, 320px);
	max-height: 400px;
	object-fit: contain;
	margin: 0 auto;
}
.network-actions {
	margin-top: 28px;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 12px;
}
.network-home {
	color: #ad1457;
}
@media (max-width: 600px) {
	.network-image {
		max-height: 300px;
	}
}
</style>
