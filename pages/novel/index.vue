<template>
	<div>
		<DesktopNovelHomePage v-if="!isMobile"></DesktopNovelHomePage>
		<MobileNovelHomePage v-if="isMobile"></MobileNovelHomePage>
	</div>
</template>

<script setup lang="ts">
const { isMobile } = useDevice();

useHead({
	title: '夢怜龍華汉化组 - 小说列表',
	meta: [
		{
			name: 'description',
			content: '浏览和搜索小说，发现新的小说系列，并查看最新更新的章节。',
		},
		{
			name: 'keywords',
			content:
				'百合, 百合小说, 夢怜龍華, 夢怜龙华, 百合轻小说, 百合小说推荐, 百合小说阅读, 百合小说更新',
		},
	],
});
</script>

<style scoped></style>
