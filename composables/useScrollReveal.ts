import {
	onBeforeUnmount,
	onMounted,
	ref,
	toValue,
	watch,
	type MaybeRefOrGetter,
} from 'vue';

/** 各阅读模式共享方向累计；导航可额外指定顶部和搜索展开时强制显示。 */
export function useScrollReveal(
	initialVisible = false,
	options: {
		showAtTop?: MaybeRefOrGetter<number>;
		alwaysVisible?: MaybeRefOrGetter<boolean>;
		clampToDocument?: boolean;
		animationFrame?: boolean;
	} = {},
) {
	const visible = ref(initialVisible);
	let previousY = 0;
	let distance = 0;
	let frame = 0;
	const readY = () =>
		Math.max(
			0,
			options.clampToDocument
				? Math.min(
						window.scrollY,
						document.documentElement.scrollHeight - window.innerHeight,
					)
				: window.scrollY,
		);
	const update = () => {
		frame = 0;
		const y = readY();
		const delta = y - previousY;
		previousY = y;
		if (
			toValue(options.alwaysVisible) ||
			y <= (toValue(options.showAtTop) ?? -1)
		) {
			visible.value = true;
			distance = 0;
			return;
		}
		if (!delta) return;
		distance =
			Math.sign(delta) === Math.sign(distance) ? distance + delta : delta;
		if (Math.abs(distance) >= 8) visible.value = distance < 0;
	};
	const onScroll = () => {
		if (!options.animationFrame) update();
		else if (!frame) frame = requestAnimationFrame(update);
	};
	watch(
		() => toValue(options.alwaysVisible),
		(force) => {
			if (force) visible.value = true;
		},
	);
	onMounted(() => {
		previousY = readY();
		window.addEventListener('scroll', onScroll, { passive: true });
	});
	onBeforeUnmount(() => {
		window.removeEventListener('scroll', onScroll);
		if (frame) cancelAnimationFrame(frame);
	});
	return visible;
}
