<template>
	<v-sheet>
		<DesktopHomePage v-if="!isMobile"></DesktopHomePage>
		<MobileHomePage v-if="isMobile"></MobileHomePage>
	</v-sheet>
</template>

<script setup lang="ts">
useHead({
	title: '夢怜龍華汉化组 - 漫画列表',
	meta: [
		{
			name: 'description',
			content: '浏览和搜索漫画，发现新的漫画系列，并查看最新更新的章节。',
		},
		{
			name: 'keywords',
			content:
				'百合, 百合漫画,夢怜龍華, 夢怜龙华, 百合小说, 百合轻小说, 百合漫画推荐, 百合漫画阅读, 百合漫画更新',
		},
	],
});
useSeoMeta({
	ogTitle: '夢怜龍華汉化组 - 漫画列表',
	ogDescription: '浏览和搜索漫画，发现新的漫画系列，并查看最新更新的章节。',
});
const { isMobile } = useDevice();
</script>

<style scoped>
.card-item-wrapper {
	padding: 8px !important;
	box-sizing: border-box;
}

.my-custom-list .v-list-item {
	min-height: unset !important; /* 移除最小高度限制 */
	padding-top: 2px !important; /* 减小顶部内边距 */
	padding-bottom: 2px !important; /* 减小底部内边距 */
}
</style>
