//右键复制函数

export function useClipboard() {
	const { $tip } = useNuxtApp();

	const copyText = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			$tip('复制成功', { color: 'success', icon: 'mdi-check-circle' });
			return true;
		} catch (err) {
			console.error('复制失败', err);
			$tip('复制失败', { color: 'error', icon: 'mdi-alert-circle' });
			return false;
		}
	};

	return { copyText };
}
