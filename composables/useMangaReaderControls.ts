/** 共用阅读菜单触发，图片上的点击继续交给各模式的翻页逻辑。 */
export function useMangaReaderControls(
	sheet: Ref<boolean>,
	vertical: Ref<boolean>,
	navbarVisible?: Ref<boolean>,
) {
	let lastY = 0;
	let distance = 0;
	let direction = 0;
	let frame = 0;
	let pointer = { x: 0, y: 0 };
	const onPointerDown = (event: PointerEvent) => {
		pointer = { x: event.clientX, y: event.clientY };
	};
	const onClick = (event: MouseEvent) => {
		if (
			event.button !== 0 ||
			Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 10
		)
			return;
		const target = event.target instanceof Element ? event.target : null;
		if (
			!target?.closest('.v-main') ||
			target.closest(
				'button, a, input, .v-overlay, .manga-reader-bottom-sheet, .v-app-bar',
			)
		)
			return;
		const onPage = Array.from(
			document.querySelectorAll<HTMLImageElement>(
				'.manga-reader-surface .v-img__img',
			),
		).some((image) => {
			const rect = image.getBoundingClientRect();
			if (
				!rect.width ||
				!rect.height ||
				!image.naturalWidth ||
				!image.naturalHeight
			)
				return false;
			const scale = Math.min(
				rect.width / image.naturalWidth,
				rect.height / image.naturalHeight,
			);
			const width = image.naturalWidth * scale;
			const height = image.naturalHeight * scale;
			const left = rect.left + (rect.width - width) / 2;
			const top = rect.top + (rect.height - height) / 2;
			return (
				event.clientX >= left &&
				event.clientX <= left + width &&
				event.clientY >= top &&
				event.clientY <= top + height
			);
		});
		if (onPage || target.closest('.v-img')) {
			// 图片加载中仍视作页面，避免误操作。
			if (onPage || !target.closest('.v-img')?.querySelector('img')?.complete)
				return;
		}
		event.preventDefault();
		event.stopPropagation();
		sheet.value = !sheet.value;
	};
	const updateScroll = () => {
		frame = 0;
		const y = Math.max(0, window.scrollY);
		const delta = y - lastY;
		lastY = y;
		if (!vertical.value || Math.abs(delta) < 1) return;
		const nextDirection = delta > 0 ? 1 : -1;
		distance =
			nextDirection === direction
				? distance + Math.abs(delta)
				: Math.abs(delta);
		direction = nextDirection;
		if (distance >= 10) {
			// 滚动只控制顶部导航，完整阅读菜单保留手动呼出。
			sheet.value = false;
			if (navbarVisible) navbarVisible.value = direction < 0;
		}
	};
	const onScroll = () => {
		if (!frame) frame = requestAnimationFrame(updateScroll);
	};
	onMounted(() => {
		lastY = window.scrollY;
		document.addEventListener('pointerdown', onPointerDown, { passive: true });
		document.addEventListener('click', onClick, true);
		window.addEventListener('scroll', onScroll, { passive: true });
	});
	onBeforeUnmount(() => {
		document.removeEventListener('pointerdown', onPointerDown);
		document.removeEventListener('click', onClick, true);
		window.removeEventListener('scroll', onScroll);
		if (frame) cancelAnimationFrame(frame);
	});
}
