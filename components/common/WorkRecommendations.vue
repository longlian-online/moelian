<script setup lang="ts">
import { publicAssets } from '~/utils/assets';
import type { WorkListRes } from '~/shared/dto/web/work';
defineProps<{
	works: WorkListRes['list'];
	contentType: 'manga' | 'novel';
	workId: number;
	title: string;
	mobile?: boolean;
	pending: boolean;
	error: unknown;
}>();
const emit = defineEmits<{ retry: [] }>();
const pickArtwork = useRandomArtwork();
</script>
<template>
	<aside
		class="detail-right-panel"
		:class="{ 'recommendations--mobile': mobile }"
		:aria-label="title"
	>
		<div class="detail-recommend-card recommendation-paper">
			<div class="detail-recommend-header">
				<h2 class="detail-recommend-title">
					<img
						class="recommendation-orange"
						aria-hidden="true"
						:src="publicAssets.orangeLogo"
						alt=""
					/>
					你可能也喜欢
				</h2>
				<NuxtLink class="detail-recommend-more" :to="`/${contentType}`"
					>更多 ›</NuxtLink
				>
			</div>
			<div class="recommendation-list">
				<v-skeleton-loader
					v-if="pending"
					type="list-item-avatar-three-line, list-item-avatar-three-line"
				/>
				<div v-else-if="error" class="recommendation-empty">
					<v-btn variant="text" @click="emit('retry')">重试加载推荐</v-btn>
				</div>
				<NuxtLink
					v-for="card in pending || error ? [] : works"
					:key="card.id"
					class="recommendation-item"
					:to="`/${contentType}/${card.id}`"
				>
					<div class="recommendation-content">
						<div class="recommendation-cover">
							<Book3D
								homepage
								:cover-url="card.coverUrl"
								:title="card.title"
								:author="card.author"
								:height="110"
								:width="78"
								:show-title="false"
								:show-spine-text="false"
							/>
						</div>
						<div class="recommendation-info">
							<h3 class="recommendation-title">{{ card.title }}</h3>
							<img
								class="recommendation-doodle"
								:src="
									pickArtwork(
										`${contentType}/${workId}:recommendation:${card.id}`,
									)
								"
								alt=""
								aria-hidden="true"
								width="600"
								height="600"
							/>

							<span class="recommendation-author-name">{{
								card.author || '未知作者'
							}}</span>
							<div class="recommendation-meta">
								<span
									:class="{
										'recommendation-meta--finished':
											card.serialType !== 'Serializing',
									}"
									>{{
										card.serialType === 'Serializing' ? '连载中' : '已完结'
									}}</span
								>
								<span>共 {{ card.lastNo ?? 0 }} 章</span>
							</div>
							<p class="recommendation-description">
								{{ card.description || '暂无简介，点击了解作品详情。' }}
							</p>
						</div>
					</div>
				</NuxtLink>
				<p
					v-if="!pending && !error && !works.length"
					class="recommendation-empty"
				>
					暂时没有更多推荐
				</p>
			</div>
		</div>
	</aside>
</template>
<style scoped>
.detail-recommend-card {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.detail-recommend-header {
	padding: 20px;
	border-bottom: 1px solid #f2ece6;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #fdfaf8;
	flex-shrink: 0;
}

.detail-recommend-title {
	font-weight: 900;
	color: #5a463d;
	font-size: 16px;
	letter-spacing: 0.05em;
}

.detail-recommend-more {
	color: #ff9a9e !important;
	font-size: 12px !important;
	font-weight: 900 !important;
	text-transform: none !important;
	padding: 0 !important;
	min-width: auto !important;
}

.detail-recommend-more:hover {
	text-decoration: underline;
}

.recommendation-list {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 16px;
}

.recommendation-item {
	cursor: pointer;
	margin-bottom: 16px;
}

.recommendation-item:last-child {
	margin-bottom: 0;
}

.recommendation-content {
	display: flex;
	gap: 16px;
	margin-bottom: 8px;
}

.recommendation-cover {
	position: relative;
	width: 80px;
	height: 112px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.recommendation-cover :deep(.book-3d-container) {
	width: 100%;
	height: 100%;
	margin: 0;
}

.recommendation-cover :deep(.book-3d-wrapper) {
	width: 100%;
	max-width: 80px;
}

.recommendation-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	overflow: hidden;
	padding: 4px 0;
}

.recommendation-title {
	font-weight: 900;
	font-size: 14px;
	color: #5a463d;
	line-height: 1.3;
	margin-bottom: 8px;
	transition: color 0.2s ease;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

.recommendation-item:hover .recommendation-title {
	color: #ff758c;
}

.recommendation-author-name {
	font-size: 12px;
	font-weight: 900;
	color: #7d5a5a;
	margin-left: 4px;
}

.recommendation-paper {
	position: relative;
	height: auto;
	margin-top: 8px;
	background: #fffdf8;
	border: 1px solid #ebe2d6;
	border-radius: 3px 10px 10px 3px;
	box-shadow: 2px 5px 14px rgba(108, 82, 57, 0.06);
}

.recommendation-paper::before {
	content: '';
	position: absolute;
	top: -9px;
	left: 22px;
	width: 21px;
	height: 31px;
	background: #c3c6af;
	clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
}

.recommendation-paper .detail-recommend-header {
	padding: 30px 16px 14px;
	background: transparent;
	border-bottom: 1px solid #eee6da;
	gap: 8px;
}

.recommendation-paper .detail-recommend-title {
	display: flex;
	align-items: center;
	gap: 6px;
	font-family: 'Songti SC', 'STSong', serif;
	font-size: 16px;
	font-weight: 600;
	letter-spacing: 0;
	color: #765b46;
}

.recommendation-orange {
	width: 18px;
	height: 24px;
	flex-shrink: 0;
}

.recommendation-paper .detail-recommend-more {
	font-size: 11px !important;
	font-weight: 400 !important;
	text-decoration: none;
	white-space: nowrap;
	color: #a28b73 !important;
}

.recommendation-paper .recommendation-list {
	padding: 0 16px;
	justify-content: flex-start;
}

.recommendation-paper .recommendation-item {
	display: block;
	padding: 17px 0;
	margin: 0;
	border-bottom: 1px dashed #e5dacb;
	text-decoration: none;
	color: inherit;
}

.recommendation-paper .recommendation-item:last-child {
	border-bottom: 0;
}

.recommendation-paper .recommendation-content {
	gap: 12px;
	margin: 0;
}

.recommendation-paper .recommendation-cover {
	border-radius: 2px 4px 4px 2px;
	transition: transform 180ms ease;
}

.recommendation-paper .recommendation-title {
	font-size: 14px;
	font-weight: 500;
	line-height: 1.6;
	margin-bottom: 8px;
}

.recommendation-paper .recommendation-author-name {
	margin: 0;
	font-size: 12px;
	font-weight: 400;
	color: #aa927b;
}

.recommendation-empty {
	padding: 24px 0;
	color: #aa927b;
	font-size: 13px;
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
	.recommendation-paper .recommendation-item:hover .recommendation-cover {
		transform: translateY(-3px);
	}
}

.recommendation-paper .recommendation-item:focus-visible {
	outline: 2px solid #c3c6af;
	outline-offset: 3px;
}

.recommendation-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 4px 10px;
	margin-top: 8px;
	font-size: 11px;
	line-height: 1.5;
	color: #a28b73;
}

.recommendation-meta > span:first-child {
	color: #cc8c91;
}

.recommendation-meta > .recommendation-meta--finished:first-child {
	color: #8d9c7c;
}

.recommendation-description {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	overflow: hidden;
	margin: 8px 0 0;
	font-size: 12px;
	line-height: 1.7;
	color: #9b8674;
	overflow-wrap: anywhere;
}

.recommendation-paper .recommendation-cover {
	overflow: visible;
	box-shadow: none;
}

.recommendation-paper .recommendation-cover :deep(.book-3d-container) {
	width: 100%;
	margin: 0;
}

.recommendation-paper
	.recommendation-cover
	:deep(.book-3d-container.book-3d-home .book-3d-wrapper) {
	width: 100% !important;
	max-width: 100%;
}

.recommendations--mobile .recommendation-paper {
	margin-top: 0;
}

.recommendations--mobile .recommendation-list {
	flex-direction: column;
	gap: 0;
	overflow-x: visible;
	padding: 0 16px;
}

.recommendations--mobile .recommendation-item {
	flex: 0 0 auto;
	width: 100%;
	min-width: 0;
	border-bottom: 1px dashed #e5dacb;
}

.recommendations--mobile .recommendation-item:last-child {
	border-bottom: 0;
}

.recommendations--mobile .recommendation-paper {
	min-width: 0;
	max-width: 100%;
}

.recommendation-paper .recommendation-content {
	display: grid;
	grid-template-columns: 104px minmax(0, 1fr);
	width: 100%;
	min-width: 0;
	align-items: center;
}

.recommendation-paper .recommendation-info {
	min-width: 0;
	display: grid;
	justify-content: stretch;
	text-align: left;
	width: 100%;
	gap: 6px;
	align-content: start;
	padding: 2px 0;
}

.recommendation-paper .recommendation-title {
	margin: 0;
	min-height: 3.2em;
	max-height: 3.2em;
	overflow-wrap: anywhere;
}

.recommendation-paper .recommendation-author-name {
	line-height: 18px;
	min-width: 0;
}

.recommendation-paper .recommendation-meta {
	margin: 0;
	line-height: 17px;
	white-space: nowrap;
}

.recommendation-paper .recommendation-description {
	margin: 0;
	height: 41px;
}

.recommendation-paper .recommendation-cover {
	width: 104px;
	height: 144px;
}

.recommendation-paper .recommendation-cover :deep(.book-3d-container) {
	height: 144px;
}

@media (max-width: 380px) {
	.recommendation-paper .recommendation-content {
		gap: 10px;
		grid-template-columns: 92px minmax(0, 1fr);
	}
	.recommendation-paper .recommendation-cover {
		width: 92px;
	}
}

.recommendation-paper .recommendation-content {
	height: 180px;
}

.recommendation-paper .recommendation-info {
	height: 180px;
	grid-template-columns: minmax(0, 1fr) 80px;
	grid-template-rows: 45px 18px 52px 41px;
	column-gap: 8px;
}

.recommendation-title {
	grid-column: 1 / -1;
	grid-row: 1;
}

.recommendation-author-name {
	grid-column: 1;
	grid-row: 2;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.recommendation-paper .recommendation-meta {
	grid-column: 1;
	grid-row: 3;
	align-self: start;
	flex-wrap: wrap;
	gap: 4px 8px;
	overflow: visible;
}

.recommendation-description {
	grid-column: 1 / -1;
	grid-row: 4;
}

.recommendation-doodle {
	grid-column: 2;
	grid-row: 2 / 4;
	align-self: center;
	width: 80px;
	height: 80px;
	object-fit: contain;
	pointer-events: none;
}
</style>
