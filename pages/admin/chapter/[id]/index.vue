<template>
	<div>
		<v-container>
			<v-card-title> {{ workTitle }} </v-card-title>
			<v-card elevation="0">
				<template #text>
					<div class="d-flex justify-center align-center ga-4">
						<v-text-field
							v-model="search"
							label="搜索"
							prepend-inner-icon="mdi-magnify"
							variant="outlined"
							hide-details
							single-line
							color="primary"
						></v-text-field>
						<v-btn
							prepend-icon="mdi-upload"
							variant="outlined"
							color="primary"
							:to="{
								name: 'admin-chapter-id-upload-chapter',
								params: { id: workId },
							}"
							height="56"
							>上传章节</v-btn
						>
						<v-btn
							prepend-icon="mdi-refresh"
							variant="outlined"
							color="primary"
							height="56"
							@click="adminChapterStore.refreshList()"
							>刷新</v-btn
						>
					</div>
				</template>
				<v-data-table
					:items="currentChapters"
					:loading="isPending"
					:search="search"
					:headers="headers"
					:items-per-page="-1"
					loading-text="加载中... 请稍等"
				>
					<template #[`item.title`]="{ item }">
						<div
							style="
								max-width: 300px;
								white-space: nowrap;
								overflow: hidden;
								text-overflow: ellipsis;
							"
							:title="item.title"
							@contextmenu.prevent="copyText(item.title)"
						>
							{{ item.title }}
						</div>
					</template>

					<template #[`item.contentType`]="{ item }">
						<span v-if="item.contentType === 'Manga'">漫画</span>
						<span v-if="item.contentType === 'Novel'">小说</span>
					</template>

					<template #[`item.createdAt`]="{ item }">
						<span>{{
							dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')
						}}</span>
					</template>

					<template #[`item.status`]="{ item }">
						<div class="d-flex align-center">
							<template v-if="item.status === 'Enable'">
								<v-icon color="success" class="mr-1" size="x-small"
									>mdi-circle</v-icon
								>
								<span>已发布</span>
							</template>

							<template v-else>
								<v-icon color="red" class="mr-1" size="x-small"
									>mdi-circle</v-icon
								>
								<span>未发布</span>
							</template>
						</div>
					</template>
					<template #[`item.productReady`]="{ item }">
						<div class="d-flex align-center">
							<v-tooltip interactive>
								<template #activator="{ props: activatorProps }">
									<!-- 用一个 span/div 包裹所有内容，并绑定 activatorProps -->
									<span v-bind="activatorProps" class="d-flex align-center">
										<v-icon
											:color="item.productReady ? 'success' : 'blue'"
											icon="mdi-information-outline"
											v-bind="activatorProps"
										></v-icon>
										<span>{{
											item.productReady ? '可发布' : '资源准备中'
										}}</span>
									</span>
								</template>
								<div>如果资源长时间（5分钟以上）没有准备好，请联系开发排查</div>
							</v-tooltip>
						</div>
					</template>

					<template #[`item.actions`]="{ item }">
						<div class="d-flex justify-center align-center">
							<EditChapterMetaDialog
								:id="item.id"
								:refresh="adminChapterStore.refreshList"
								:priority="item.priority"
								:title="item.title"
							></EditChapterMetaDialog>
							<!-- 发布 / 下架按钮 -->
							<v-btn
								v-if="item.status === 'Disable'"
								prepend-icon="mdi-publish"
								stacked
								size="x-small"
								color="success"
								variant="text"
								text="发布"
								@click="handleStatusAction(item.id, 'Enable')"
							/>
							<v-btn
								v-else
								prepend-icon="mdi-eye-off"
								stacked
								size="x-small"
								color="warning"
								variant="text"
								text="下架"
								@click="handleStatusAction(item.id, 'Disable')"
							/>

							<!-- 传入item-data -->
							<EditChapterDialog :item-data="item"></EditChapterDialog>

							<v-btn
								stacked
								prepend-icon="mdi-delete"
								size="x-small"
								variant="text"
								text="删除"
								color="red"
								@click="handleDeleteAction(item.id)"
							>
							</v-btn>
						</div>
					</template>

					<template #[`item.priority`]="{ item }">
						<div>
							{{ item.priority / 10 }}
						</div>
					</template>

					<template #bottom>
						<div class="text-center pt-2">
							<v-pagination
								v-model="searchForm.page"
								:length="pageCount"
							></v-pagination>
						</div>
					</template>
				</v-data-table>
			</v-card>
		</v-container>
	</div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { useClipboard } from '~/utils/useClipboard';
definePageMeta({
	layout: 'admin',
});
const route = useRoute();
const workId = Number(route.params.id);
const { copyText } = useClipboard();
const { $tip } = useNuxtApp();

const adminChapterStore = useAdminChapterStore();
const { searchForm, isPending } = storeToRefs(adminChapterStore);

const adminStore = useAdminWorkStore();
const work = computed(() => adminStore.getWorkById(workId));
const workTitle = computed(() => work.value?.title || '未找到作品');

onMounted(() => {
	adminChapterStore.fetchChapters(workId);
});

// 监听分页变化，触发刷新
watch(
	() => searchForm.value.page,
	() => {
		adminChapterStore.refreshList();
	},
);

const currentChapters = computed(() => adminChapterStore.chapterList);
const pageCount = computed(() => adminChapterStore.pageCount);

const handleDeleteAction = async (id: number) => {
	showConfirm({
		title: '确认删除',
		message: '你确认要删除这部作品吗？',
		icon: 'mdi-delete-empty',
		confirmText: '确认删除',
		onConfirm: async () => {
			try {
				await adminChapterStore.deleteChapter(id);
				// 检查删除后的页码是否超出范围
				const newPageCount = adminChapterStore.pageCount;
				if (searchForm.value.page > newPageCount && searchForm.value.page > 1) {
					// 如果当前页大于新的总页数，则回退一页
					searchForm.value.page = newPageCount;
				}

				$tip('章节已删除', { color: 'success' });
			} catch (error) {
				if (error) {
					console.error('删除操作失败:', error);
					$tip('删除失败，请稍后再试。', { color: 'error' });
				}
			}
		},
	});
};

async function handleStatusAction(id: number, status: 'Enable' | 'Disable') {
	const isEnable = status === 'Enable';
	showConfirm({
		title: isEnable ? '确认发布' : '确认下架',
		message: isEnable ? '你确认要发布这部作品吗？' : '你确认要下架这部作品吗？',
		icon: isEnable ? 'mdi-publish' : 'mdi-eye-off',
		confirmText: isEnable ? '确认发布' : '确认下架',
		onConfirm: async () => {
			try {
				await adminChapterStore.updateChapterStatus(id, status);
				$tip(`${isEnable ? '发布' : '下架'}成功!`, { color: 'success' });
			} catch (error) {
				console.error('状态更新失败:', error);
				$tip(`${isEnable ? '发布' : '下架'}失败，请稍后再试。`, {
					color: 'error',
				});
			}
		},
	});
}

const search = ref('');
const headers = ref([
	{ title: 'id', value: 'id' },

	{
		title: '章节标题',
		value: 'title',
		width: '150px',
	},

	{
		title: '类型',
		value: 'contentType',
	},

	{
		title: '创建时间',
		value: 'createdAt',
	},
	{
		title: '状态',
		value: 'status',
	},
	{
		title: '资源状态',
		value: 'productReady',
	},
	{
		title: '顺序',
		value: 'priority',
	},
	{ title: '操作', key: 'actions', sortable: false, align: 'center' },
] as const);

useHead({
	title: computed(() => `章节管理 - ${workTitle.value}`),
});
</script>

<style scoped></style>
