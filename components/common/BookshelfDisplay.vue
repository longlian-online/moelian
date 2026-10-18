<template>
	<div class="shelf-display" :class="{ 'shelf-page--mobile': props.mobile }">
		<v-card class="mx-auto my-card-container bookshelf" flat>
			<slot />

			<template v-for="(shelf, shelfIndex) in shelves" :key="shelfIndex">
				<v-row dense class="cards-grid" no-gutters>
					<div class="shelf-decoration" aria-hidden="true">
						<div v-for="n in 3" :key="n" class="decoration-spine">
							<div class="spine-brand">
								<svg
									class="spine-brand-orange"
									viewBox="600 165 300 400"
									xmlns="http://www.w3.org/2000/svg"
								>
									<image href="/moelian-logo.png" width="2172" height="724" />
								</svg>
							</div>
						</div>
					</div>
					<div class="shelf-books-grid">
						<v-col
							v-for="card in shelf"
							:key="card.id"
							class="mb-4 book-col"
							cols="12"
							sm="6"
							md="3"
							lg="3"
							xl="3"
							style="padding: 0 2px"
						>
							<v-card ripple class="my-card">
								<div class="book-preview">
									<Book3D
										homepage
										:cover-url="card.coverUrl"
										:title="card.title"
										:author="card.author"
										:spine-width="50"
										:width="260"
										:height="400"
										:show-title="false"
										:to="bookUrl(card)"
									>
									</Book3D>
								</div>

								<v-tooltip
									v-if="!props.mobile"
									activator="parent"
									location="bottom"
									:open-delay="0"
									:close-delay="0"
									transition="fade-transition"
									:max-width="320"
									content-class="shelf-work-tooltip"
								>
									<div class="shelf-tooltip-title">{{ card.title }}</div>
									<div>作者：{{ card.author || '未知' }}</div>
									<div>
										{{
											card.serialType === 'Serializing' ? '连载中' : '已完结'
										}}
										· {{ card.lastNo ?? 0 }} 章
									</div>
								</v-tooltip>
							</v-card>
						</v-col>
					</div>
				</v-row>
				<div class="shelf-board">
					<div class="shelf-labels">
						<NuxtLink
							v-for="card in shelf"
							:key="card.id"
							:to="bookUrl(card)"
							class="shelf-title-label"
							:title="`${card.title} · ${card.author || '未知作者'}`"
						>
							<span class="shelf-book-title">{{ card.title }}</span>
							<span class="shelf-book-author">{{
								card.author || '未知作者'
							}}</span>
						</NuxtLink>
					</div>

					<div
						v-for="side in ['left', 'right']"
						:key="side"
						class="shelf-bracket"
						aria-hidden="true"
						:class="`shelf-bracket--${side}`"
					>
						<svg
							class="shelf-bracket-orange"
							viewBox="600 165 300 400"
							xmlns="http://www.w3.org/2000/svg"
						>
							<image href="/moelian-logo.png" width="2172" height="724" />
						</svg>
					</div>
				</div>
			</template>
		</v-card>
	</div>
</template>
<script setup lang="ts">
import type { WorkListRes } from '~/shared/dto/web/work';
type ShelfWork = WorkListRes['list'][number] & { type?: string };
const props = withDefaults(
	defineProps<{
		works: ShelfWork[];
		mobile?: boolean;
		contentType?: 'manga' | 'novel';
	}>(),
	{ mobile: false, contentType: 'manga' },
);
const shelves = computed(() => {
	const columns = props.mobile ? 2 : 4;
	const rows: ShelfWork[][] = [];
	for (let i = 0; i < props.works.length; i += columns)
		rows.push(props.works.slice(i, i + columns));
	return rows;
});
const bookUrl = (work: ShelfWork) =>
	`/${work.type ? (work.type === 'Novel' ? 'novel' : 'manga') : props.contentType}/${work.id}`;
</script>
<style scoped>
.bookshelf-infinite {
	width: 100%;
	min-width: 0;
	overflow: visible;
}
.bookshelf-infinite > .bookshelf {
	width: 100%;
	flex-shrink: 0;
	margin-inline: 0 !important;
}
/* 单向加载不需要顶部状态区，避免多出一条空白。 */
.bookshelf-infinite :deep(.v-infinite-scroll__side:first-child) {
	display: none;
}
.bookshelf-load-status {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 18px 12px;
	color: #707766;
	font-size: 13px;
}
/* 骨架屏样式 - 强制覆盖 */
.skeleton-book :deep(.v-skeleton-loader__bone.v-skeleton-loader__image) {
	height: 400px !important;
	min-height: 400px !important;
	max-height: 400px !important;
}

/* 基础容器 */
.my-card-container {
	padding: 0 !important;
}

.my-card {
	background: white !important;
	box-shadow: 0 20px 40px -10px rgba(125, 90, 90, 0.15) !important;
	overflow: hidden !important;
	width: 100%;
	display: flex;
	flex-direction: column;
	border-radius: 16px;
	/* 移除整体边框，只在信息区域添加边框 */
	transition: all 0.3s ease;
}

/* 卡片列间距调整 - 增加间距 */
.book-col {
	padding: 0 16px !important;
	margin-bottom: 32px !important;
}

/* 确保 v-lazy 容器铺满 */
.my-card .book-preview {
	width: 100% !important;
	display: block;
}

/* Book3D 组件居中显示 */
.my-card :deep(.book-3d-container) {
	width: 100% !important;
	height: 400px !important;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 0 !important;
	margin: 0 !important;
	overflow: hidden;
	box-sizing: border-box;
}

/* Book3D wrapper 保持原尺寸，居中显示 */
.my-card :deep(.book-3d-wrapper) {
	/* 移除强制铺满，让组件使用自己的宽度计算，居中显示 */
	height: 100% !important;
}

.my-card :deep(.book-cover-main) {
	width: 100% !important;
	height: 100% !important;
	/* 封面主体铺满 */
}

/* 确保封面图片铺满 */
.my-card :deep(.book-cover-image) {
	width: 100% !important;
	height: 100% !important;
}

/* 百合二次元风格卡片信息区样式 */
.yuri-card-info {
	padding: 20px;
	background: white;
	border-top: 1px solid #f2ece6; /* 只在信息区域顶部添加边框，分隔封面和信息 */
	width: 100%;
	box-sizing: border-box;
	/* 确保信息区域宽度和封面容器一致 */
	max-width: 100%;
}

.yuri-title {
	font-size: 18px;
	font-weight: 700;
	color: #5a463d;
	margin-bottom: 16px;
	letter-spacing: -0.01em;
	line-height: 1.3;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.yuri-title:hover {
	color: #ff758c;
}

.yuri-author-tags-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24px;
}

.yuri-author-info {
	position: relative;
	flex: 1;
	min-width: 0;
}

.yuri-author-line {
	display: flex;
	align-items: baseline;
	gap: 6px;
}

.yuri-by-text {
	font-size: 10px;
	font-weight: 900;
	color: #ff9a9e;
	text-transform: uppercase;
	letter-spacing: -0.02em;
}

.yuri-author-name {
	font-size: 14px;
	font-weight: 700;
	color: #7d5a5a;
	cursor: pointer;
	transition: color 0.2s ease;
	max-width: 80px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.yuri-author-name:hover {
	color: #ff758c;
}

.yuri-author-underline {
	margin-top: 4px;
	width: 100%;
	height: 2px;
	background: linear-gradient(to right, #ff9a9e, transparent);
	border-radius: 9999px;
}

.yuri-tags-group {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
	justify-content: flex-end;
}

.yuri-tag {
	padding: 4px 8px;
	border-radius: 6px;
	font-size: 9px;
	font-weight: 700;
	white-space: nowrap;
	border: 1px solid;
}

.length-tag {
	background: #fcf8f2;
	color: #c9c1ab;
	border-color: #e8dfd5;
}

.serializing-tag {
	background: #fff0f3;
	color: #ff758c;
	border-color: #ffcad4;
}

.finished-tag {
	background: #f0fff4;
	color: #2ed573;
	border-color: #b7ebc6;
}

.yuri-concentration-section {
	padding-top: 16px;
	border-top: 1px solid #f2ece6;
}

.yuri-concentration-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.yuri-concentration-label {
	display: flex;
	align-items: center;
	gap: 6px;
}

.yuri-heart-icon {
	width: 14px;
	height: 14px;
	color: #ff758c;
}

.yuri-concentration-text {
	font-size: 11px;
	font-weight: 800;
	color: #9a8471;
	text-transform: uppercase;
	letter-spacing: 0.1em;
}

.yuri-concentration-value {
	font-size: 12px;
	font-weight: 900;
	color: #ff758c;
}

.yuri-progress-bar {
	height: 8px;
	width: 100%;
	background: #f2ece6;
	border-radius: 9999px;
	overflow: hidden;
	padding: 1px;
}

.yuri-progress-fill {
	height: 100%;
	background: linear-gradient(to right, #ff9a9e, #ff758c, #fecfef);
	border-radius: 9999px;
	transition: width 0.7s ease;
}

/* 卡片悬停效果 */
.my-card:hover {
	box-shadow: 0 25px 50px -12px rgba(125, 90, 90, 0.25) !important;
	transform: translateY(-4px);
}

.my-card:hover .yuri-card-info {
	background: #fefcf9;
}

/* 移除卡片 hover 时作者名变色，只保留作者名自身 hover 效果 */
.my-card:hover .yuri-progress-fill {
	background: linear-gradient(to right, #ff9a9e, #ff758c, #ff9a9e);
}
/* 固定书本尺寸、横向陈列与独立层板，避免将书架切成卡片。 */
.shelf-page {
	padding: 0;
}
.shelf-page > .content-row {
	margin: 0;
}
.shelf-page > .content-row > .v-col {
	padding: 0;
}
.bookshelf {
	--wood:
		repeating-linear-gradient(
			1deg,
			transparent 0 3px,
			rgba(142, 104, 56, 0.055) 4px 5px,
			transparent 6px 11px
		),
		linear-gradient(95deg, #eedec0, #f6e9cc 35%, #e9d8b7 75%, #f3e5c6);
	border-radius: 0;
	border-top: 0;
	padding-top: 38px !important;
	padding-bottom: 100px !important;
	background:
		repeating-linear-gradient(
			0deg,
			transparent 0 13px,
			rgba(255, 255, 255, 0.035) 14px 17px,
			transparent 18px 33px
		),
		linear-gradient(#bfa598, #d3bbae 100px, #d1b9ab);
	box-shadow: inset 0 16px 25px rgba(79, 50, 32, 0.12) !important;
}
.bookshelf::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 38px;
	background: var(--wood);
}
.bookshelf .cards-grid {
	position: relative;
	--decoration-width: clamp(100px, 13vw, 190px);
	--shelf-book-height: clamp(180px, calc(28vw - 55px), 330px);
	display: block;
	padding: 32px 40px 0 calc(var(--decoration-width) + 24px);
	/* 层板遮住向下错开的底板，让封面底边直接落在板面上。 */
	margin: 0 auto -14px;
}
.shelf-books-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 238px));
	gap: clamp(14px, 2.4vw, 34px);
	justify-content: center;
	align-items: end;
	width: 100%;
}
.bookshelf .book-col {
	width: 100%;
	min-width: 0;
	max-width: none;
	padding: 0 !important;
	margin: 0 !important;
}
.bookshelf .my-card,
.bookshelf .my-card:hover {
	background: transparent !important;
	box-shadow: none !important;
	transform: none;
	border-radius: 0;
	overflow: visible !important;
}
.bookshelf .my-card .book-preview {
	min-height: 0 !important;
	margin: 0 !important;
}
.bookshelf .my-card :deep(.book-3d-container) {
	height: var(--shelf-book-height) !important;
	align-items: flex-end;
	overflow: visible;
	background: transparent;
}
.bookshelf .my-card :deep(.book-3d-wrapper) {
	width: calc(var(--shelf-book-height) * 0.72) !important;
	max-width: 100%;
}
.shelf-decoration {
	position: absolute;
	left: 4px;
	bottom: 14px;
	width: var(--decoration-width);
	display: flex;
	align-items: flex-end;
	gap: 1px;

	height: calc(var(--shelf-book-height) - 14px);
	margin-bottom: 0;
	padding-right: calc(var(--decoration-width) * 0.36);
}
.decoration-spine {
	position: relative;
	flex: 1;
	height: 100%;
	border-radius: 7px 7px 2px 2px;
	background: linear-gradient(
		to bottom,
		#ae8589 0 17%,
		#bd9c8c 17% 34%,
		#fff6e6 34% 35.5%,
		#bd9c8c 35.5% 66%,
		#fff6e6 66% 67.5%,
		#bd9c8c 67.5% 83%,
		#ae8589 83%
	);
}
.decoration-spine:last-child {
	transform: translateY(9px) rotate(-14deg);
	transform-origin: left top;
	margin-left: -3px;
}
.spine-brand {
	position: absolute;
	inset: 0;
	container-type: inline-size;
	pointer-events: none;
}
.spine-brand-orange {
	position: absolute;
	width: 68%;
	height: auto;
	aspect-ratio: 3 / 4;
	left: 16%;
	top: 50%;
	transform: translateY(-50%);
	overflow: hidden;
}
.shelf-board {
	position: relative;
	z-index: 1;
	height: 56px;
	background: var(--wood);
	border-top: 2px solid #f9eed9;
	box-shadow: 0 16px 22px rgba(89, 59, 39, 0.14);
}
.shelf-labels {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	z-index: 20;
	--decoration-width: clamp(100px, 13vw, 190px);
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 238px));
	gap: clamp(14px, 2.4vw, 34px);
	justify-content: center;
	align-items: center;
	height: 100%;
	padding: 0 40px 0 calc(var(--decoration-width) + 24px);
}
.shelf-title-label {
	display: block;
	justify-self: center;
	max-width: calc(100% - 16px);
	padding: 2px 16px;
	border: 1px solid transparent;
	background: transparent;
	color: #78563d;
	font-family: 'Songti SC', 'STSong', 'Noto Serif CJK SC', 'SimSun', serif;
	font-size: 16px;
	font-weight: 500;
	letter-spacing: 1.5px;
	text-shadow: 0 1px 0 rgba(255, 255, 255, 0.85);
	line-height: 23px;
	text-align: center;
	text-decoration: none;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.shelf-book-title,
.shelf-book-author {
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.shelf-book-author {
	margin-top: 3px;
	font-size: 12px;
	line-height: 16px;
	letter-spacing: 0.5px;
	color: #a17d5d;
}
.shelf-title-label:hover,
.shelf-title-label:focus-visible {
	background: #fff8e8;
	outline: 1px solid #c8a276;
	outline-offset: 1px;
}
.shelf-bracket {
	position: absolute;
	top: 100%;
	width: 64px;
	height: 52px;
	background:
		linear-gradient(#ac8874 0 13px, transparent 13px),
		linear-gradient(
			90deg,
			transparent 13px,
			#b99681 13px 51px,
			transparent 51px
		);
	border-radius: 0 0 4px 4px;
}
.shelf-bracket--left {
	left: 10%;
}
.shelf-bracket--right {
	right: 10%;
}
.shelf-bracket-orange {
	position: absolute;
	width: 15px;
	height: 20px;
	left: 50%;
	top: 25px;
	transform: translateX(-50%);
	overflow: hidden;
}
@media (max-width: 960px) {
	.bookshelf .cards-grid {
		padding: 28px 24px 0 calc(var(--decoration-width) + 16px);
	}
	.shelf-labels {
		padding-inline: calc(var(--decoration-width) + 16px) 24px;
	}
}
.mobile-bookshelf-tabs {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	z-index: 2;
	display: flex;
	justify-content: center;
	align-items: stretch;
	gap: 24px;
	height: 36px;
}
.mobile-bookshelf-tab {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 74px;
	padding: 0 16px;
	color: #a48b70;
	font-size: 14px;
	font-family: 'Songti SC', 'STSong', serif;
	font-weight: 500;
	letter-spacing: 2px;
	text-decoration: none;
	-webkit-tap-highlight-color: transparent;
}
.mobile-bookshelf-tab--active {
	color: #705039;
	font-weight: 700;
}
.mobile-bookshelf-tab--active::after {
	content: '';
	position: absolute;
	bottom: 2px;
	left: calc(50% - 12px);
	width: 24px;
	height: 3px;
	border-radius: 3px;
	background: #e49c5b;
}
.mobile-bookshelf-tab:focus-visible {
	outline: 2px solid #bd8f5e;
	outline-offset: -3px;
}
/* 移动主页：两列书架，使用相同作品数据和链接。 */
.shelf-page--mobile .bookshelf {
	padding-top: 44px !important;
	padding-bottom: 48px !important;
}
.shelf-page--mobile .bookshelf::before {
	height: 44px;
}
.shelf-page--mobile .mobile-bookshelf-tabs {
	height: 44px;
}
.shelf-page--mobile .mobile-bookshelf-tab--active::after {
	bottom: 8px;
}
.shelf-page--mobile .shelf-decoration {
	display: none;
}
.shelf-page--mobile .bookshelf .cards-grid {
	--shelf-book-height: clamp(160px, calc(70vw - 36px), 320px);
	padding: 26px 20px 0;
}
.shelf-page--mobile .shelf-books-grid,
.shelf-page--mobile .shelf-labels {
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20px;
}
.shelf-page--mobile .shelf-labels {
	padding: 0 20px;
}
.shelf-page--mobile .shelf-board {
	height: 44px;
}
.shelf-page--mobile .shelf-title-label {
	width: 100%;
	max-width: 100%;
	padding: 1px 4px;
	font-size: 13px;
	line-height: 14px;
	letter-spacing: 0.5px;
}
.shelf-page--mobile .shelf-book-title {
	display: -webkit-box;
	line-clamp: 2;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	white-space: normal;
	overflow-wrap: anywhere;
}
.shelf-page--mobile .shelf-book-author {
	font-size: 11px;
	line-height: 12px;
	margin-top: 1px;
}
.shelf-page--mobile .shelf-bracket {
	display: none;
}
.shelf-page--mobile .shelf-title-label:hover {
	background: transparent;
	outline: none;
}
</style>

<style scoped>
.shelf-display {
	width: 100%;
	min-width: 0;
	flex-shrink: 0;
}
</style>
