<template>
	<div>
		<DesktopDetail
			v-if="!isMobile"
			btn-content="收藏"
			recommended-title="推荐漫画"
			content-type="manga"
		></DesktopDetail>
	</div>
</template>

<script setup lang="ts">
const { isMobile } = useDevice();
</script>

<style scoped></style>
