<template>
	<WorkDetail
		:mobile="isMobile"
		btn-content="加入书架"
		recommended-title="推荐小说"
		content-type="novel"
	/>
</template>

<script setup lang="ts">
const { isMobile } = useDevice();
</script>
