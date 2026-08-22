<script setup lang="ts">
const route = useRoute();
const requestUrl = useRequestURL();
const config = useRuntimeConfig();

const siteOrigin = computed(() => {
	const configuredUrl = config.public.siteUrl?.trim();
	return (configuredUrl || requestUrl.origin).replace(/\/$/, '');
});

const canonicalUrl = computed(
	() => `${siteOrigin.value}${route.path === '/' ? '/' : route.path}`,
);

useHead({
	titleTemplate: (title) => title || '夢怜龍華汉化组',
	link: [{ rel: 'canonical', href: canonicalUrl }],
	script: [
		{
			type: 'application/ld+json',
			innerHTML: computed(() =>
				JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'WebSite',
					name: '夢怜龍華汉化组',
					url: `${siteOrigin.value}/`,
					inLanguage: 'zh-CN',
				}),
			),
		},
	],
});

useSeoMeta({
	description:
		'夢怜龍華汉化组在线阅读平台，提供百合漫画、百合小说及其最新章节。',
	robots: 'index, follow, max-image-preview:large',
	ogSiteName: '夢怜龍華汉化组',
	ogType: 'website',
	ogLocale: 'zh_CN',
	ogUrl: canonicalUrl,
	twitterCard: 'summary_large_image',
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
