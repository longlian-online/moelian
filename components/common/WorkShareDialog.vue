<script setup lang="ts">
import type { WorkDetailRes } from '~/shared/dto/web/work';
const visible = defineModel<boolean>({ default: false });
const props = defineProps<{
	work?: Pick<WorkDetailRes, 'coverUrl' | 'title' | 'author'> | null;
	shareUrl: string;
}>();
const shareCardRef = ref<InstanceType<
	typeof import('~/components/common/ShareCard.vue').default
> | null>(null);
watch(
	[visible, shareCardRef, () => props.work, () => props.shareUrl],
	async () => {
		if (!visible.value || !shareCardRef.value) return;
		await nextTick();
		await shareCardRef.value?.generateCard();
	},
	{ flush: 'post' },
);
</script>
<template>
	<v-dialog v-model="visible" max-width="520">
		<div class="share-dialog-content">
			<div class="share-dialog-header">
				<div>
					<h3 class="share-dialog-title">生成分享海报</h3>
				</div>
				<v-btn
					icon="mdi-close"
					aria-label="关闭分享"
					variant="text"
					@click="visible = false"
				/>
			</div>
			<ShareCard
				ref="shareCardRef"
				:cover-url="work?.coverUrl"
				:share-url="shareUrl"
				:title="work?.title"
				:author="work?.author"
			/>
		</div>
	</v-dialog>
</template>
<style scoped>
.share-dialog-content {
	background: #fffaf4;
	border-radius: 22px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	max-height: calc(100dvh - 32px);
	overflow: hidden;
}

.share-dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-shrink: 0;
	margin-bottom: 16px;
}

.share-dialog-title {
	font-size: 18px;
	font-weight: 900;
	color: #5a463d;
	margin: 2px 0 0;
}
</style>
