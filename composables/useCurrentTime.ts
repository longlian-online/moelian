/**
 * 一个响应式的 Composable，用于获取并更新当前时间。
 * 该函数仅在分钟数变化时才进行更新，以提高性能。
 * @returns 包含格式化时间的响应式引用
 */
export function useCurrentTime() {
	const currentTime = ref(new Date());
	let timer: ReturnType<typeof setTimeout> | null = null;

	const formattedTime = computed(() => {
		const now = currentTime.value;
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
	});

	/**
	 * 安排下一次时间更新。递归调用，以每分钟精确地更新一次时间。
	 */
	const scheduleNextUpdate = () => {
		const now = new Date();
		//计算距离下一分钟开始还有多少毫秒
		const msUntilNextMinute =
			(60 - now.getSeconds()) * 1000 - now.getMilliseconds();

		timer = setTimeout(
			() => {
				currentTime.value = new Date();
				scheduleNextUpdate();
			},
			Math.max(0, msUntilNextMinute),
		);
	};

	onMounted(scheduleNextUpdate);

	onUnmounted(() => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	});

	return { formattedTime };
}
