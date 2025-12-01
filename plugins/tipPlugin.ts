import { useTipStore } from '#imports';

export default defineNuxtPlugin(() => {
	const tipStore = useTipStore();

	return {
		provide: {
			tip: tipStore.show,
		},
	};
});
