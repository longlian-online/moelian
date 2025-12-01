import { useTheme } from 'vuetify';
import { useCookie } from '#app';

// 主题表
const READER_THEME_PRESETS = {
	green: {
		name: '清新绿',
		background: '#effbef',
		onBackground: '#1A1A1A',
		primary: '#5c4033',
	},

	white: {
		name: '亮白模式',
		background: '#FFFFFF',
		onBackground: '#212121',
		primary: '#1A1A1A',
	},
	night: {
		name: '夜间模式',
		background: '#2B2B2B',
		onBackground: '#CCCCCC',
		primary: '#9CCC65',
	},

	lilyOrange: {
		name: '百合橘',
		background: '#FFF6E5',
		onBackground: '#4E342E',
		primary: '#FF9800',
	},

	eyeCare: {
		name: '护眼模式',
		background: '#EAF0E0',
		onBackground: '#3A4A3A',
		primary: '#8BC34A',
	},

	sepia: {
		name: '棕褐色',
		background: '#EAE4C8',
		onBackground: '#5B4636',
		primary: '#5B4636',
	},

	cherryPink: {
		name: '樱粉',
		background: '#FEE6E6',
		onBackground: '#4E342E',
		primary: '#E91E63',
	},

	elegantBlue: {
		name: '淡雅蓝',
		background: '#E0F7FA',
		onBackground: '#006064',
		primary: '#00BCD4',
	},
};

export function useReaderTheme() {
	const theme = useTheme();

	//共享ref。
	const themeChoice = useCookie<'green' | keyof typeof READER_THEME_PRESETS>(
		'reader-theme',
		{
			maxAge: 60 * 60 * 24 * 365,
			default: () => 'green',
		},
	);

	const applyReaderTheme = (key: keyof typeof READER_THEME_PRESETS) => {
		const validKey = key && READER_THEME_PRESETS[key] ? key : 'green';
		const preset = READER_THEME_PRESETS[validKey];

		const themeName = `reader-theme-${validKey}`;

		// 如果主题不存在，就创建
		if (!theme.themes.value[themeName]) {
			const base = theme.themes.value.light;
			theme.themes.value[themeName] = {
				...base,
				dark: validKey === 'night', // 夜间模式时用 dark
				colors: {
					...base.colors,
					background: preset.background,
					surface: preset.background,
					onBackground: preset.onBackground,
					primary: preset.primary,
				},
			};
		}
		theme.change(themeName);
		themeChoice.value = validKey;
	};

	return { themeChoice, applyReaderTheme, READER_THEME_PRESETS };
}
