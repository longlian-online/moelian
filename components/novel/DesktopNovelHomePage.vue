<template>
	<v-container max-width="1200px">
		<template v-if="webWorkStore.novelTotalItems === 0">
			<v-alert
				type="info"
				icon="mdi-magnify-remove-outline"
				variant="tonal"
				class="mt-10 pa-6"
			>
				<h3 class="text-h6 mb-2">抱歉，没有找到相关作品 🥺</h3>
				<p>
					请尝试更换关键词 **「{{ webWorkStore.novelState.searchKey }}」**
					或清除搜索内容后再次查找。
				</p>
			</v-alert>
		</template>

		<template v-else>
			<!-- 栅格系统：md以上严格一行两个 (两列布局) -->
			<div class="novel-grid">
				<div
					v-for="card in cards"
					:key="card.id"
					class="novel-card"
					@click="gotoNovalId(card.id)"
				>
					<!-- 左侧：3D 书籍封面预览区 -->
					<div class="novel-cover-wrapper">
						<Book3D
							:cover-url="card.coverUrl"
							:title="card.title"
							:author="card.author"
							:height="200"
							:width="140"
							:spine-width="25"
							:show-title="false"
							:show-spine-text="false"
							@click.stop="gotoNovalId(card.id)"
						>
							<template #overlay>
								<!-- 左上角分类标签 -->
								<AnimeTags
									:tags="card.tags"
									size="small"
									position="bottom-left"
								/>
							</template>
						</Book3D>
					</div>

					<!-- 右侧：详细内容区 -->
					<div class="novel-content-wrapper">
						<div class="novel-content-top">
							<!-- 标题与 Tag -->
							<div class="novel-title-row">
								<h3
									v-copy="card.title"
									v-tooltip="card.title"
									class="novel-title"
									@click.stop
								>
									{{ card.title }}
								</h3>
								<div class="novel-tags-group">
									<span class="novel-tag length-tag">
										{{
											card.lengthType === 'Long'
												? '长篇'
												: card.lengthType === 'Medium'
													? '中篇'
													: '短篇'
										}}
									</span>
									<span
										class="novel-tag"
										:class="
											card.serialType === 'Serializing'
												? 'serializing-tag'
												: 'finished-tag'
										"
									>
										{{ card.serialType === 'Serializing' ? '连载' : '完结' }}
									</span>
								</div>
							</div>

							<!-- 作者与时间戳 -->
							<div class="novel-author-section">
								<div class="novel-author-time-row">
									<!-- 左侧：作者信息 -->
									<div class="novel-author-info">
										<div class="novel-author-line">
											<span class="novel-by-text">By</span>
											<span
												v-copy="card.author"
												v-tooltip="'点击搜索作者/右键复制'"
												class="novel-author-name"
												@click.stop="handleAuthorClick(card.author)"
											>
												{{ card.author }}
											</span>
										</div>
										<!-- 渐变长线：随作者名延伸，尾部渐隐 -->
										<div class="novel-author-underline"></div>
									</div>
									<!-- 右侧：更新时间 -->
									<div class="novel-update-time">
										<div class="novel-update-line">
											<span class="novel-update-label">Update</span>
											<span class="novel-update-value">
												{{
													card.chapterUpdatedAt
														? dayjs(card.chapterUpdatedAt).format(
																'YYYY-MM-DD HH:mm',
															)
														: 'N/A'
												}}
											</span>
										</div>
										<!-- 渐变下划线：与作者下划线类似，但颜色不同 -->
										<div class="novel-update-underline"></div>
									</div>
								</div>
							</div>

							<!-- 简介 (严格两行截断) -->
							<p
								v-copy="card.description"
								v-tooltip="card.description"
								class="novel-description"
								@click.stop
							>
								{{ card.description }}
							</p>
						</div>

						<!-- 底部：章节数 -->
						<div class="novel-concentration-section">
							<div class="novel-concentration-header">
								<div class="novel-concentration-label">
									<svg
										class="novel-heart-icon"
										fill="currentColor"
										viewBox="0 0 20 20"
										width="10"
										height="10"
									>
										<path
											fill-rule="evenodd"
											d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
											clip-rule="evenodd"
										/>
									</svg>
									<span class="novel-concentration-text">章节数</span>
								</div>
								<span class="novel-concentration-value">{{
									card?.lastNo || '1000'
								}}</span>
							</div>
							<!-- 进度条 -->
							<div class="novel-progress-bar">
								<div
									class="novel-progress-fill"
									:style="{
										width:
											typeof card?.lastNo === 'number'
												? `${Math.min(100, Math.max(0, card.lastNo))}%`
												: card?.lastNo || '100%',
									}"
								></div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<v-pagination
				v-model="page"
				:length="webWorkStore.novelPageCount"
			></v-pagination>
		</template>
	</v-container>
</template>

<script setup lang="ts">
import type { WorkListRes } from '~/shared/dto/web/work';
import dayjs from 'dayjs';
export type WorkItemType = WorkListRes['list'][number];

const webWorkStore = useWebWorkStore();
const page = computed({
	get: () => webWorkStore.novelState.page,
	set: (value) => {
		webWorkStore.novelState.page = value;
	},
});
// 将 Store 中的 novelList 映射到模板使用的 cards 结构
const cards = computed<WorkItemType[]>(() => webWorkStore.novelList);

const { error } = await useAsyncData(
	'novel-list-data',
	async () => {
		await webWorkStore.fetchWorkList(webWorkStore.novelState);
		return webWorkStore.novelList;
	},
	{
		watch: [() => page.value],
	},
);

if (error.value) {
	console.error('漫画列表数据加载失败:', error.value);
}

const router = useRouter();
const gotoNovalId = (id: number) => {
	router.push(`/novel/${id}`);
};

const handleAuthorClick = (author: string) => {
	webWorkStore.novelInputKey = author;
	webWorkStore.triggerNovelSearch();
};
</script>

<style scoped>
/* 栅格系统：md以上严格一行两个 (两列布局) */
.novel-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 16px;
}

@media (min-width: 960px) {
	.novel-grid {
		grid-template-columns: repeat(2, 1fr);
		gap: 24px;
	}
}

/* 小说卡片 */
.novel-card {
	display: flex;
	background: white;
	border-radius: 16px;
	box-shadow: 0 1px 3px rgba(125, 90, 90, 0.1);
	border: 1px solid #eee1d5;
	overflow: hidden;
	transition: all 0.3s ease;
	cursor: pointer;
	height: 190px;
}

@media (min-width: 960px) {
	.novel-card {
		height: 210px;
	}
}

.novel-card:hover {
	box-shadow: 0 10px 25px -5px rgba(125, 90, 90, 0.2);
	transform: translateY(-4px);
}

/* 左侧：3D 书籍封面预览区 (占宽 35% 左右) */
.novel-cover-wrapper {
	width: 130px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	overflow: hidden;

	padding: 12px;
	box-sizing: border-box;
}

@media (min-width: 960px) {
	.novel-cover-wrapper {
		width: 160px;
		padding: 16px;
	}
}

/* 让 Book3D 组件铺满 wrapper（减去 padding 后的空间） */
.novel-cover-wrapper :deep(.book-3d-container) {
	width: 100% !important;
	height: 100% !important;
	margin: 0 !important;
}

.novel-cover-wrapper :deep(.book-3d-wrapper) {
	width: 100% !important;
	height: 100% !important;
}

/* 右侧：详细内容区 (占宽 65% 左右) */
.novel-content-wrapper {
	flex-grow: 1;
	padding: 12px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	overflow: hidden;
}

@media (min-width: 960px) {
	.novel-content-wrapper {
		padding: 16px;
	}
}

.novel-content-top {
	flex: 1;
	overflow: hidden;
}

/* 标题与 Tag 行 */
.novel-title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
	gap: 8px;
}

.novel-title {
	font-size: 14px;
	font-weight: 700;
	color: #5a463d;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
	min-width: 0;
}

@media (min-width: 960px) {
	.novel-title {
		font-size: 16px;
	}
}

.novel-tags-group {
	display: flex;
	gap: 4px;
	flex-shrink: 0;
}

.novel-tag {
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 8px;
	font-weight: 700;
	white-space: nowrap;
	border: 1px solid;
}

@media (min-width: 960px) {
	.novel-tag {
		font-size: 9px;
		padding: 2px 6px;
	}
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

/* 作者与时间戳行 */
.novel-author-section {
	margin-bottom: 8px;
	width: 100%;
}

.novel-author-time-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

/* 左侧：作者信息 */
.novel-author-info {
	flex: 1;
	min-width: 0;
}

.novel-author-line {
	display: flex;
	align-items: baseline;
	gap: 4px;
}

.novel-by-text {
	font-size: 8px;
	font-weight: 900;
	color: #ff9a9e;
	text-transform: uppercase;
}

@media (min-width: 960px) {
	.novel-by-text {
		font-size: 9px;
	}
}

.novel-author-name {
	font-size: 12px;
	font-weight: 700;
	color: #7d5a5a;
	cursor: pointer;
	transition: color 0.2s ease;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.novel-author-name:hover {
	color: #ff758c;
}

.novel-author-underline {
	margin-top: 2px;
	width: 100%;
	height: 1.5px;
	background: linear-gradient(to right, #ff9a9e, transparent);
	border-radius: 9999px;
	opacity: 0.6;
}

/* 右侧：更新时间 - 单行显示 */
.novel-update-time {
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.novel-update-line {
	white-space: nowrap;
	display: flex;
	align-items: baseline;
	gap: 6px;
}

.novel-update-label {
	font-size: 7px;
	font-weight: 900;
	color: #90caf9;
	text-transform: uppercase;
}

@media (min-width: 960px) {
	.novel-update-label {
		font-size: 8px;
	}
}

.novel-update-value {
	font-size: 9px;
	font-weight: 700;
	color: #5a463d;
	opacity: 0.8;
}

@media (min-width: 960px) {
	.novel-update-value {
		font-size: 10px;
	}
}

/* 时间戳渐变下划线 - 使用蓝色系，与标签颜色呼应 */
.novel-update-underline {
	margin-top: 2px;
	width: 100%;
	height: 1.5px;
	background: linear-gradient(to right, #90caf9, transparent);
	border-radius: 9999px;
	opacity: 0.6;
}

/* 简介 (严格四行截断) */
.novel-description {
	font-size: 10px;
	color: #9a8471;
	line-height: 1.4;
	margin-bottom: 8px;
	opacity: 0.8;
	display: -webkit-box;
	-webkit-line-clamp: 4;
	line-clamp: 4;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
}

@media (min-width: 960px) {
	.novel-description {
		font-size: 12px;
	}
}

/* 底部：章节数 */
.novel-concentration-section {
	padding-top: 8px;
	border-top: 1px solid #f2ece6;
}

.novel-concentration-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 4px;
}

.novel-concentration-label {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #ff758c;
}

.novel-heart-icon {
	width: 10px;
	height: 10px;
}

@media (min-width: 960px) {
	.novel-heart-icon {
		width: 12px;
		height: 12px;
	}
}

.novel-concentration-text {
	font-size: 9px;
	font-weight: 900;
	color: #9a8471;
	letter-spacing: 0.05em;
}

@media (min-width: 960px) {
	.novel-concentration-text {
		font-size: 10px;
	}
}

.novel-concentration-value {
	font-size: 10px;
	font-weight: 900;
	color: #ff758c;
}

@media (min-width: 960px) {
	.novel-concentration-value {
		font-size: 12px;
	}
}

/* 进度条 */
.novel-progress-bar {
	height: 6px;
	width: 100%;
	background: #f2ece6;
	border-radius: 9999px;
	overflow: hidden;
}

@media (min-width: 960px) {
	.novel-progress-bar {
		height: 6px;
	}
}

.novel-progress-fill {
	height: 100%;
	background: linear-gradient(to right, #ff9a9e, #ff758c, #fecfef);
	border-radius: 9999px;
	transition: width 1s ease-out;
}
</style>
