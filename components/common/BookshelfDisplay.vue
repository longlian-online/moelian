<template>
	<div class="shelf-display" :class="{ 'shelf-page--mobile': props.mobile }">
		<v-card class="mx-auto my-card-container bookshelf" flat>
			<slot />

			<template v-for="(shelf, shelfIndex) in shelves" :key="shelfIndex">
				<v-row dense class="cards-grid" no-gutters>
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
							<ShelfBookmark
								v-if="!props.mobile"
								class="shelf-bookmark"
								:to="bookUrl(card)"
								:title="card.title"
								:author="card.author"
							/>
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
						<img
							class="shelf-bracket-orange"
							:src="publicAssets.orangeLogo"
							alt=""
						/>
					</div>
				</div>
			</template>
		</v-card>
	</div>
</template>
<script setup lang="ts">
import { publicAssets } from '~/utils/assets';
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
	transition: all 0.3s ease;
}
.book-col {
	padding: 0 16px !important;
	margin-bottom: 32px !important;
}
.my-card .book-preview {
	width: 100% !important;
	display: block;
}
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
.my-card :deep(.book-3d-wrapper) {
	height: 100% !important;
}

.my-card :deep(.book-cover-main) {
	width: 100% !important;
	height: 100% !important;
}
.my-card :deep(.book-cover-image) {
	width: 100% !important;
	height: 100% !important;
}
.my-card:hover {
	box-shadow: 0 25px 50px -12px rgba(125, 90, 90, 0.25) !important;
	transform: translateY(-4px);
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
	padding-top: 22px !important;
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
	height: 22px;
	background: var(--wood);
}
.bookshelf .cards-grid {
	position: relative;
	--decoration-width: clamp(100px, 13vw, 190px);
	--shelf-book-height: clamp(180px, calc(28vw - 55px), 330px);
	display: block;
	padding: 32px 40px 0 calc(var(--decoration-width) + 24px);
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
.bookshelf .my-card :deep(.book-3d-container.book-3d-home .book-3d-wrapper) {
	width: calc(var(--shelf-book-height) * 0.72) !important;
	max-width: 100%;
}
.shelf-board {
	position: relative;
	z-index: 1;
	height: 22px;
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
.shelf-page--mobile .bookshelf {
	padding-top: 44px !important;
	padding-bottom: 48px !important;
}
.shelf-page--mobile .bookshelf::before {
	height: 44px;
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
.shelf-display {
	width: 100%;
	min-width: 0;
	flex-shrink: 0;
}
.shelf-display:not(.shelf-page--mobile) .cards-grid {
	padding: 32px 112px 0 32px;
}
.shelf-display:not(.shelf-page--mobile) .shelf-books-grid {
	grid-template-columns: repeat(4, minmax(0, 238px));
	gap: clamp(84px, 7vw, 118px);
}
.shelf-display:not(.shelf-page--mobile) .book-col {
	position: relative;
}
.shelf-display:not(.shelf-page--mobile) .shelf-labels {
	display: none;
}
.shelf-display .shelf-bookmark {
	position: absolute;
	z-index: 3;
	top: -60px;
	left: calc(100% + 10px);
	width: 76px;
	height: calc(var(--shelf-book-height) + 60px);
}
.cards-grid:first-of-type .shelf-bookmark {
	top: -51px;
	height: calc(var(--shelf-book-height) + 51px);
}
</style>

<style>
.v-overlay__content.shelf-work-tooltip {
	background: #fffaf2;
	color: #705247;
	border: 1px solid #e7d4bc;
	border-radius: 8px;
	padding: 12px 16px;
	box-shadow: 0 5px 18px rgba(78, 53, 35, 0.15);
	font-size: 13px;
	line-height: 1.8;
}
.shelf-work-tooltip .shelf-tooltip-title {
	font-weight: 700;
	font-size: 15px;
	line-height: 1.5;
	margin-bottom: 4px;
	overflow-wrap: anywhere;
}
</style>
