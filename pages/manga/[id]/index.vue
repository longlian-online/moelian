<template>
	<WorkDetail
		:mobile="isMobile"
		btn-content="收藏"
		recommended-title="推荐漫画"
		content-type="manga"
	/>
</template>

<script setup lang="ts">
const { isMobile } = useDevice();
</script>
