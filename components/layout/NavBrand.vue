<script setup lang="ts">
import { publicAssets } from '~/utils/assets';
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });
const logoUrl = useRuntimeConfig().public.logoUrl;
</script>

<template>
	<NuxtLink
		class="nav-brand"
		:class="{ 'nav-brand--compact': compact }"
		to="/manga"
		aria-label="moelian × 夢怜龍華，返回首页"
	>
		<img
			class="brand-moelian"
			:src="publicAssets.logo"
			width="112"
			height="38"
			alt="moelian"
		/>
		<svg
			class="brand-cross"
			viewBox="0 0 40 40"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M8 7C12 7 16 13 20 17C24 13 28 7 32 7C32 11 26 17 23 20C26 23 32 29 32 33C28 33 24 27 20 23C16 27 12 33 8 33C8 29 14 23 17 20C14 17 8 11 8 7Z"
			/>
		</svg>
		<img
			class="brand-chinese"
			:src="logoUrl"
			width="100"
			height="48"
			alt="夢怜龍華"
		/>
	</NuxtLink>
</template>

<style scoped>
.nav-brand {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex: 0 0 auto;
	text-decoration: none;
}
.brand-moelian {
	display: block;
	width: 112px;
	height: 38px;
	object-fit: contain;
}
.brand-chinese {
	display: block;
	width: 100px;
	height: 48px;
	object-fit: contain;
	filter: brightness(0) saturate(100%) invert(34%) sepia(15%) saturate(790%)
		hue-rotate(337deg) brightness(94%) contrast(88%);
}
.brand-cross {
	width: 18px;
	height: 18px;
	fill: #b49a83;
	flex-shrink: 0;
}
.nav-brand:focus-visible {
	outline: 2px solid #b78079;
	outline-offset: 4px;
	border-radius: 4px;
}
.nav-brand--compact {
	gap: 6px;
}
.nav-brand--compact .brand-moelian {
	width: 86px;
	height: 34px;
}
.nav-brand--compact .brand-chinese {
	width: 80px;
	height: 40px;
}
.nav-brand--compact .brand-cross {
	width: 14px;
	height: 14px;
}
</style>
