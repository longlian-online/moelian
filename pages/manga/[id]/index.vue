<template>
	<div>
		<DesktopDetail
			v-if="!isMobile"
			btn-content="收藏"
			recommended-title="推荐漫画"
			content-type="manga"
		></DesktopDetail>
		<MobileDetail
			v-else
			btn-content="收藏"
			recommended-title="推荐漫画"
			content-type="manga"
		></MobileDetail>
	</div>
</template>

<script setup lang="ts">
const { isMobile } = useDevice();
</script>

<style scoped></style>
