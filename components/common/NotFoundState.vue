<script setup lang="ts">
withDefaults(defineProps<{ fullscreen?: boolean }>(), { fullscreen: false });
defineEmits<{ home: [] }>();
</script>
<template>
	<section
		:class="{ 'not-found-page--fullscreen': fullscreen }"
		class="not-found-page"
	>
		<section class="not-found-content" aria-labelledby="not-found-title">
			<div class="not-found-panel">
				<img src="/404-error.png" alt="404 Not Found" class="not-found-image" />
			</div>
			<h2>404 Not Found</h2>
			<p class="not-found-description">抱歉，你访问的页面不存在</p>
			<p class="not-found-hint">可能已被删除、移动或暂时不可用</p>
			<v-btn
				color="pink-accent-2"
				size="large"
				rounded="pill"
				elevation="0"
				class="not-found-home"
				@click="$emit('home')"
				>返回首页 ↗</v-btn
			>
		</section>
	</section>
</template>
<style scoped>
.not-found-page {
	min-height: 100vh;
	min-height: 100dvh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40px 20px;
	background: #fdfaf5;
	color: #70594b;
}
.not-found-content {
	width: 100%;
	max-width: 640px;
	text-align: center;
}
.not-found-content h1 {
	margin-bottom: 26px;
	font-size: clamp(22px, 3vw, 30px);
	font-weight: 700;
	line-height: 1.5;
}
.not-found-panel {
	overflow: hidden;
	border: 1px solid #dfd6c9;
	border-radius: 6px;
	background: white;
	padding: 10px;
}
.not-found-image {
	display: block;
	width: 100%;
	height: auto;
}
.not-found-content h2 {
	margin: 28px 0 14px;
	font:
		500 24px/1.5 Georgia,
		serif;
	letter-spacing: 0.06em;
}
.not-found-description {
	font-size: 15px;
	line-height: 1.8;
}
.not-found-hint {
	color: #a09181;
	font-size: 13px;
	line-height: 1.8;
	margin-top: 4px;
}
.not-found-home {
	margin-top: 28px;
	padding-inline: 32px;
}
@media (max-width: 600px) {
	.not-found-page {
		padding: 32px 18px;
	}
	.not-found-panel {
		padding: 6px;
	}
	.not-found-content h2 {
		font-size: 21px;
		margin-top: 24px;
	}
}

.not-found-page {
	min-height: 0;
}
.not-found-page--fullscreen {
	min-height: 100vh;
	min-height: 100dvh;
}
</style>
