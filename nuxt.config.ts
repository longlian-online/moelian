// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-05-15',
	components: [
		{
			path: '~/components',
			pathPrefix: false, // 关闭路径前缀
		},
	],
	devtools: { enabled: true },
	typescript: {
		typeCheck: false,
	},
	modules: [
		// "@nuxt/test-utils/module",
		'@nuxt/eslint',
		'nuxt-auth-utils',
		'@pinia/nuxt',
		[
			'vuetify-nuxt-module',
			{
				vuetifyOptions: {
					theme: {
						defaultTheme: 'light',
						themes: {
							dark: {},
							light: {},
						},
					},
				},
				// 配置图标
				icons: {
					defaultSet: 'mdi', // 指定默认使用 mdi
					sets: {
						mdi: 'mdi', // 这里告诉 Vuetify 'mdi' 指的是 CSS 类名模式 (mdi-*)
					},
				},
			},
		],
		process.env.VITEST || process.env.NODE_ENV === 'test'
			? '@nuxt/test-utils/module'
			: null,
	],
	imports: {},
	alias: {},
	nitro: {
		experimental: {
			asyncContext: true,
			tasks: true,
		},
		scheduledTasks: {
			'0 0 1 * * ?': ['resource_clean'],
		},
	},
	serverDir: 'server',
	css: [
		'@mdi/font/css/materialdesignicons.min.css', // 引用本地安装的包
		'vuetify/lib/styles/main.sass',
	],
	build: {
		transpile: ['vuetify'],
	},
	vite: {
		vue: {},
		resolve: {
			alias: {
				'.prisma/client/index-browser':
					'./node_modules/.prisma/client/index-browser.js',
				'.prisma': './node_modules/.prisma',
			},
		},
	},

	runtimeConfig: {
		privateRoute: ['/api/admin'],
		public: {
			appName: 'loc',
			siteUrl:
				process.env.NUXT_PUBLIC_SITE_URL ||
				'https://moelian.neo.longlian.online',
			logoUrl:
				'https://loc-1308050490.cos.ap-guangzhou.myqcloud.com/Public/logo.png',
			defaultAvatar:
				'https://loc-1308050490.cos.ap-guangzhou.myqcloud.com/Default/Avatar',
			defaultCover:
				'https://loc-1308050490.cos.ap-guangzhou.myqcloud.com/Default/Cover',
		},
		storage: {
			cos: {
				secretId: process.env.NUXT_STORAGE_COS_SECRET_ID,
				secretKey: process.env.NUXT_STORAGE_COS_SECRET_KEY,
				bucket: process.env.NUXT_STORAGE_COS_BUCKET,
				region: process.env.NUXT_STORAGE_COS_REGION,
				url: process.env.NUXT_STORAGE_COS_URL,
				domain: process.env.NUXT_STORAGE_COS_DOMAIN,
			},
		},
		nats: {
			server: process.env.NUXT_NATS_SERVER,
			token: process.env.NUXT_NATS_TOKEN,
		},
	},

	routeRules: {
		'/': { redirect: { to: '/manga', statusCode: 301 } },
		// 匹配所有以 /admin/ 开头的路由,关闭ssr
		'/admin/**': { ssr: false },
		//  关闭 /login 路径的 SSR
		'/login': { ssr: false },
	},

	app: {
		head: {
			htmlAttrs: {
				lang: 'zh-CN',
			},
			link: [
				{
					rel: 'icon',
					type: 'image/png',
					href: '/favicon.png',
				},
			],
		},
	},
});
