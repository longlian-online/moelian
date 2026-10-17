<template>
	<v-container>
		<!-- 弹窗显示大图 -->
		<v-dialog v-model="imageDialog" max-width="600px">
			<v-card>
				<v-img
					:src="currentImage || '/error-default.jpg'"
					min-height="400px"
					max-height="80vh"
					width="100%"
					contain
					class="bg-grey-lighten-2"
				>
					<template #error>
						<v-img src="/error-default.jpg" cover height="100%" width="100%" />
					</template>
					<template #placeholder>
						<div class="d-flex fill-height align-center justify-center">
							<v-progress-circular indeterminate color="primary" />
						</div>
					</template>
				</v-img>
			</v-card>
		</v-dialog>

		<!-- 加载遮罩 -->
		<v-overlay v-model="overlay" class="align-center justify-center" persistent>
			<div class="d-flex flex-column align-center">
				<v-progress-circular indeterminate size="64" color="primary" />
				<div class="mt-4 text-subtitle-1 text-white">正在上传，请稍候…</div>
			</div>
		</v-overlay>

		<v-card elevation="0" class="pa-2">
			<v-row dense class="py-2">
				<v-col cols="6">
					<v-text-field
						v-model="searchForm.title"
						label="标题"
						variant="outlined"
						density="compact"
						hide-details
						clearable
						prepend-inner-icon="mdi-magnify"
					>
					</v-text-field>
				</v-col>
				<v-col cols="3">
					<v-text-field
						v-model="searchForm.author"
						label="作者"
						variant="outlined"
						density="compact"
						hide-details
						clearable
						prepend-inner-icon="mdi-magnify"
					>
					</v-text-field>
				</v-col>

				<v-col cols="3">
					<v-text-field
						v-model.number="searchForm.id"
						label="ID"
						variant="outlined"
						type="number"
						density="compact"
						hide-details
						clearable
					></v-text-field>
				</v-col>

				<v-col cols="3">
					<v-select
						v-model="searchForm.status"
						label="状态"
						:items="[
							{
								title: '未发布',
								value: 'Disable',
							},
							{
								title: '已发布',
								value: 'Enable',
							},
						]"
						variant="outlined"
						density="compact"
						hide-details
						clearable
					></v-select>
				</v-col>
				<v-col cols="3">
					<v-select
						v-model="searchForm.lengthType"
						label="篇幅"
						:items="[
							{
								title: '长篇',
								value: 'Long',
							},
							{
								title: '中篇',
								value: 'Medium',
							},
							{
								title: '短篇',
								value: 'Short',
							},
						]"
						variant="outlined"
						density="compact"
						hide-details
						clearable
					></v-select>
				</v-col>

				<v-col cols="3">
					<v-select
						v-model="searchForm.contentType"
						label="类型"
						:items="[
							{
								title: '小说',
								value: 'Novel',
							},
							{
								title: '漫画',
								value: 'Manga',
							},
						]"
						variant="outlined"
						density="compact"
						hide-details
						clearable
					></v-select>
				</v-col>

				<v-col cols="3">
					<div class="d-flex ga-2 justify-end">
						<v-btn
							prepend-icon="mdi-broom"
							variant="outlined"
							color="primary"
							height="40"
							@click="adminWorkStore.resetSearch()"
							>一键清空</v-btn
						>
						<v-btn
							prepend-icon="mdi-book-plus-outline"
							variant="outlined"
							color="primary"
							to="/admin/create-work"
							height="40"
							>创建作品</v-btn
						>
					</div>
				</v-col>
			</v-row>

			<v-data-table
				:items="adminWorkStore.workList"
				:headers="headers"
				:items-per-page="-1"
				:loading="adminWorkStore.isPending"
				loading-text="加载中...请稍等"
			>
				<template #[`item.author`]="{ item }">
					<div
						style="
							max-width: 60px;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
						"
						:title="item.author"
						@contextmenu.prevent="copyText(item.author)"
					>
						{{ item.author }}
					</div>
				</template>
				<template #[`item.title`]="{ item }">
					<div
						style="
							max-width: 150px;
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

				<template #[`item.cover`]="{ item }">
					<v-img
						:src="item.cover || '/error-default.jpg'"
						width="70"
						height="100"
						cover
						class="rounded cursor-pointer"
						gradient="to bottom, rgba(0,0,0,.0), rgba(0,0,0,.3)"
						@click="openImage(item.cover)"
					>
						<template #error>
							<v-img
								cover
								src="/error-default.jpg"
								height="100%"
								width="100%"
							/> </template
					></v-img>
				</template>
				<!-- 类型 Manga和Novel -->
				<template #[`item.content_type`]="{ item }">
					<div v-if="item.content_type === 'Manga'">漫画</div>
					<div v-else>小说</div>
				</template>
				<template #[`item.length_type`]="{ item }">
					<div v-if="item.length_type === 'Short'">短篇</div>
					<div v-if="item.length_type === 'Medium'">中篇</div>
					<div v-if="item.length_type === 'Long'">长篇</div>
				</template>
				<template #[`item.serial_status`]="{ item }">
					<div v-if="item.serial_status === 'Serializing'">连载中</div>
					<div v-else>已完结</div>
				</template>
				<template #[`item.created_at`]="{ item }">
					<div>{{ dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss') }}</div>
				</template>
				<template #[`item.status`]="{ item }">
					<template v-if="item.status === 'Enable'">
						<v-icon color="success" class="mr-1" size="x-small"
							>mdi-circle</v-icon
						>
						<span>已发布</span>
					</template>
					<template v-if="item.status === 'Disable'">
						<v-icon color="red" class="mr-1" size="x-small">mdi-circle</v-icon>
						<span>未发布</span>
					</template>
				</template>

				<template #[`item.actions`]="{ item }">
					<div class="d-flex justify-center align-center">
						<v-btn
							stacked
							prepend-icon="mdi-book-edit"
							text="章节"
							size="x-small"
							variant="text"
							color="primary"
							:to="`/admin/chapter/${item.id}`"
						>
						</v-btn>
						<!-- 传入加载遮罩 -->
						<EditContentDialog v-model:overlay="overlay" :item-data="item">
						</EditContentDialog>
						<v-btn
							stacked
							prepend-icon="mdi-delete"
							size="x-small"
							variant="text"
							text="删除"
							color="red"
							@click="handleDelete(item.id)"
						>
						</v-btn>
						<!-- 发布 / 下架按钮 -->
						<v-btn
							v-if="item.status === 'Disable'"
							prepend-icon="mdi-publish"
							stacked
							size="x-small"
							color="success"
							variant="text"
							text="发布"
							@click="handleStatusChange(item.id, 'Enable')"
						/>
						<v-btn
							v-else
							prepend-icon="mdi-eye-off"
							stacked
							size="x-small"
							color="warning"
							variant="text"
							text="下架"
							@click="handleStatusChange(item.id, 'Disable')"
						/>
					</div>
				</template>

				<template #bottom>
					<div class="text-center pt-2">
						<v-pagination
							v-model="searchForm.page"
							:length="adminWorkStore.pageCount"
						></v-pagination>
					</div>
				</template>
			</v-data-table>
		</v-card>
	</v-container>
</template>

<script setup lang="ts">
import { useAdminWorkStore } from '~/stores/admin-work';
import dayjs from 'dayjs';
import { useClipboard } from '~/utils/useClipboard';

const { copyText } = useClipboard();
const overlay = ref(false);
const imageDialog = ref(false);
const currentImage = ref<string | null>(null);
// 实例化 Store
const adminWorkStore = useAdminWorkStore();
//保持响应式
const { searchForm } = storeToRefs(adminWorkStore);

function openImage(url: string) {
	currentImage.value = url;
	imageDialog.value = true;
}

function handleDelete(itemId: number) {
	showConfirm({
		title: '确认删除',
		message: '你确认要删除这部作品吗？',
		icon: 'mdi-delete-alert',
		confirmText: '确认删除',
		onConfirm: async () => {
			// 异步操作
			await adminWorkStore.deleteWork(itemId);
		},
	});
}

function handleStatusChange(id: number, status: 'Enable' | 'Disable') {
	const isEnable = status === 'Enable';

	showConfirm({
		title: isEnable ? '确认发布' : '确认下架',
		message: isEnable ? '你确认要发布这部作品吗？' : '你确认要下架这部作品吗？',
		icon: isEnable ? 'mdi-publish' : 'mdi-eye-off',
		confirmText: isEnable ? '确认发布' : '确认下架',
		onConfirm: async () => {
			// 异步操作
			await adminWorkStore.updateWorkStatus(id, status);
		},
	});
}

const headers = [
	{ title: 'id', value: 'id' },
	{ title: '封面', value: 'cover', sortable: false },
	{
		title: '标题',
		value: 'title',
	},
	{
		title: '类型',
		value: 'content_type',
	},
	{
		title: '作者',
		value: 'author',
	},
	{
		title: '状态',
		value: 'status',
	},
	{
		title: '篇幅',
		value: 'length_type',
	},
	{
		title: '连载状态',
		value: 'serial_status',
	},
	{
		title: '创建时间',
		value: 'created_at',
	},
	{ title: '操作', key: 'actions', sortable: false, align: 'center' },
] as const;
</script>

<style scoped></style>
