import { createRandomArtworkPicker } from '~/utils/artwork';

export function useRandomArtwork() {
	// useId 在 SSR 与水合时一致；useState 随 Nuxt payload 传递且隔离请求。
	const key = `random-artwork:${useId()}`;
	const state = useState<Record<string, string>>(key, () => ({}));
	// 离开组件后释放选图，下次进入重新随机。
	onBeforeUnmount(() => clearNuxtState(key));
	return createRandomArtworkPicker(state.value);
}
