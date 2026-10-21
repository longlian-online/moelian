<script setup lang="ts">
import { VInfiniteScroll } from 'vuetify/components';
import type { WorkLoadEvent } from '~/shared/types/work-pagination';
withDefaults(
	defineProps<{
		revision: string | number;
		loadingText?: string;
		emptyText?: string;
	}>(),
	{
		loadingText: '正在加载更多作品…',
		emptyText: '已经看到最后一本了',
	},
);
defineEmits<{ load: [event: WorkLoadEvent] }>();
</script>
<template>
	<VInfiniteScroll
		:key="revision"
		class="work-infinite"
		:margin="240"
		@load="$emit('load', $event)"
	>
		<slot />
		<template #loading>
			<div class="work-load-status">
				<v-progress-circular indeterminate :size="20" :width="2" />{{
					loadingText
				}}
			</div>
		</template>
		<template #empty
			><div class="work-load-status work-end-note" role="status">
				{{ emptyText }}
			</div></template
		>
		<template #error="{ props: retryProps }"
			><v-btn v-bind="retryProps" variant="text" class="work-load-status"
				>加载失败，点击重试</v-btn
			></template
		>
	</VInfiniteScroll>
</template>
<style scoped>
.work-infinite {
	width: 100%;
	min-width: 0;
	overflow: visible;
}
.work-infinite :deep(.v-infinite-scroll__side:first-child) {
	display: none;
}
.work-infinite :deep(.v-infinite-scroll__side:last-child) {
	padding: 0;
}
.work-load-status {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 18px 12px;
	color: var(--work-status-color, #7c6557);
	font-size: 13px;
}
.work-end-note {
	padding: 16px 12px 4px;
	font-family: 'Noto Serif SC', 'Songti SC', serif;
	font-size: 12px;
	letter-spacing: 0.1em;
}
</style>
