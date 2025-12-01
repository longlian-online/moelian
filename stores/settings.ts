import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', () => {
	const cookieOptions = { maxAge: 60 * 60 * 24 * 365 }; // 一年

	// 小工具函数：强制将字符串转为布尔
	const boolCookie = (key: string, defaultValue: boolean) =>
		useCookie<boolean>(key, {
			default: () => defaultValue,
			...cookieOptions,
			decode: (value) => value === 'true',
			encode: (value) => String(value),
		});

	const isMangaVertical = boolCookie('isMangaVertical', false);
	const isNovelVertical = boolCookie('isNovelVertical', true);
	const pageLayout = boolCookie('pageLayout', false);
	const scrollDirection = boolCookie('scrollDirection', false);
	const readingMode = boolCookie('readingMode', false);

	const setSetting = (key: string, value: boolean) => {
		switch (key) {
			case 'isMangaVertical':
				isMangaVertical.value = value;
				break;
			case 'isNovelVertical':
				isNovelVertical.value = value;
				break;
			case 'pageLayout':
				pageLayout.value = value;
				break;
			case 'scrollDirection':
				scrollDirection.value = value;
				break;
			case 'readingMode':
				readingMode.value = value;
				break;
		}
	};

	return {
		isMangaVertical,
		isNovelVertical,
		pageLayout,
		scrollDirection,
		readingMode,
		setSetting,
	};
});
