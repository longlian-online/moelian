<template>
	<div class="share-link-panel">
		<div class="share-link-label">分享文案</div>
		<div class="share-link-content">{{ shareText }}</div>
		<v-btn
			color="primary"
			prepend-icon="mdi-content-copy"
			size="large"
			block
			@click="copyShareText"
		>
			复制分享文案
		</v-btn>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	shareUrl: string;
}>();

const { $tip } = useNuxtApp();
const shareText = computed(
	() => `这部作品想推荐给喜欢百合的你：\n${props.shareUrl}`,
);

async function copyShareText() {
	try {
		await navigator.clipboard.writeText(shareText.value);
		$tip('分享文案已复制', {
			color: 'success',
			icon: 'mdi-check-circle',
		});
	} catch {
		$tip('复制失败，请长按文案手动复制', {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
	}
}
</script>

<style scoped>
.share-link-panel {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding-top: 8px;
}

.share-link-label {
	color: #9b7f7f;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.12em;
}

.share-link-content {
	min-height: 132px;
	padding: 20px;
	border: 1px solid #efd9dc;
	border-radius: 16px;
	background: #fffafa;
	color: #604e4b;
	font-size: 16px;
	font-weight: 700;
	line-height: 1.8;
	white-space: pre-wrap;
	word-break: break-all;
}
</style>
