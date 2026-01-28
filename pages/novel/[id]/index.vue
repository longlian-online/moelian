<template>
	<DesktopDetail
		v-if="!isMobile"
		btn-content="加入书架"
		recommended-title="推荐小说"
		content-type="novel"
	></DesktopDetail>
	<MobileDetail
		v-else
		btn-content="加入书架"
		recommended-title="推荐小说"
		content-type="novel"
	></MobileDetail>
</template>

<script setup lang="ts">
const { isMobile } = useDevice();
</script>

<style scoped></style>
