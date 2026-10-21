/** public 静态资源路径统一在此维护；组件使用语义名称，不依赖文件格式。 */
export const publicAssets = {
	defaultCover: '/default.webp',
	imageError: '/error-default.webp',
	notFound: '/404-error.webp',
	networkError: '/network-error.webp',
	bookmarkBase: '/bookmarks/base.webp',
	bookmarkPink: '/bookshelf-bookmark-pink.webp',
	error: '/error.webp',
	shareHands: '/novel-share-yuri-hands.webp',
	shareLily: '/novel-share-yuri-lily.webp',
	logo: '/moelian-logo.png',
	loginLogo: '/logo2.png',
	orangeLogo: '/moelian-orange.png',
	bilibiliQr: '/community/bilibili.svg',
	yamiboQr: '/community/yamibo.svg',
	qqChatQr: '/community/qq-chat.svg',
	qqJoinQr: '/community/qq-join.svg',
	artworks: Array.from({ length: 13 }, (_, index) =>
		`/bookmarks/art-${String(index + 1).padStart(2, '0')}.webp`,
	),
} as const;
