<script setup lang="ts">
useSeoMeta({
	title: '',
});
</script>

<template>
	<NuxtLayout>
		<NuxtPage></NuxtPage>
	</NuxtLayout>
</template>

<style>
/* 移除 scoped */
/* 这里的选择器要精准打击到文本容器和所有内部元素 */
.custom-tooltip-box,
.custom-tooltip-box > *,
.v-overlay__content:has(.custom-tooltip-box),
.v-tooltip > .v-overlay__content {
	max-width: 400px !important;
	width: auto !important;
}

.custom-tooltip-box {
	white-space: normal !important;
	word-break: break-word !important;
	word-wrap: break-word !important;
	overflow-wrap: break-word !important;
	text-align: center;
	display: block !important;
	box-sizing: border-box !important;
}
</style>
