<script setup lang="ts">
const visible = ref(false);
const footerOffset = ref(0);
const route = useRoute();

onMounted(() => {
	const updateVisibility = () => {
		visible.value = window.scrollY > Math.max(480, window.innerHeight);
		const footer = document.querySelector<HTMLElement>('footer.site-footer');
		footerOffset.value = footer
			? Math.max(0, window.innerHeight - footer.getBoundingClientRect().top)
			: 0;
	};
	updateVisibility();
	window.addEventListener('scroll', updateVisibility, { passive: true });
	window.addEventListener('resize', updateVisibility, { passive: true });
	const stopWatching = watch(
		() => route.fullPath,
		async () => {
			await nextTick();
			updateVisibility();
		},
	);
	onBeforeUnmount(() => {
		window.removeEventListener('scroll', updateVisibility);
		window.removeEventListener('resize', updateVisibility);
		stopWatching();
	});
});

const backToTop = () => {
	const reducedMotion = window.matchMedia(
		'(prefers-reduced-motion: reduce)',
	).matches;
	window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
};
</script>

<template>
	<Transition name="back-top">
		<v-btn
			v-if="visible"
			class="back-to-top"
			:style="{ '--footer-offset': `${footerOffset}px` }"
			variant="flat"
			aria-label="回到顶部"
			title="回到顶部"
			@click="backToTop"
		>
			<v-icon icon="mdi-arrow-up" size="20" />
			<span class="back-to-top-label" aria-hidden="true">TOP</span>
		</v-btn>
	</Transition>
</template>

<style scoped>
.back-to-top {
	position: fixed;
	right: 24px;
	bottom: calc(
		24px + env(safe-area-inset-bottom, 0px) + var(--footer-offset, 0px)
	);
	z-index: 1000;
	width: 52px;
	min-width: 0;
	height: 56px;
	padding: 0;
	border: 1px solid #e1cbbb;
	border-radius: 14px 14px 6px 6px;
	background: #fff8ed;
	color: #a27667;
	box-shadow: 0 4px 16px rgb(105 72 55 / 12%);
}
.back-to-top :deep(.v-btn__content) {
	flex-direction: column;
	gap: 2px;
}
.back-to-top-label {
	font-size: 9px;
	font-weight: 600;
	letter-spacing: 1px;
}
.back-to-top:focus-visible {
	outline: 2px solid #ad7d70;
	outline-offset: 3px;
}
.back-top-enter-active,
.back-top-leave-active {
	transition:
		opacity 180ms ease,
		transform 180ms ease;
}
.back-top-enter-from,
.back-top-leave-to {
	opacity: 0;
	transform: translateY(8px);
}
@media (max-width: 760px) {
	.back-to-top {
		right: 16px;
		bottom: calc(
			20px + env(safe-area-inset-bottom, 0px) + var(--footer-offset, 0px)
		);
		width: 44px;
		height: 48px;
	}
}
@media (prefers-reduced-motion: reduce) {
	.back-top-enter-active,
	.back-top-leave-active {
		transition: none;
	}
}
</style>
