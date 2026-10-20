import { onBeforeUnmount, onMounted, ref } from 'vue';

/** 点按可修改返回值；滚动累计超过阈值后再切换，避免手指轻微抖动。 */
export function useScrollReveal(initialVisible = false) {
	const visible = ref(initialVisible);
	onMounted(() => {
		let previousY = Math.max(0, window.scrollY);
		let distance = 0;
		const onScroll = () => {
			const y = Math.max(0, window.scrollY);
			const delta = y - previousY;
			previousY = y;
			if (!delta) return;
			distance =
				Math.sign(delta) === Math.sign(distance) ? distance + delta : delta;
			if (Math.abs(distance) >= 8) visible.value = distance < 0;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
	});
	return visible;
}
