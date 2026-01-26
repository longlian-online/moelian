<template>
	<div>
		<!-- 上传进度遮罩 -->
		<UploadProgressOverlay
			v-model="overlay"
			:progress="progress"
			:speed="speed"
			@cancel="cancelUpload"
		></UploadProgressOverlay>

		<v-container>
			<!-- 搜索与操作栏 -->
			<v-card class="pa-4 mb-4" flat border>
				<v-row dense align="center">
					<v-col cols="12" md="5">
						<v-autocomplete
							v-model="searchKey"
							:items="allTagNames"
							label="选择已有标签进行过滤"
							variant="outlined"
							density="compact"
							hide-details
							clearable
							prepend-inner-icon="mdi-magnify"
							no-data-text="没有找到匹配的已有标签"
							placeholder="输入关键词检索已有标签"
						></v-autocomplete>
					</v-col>

					<v-spacer></v-spacer>

					<v-col cols="auto">
						<v-btn
							prepend-icon="mdi-plus"
							variant="elevated"
							color="primary"
							class="rounded-lg"
							@click="openCreateDialog"
						>
							创建标签
						</v-btn>
					</v-col>
				</v-row>
			</v-card>

			<!-- 数据表格 -->
			<v-card elevation="0" border class="rounded-xl overflow-hidden">
				<v-data-table
					:items="filteredList"
					:headers="headers"
					:loading="isPending"
					loading-text="正在加载标签数据..."
				>
					<!-- 封面渲染 -->
					<template #[`item.cover`]="{ item }">
						<div class="py-2">
							<v-img
								v-if="item.cover"
								:src="item.cover"
								width="100"
								height="56"
								cover
								class="rounded-lg bg-grey-lighten-2 border"
							>
								<template #placeholder>
									<div class="d-flex align-center justify-center fill-height">
										<v-progress-circular
											indeterminate
											size="14"
										></v-progress-circular>
									</div>
								</template>
								<template #error>
									<div
										class="d-flex align-center justify-center fill-height bg-grey-lighten-2"
									>
										<v-icon
											icon="mdi-image-off-outline"
											size="24"
											color="grey"
										></v-icon>
									</div>
								</template>
							</v-img>
							<div
								v-else
								class="d-flex align-center justify-center rounded-lg bg-grey-lighten-2 border"
								style="width: 100px; height: 56px"
							>
								<v-icon
									icon="mdi-image-off-outline"
									size="24"
									color="grey"
								></v-icon>
							</div>
						</div>
					</template>

					<!-- 操作栏 -->
					<template #[`item.actions`]="{ item }">
						<div class="d-flex justify-center align-center ga-2">
							<v-btn
								icon="mdi-pencil-outline"
								size="x-small"
								variant="text"
								color="primary"
								@click="openEditDialog(item)"
							></v-btn>

							<v-btn
								icon="mdi-delete-outline"
								size="x-small"
								variant="text"
								color="red"
								@click="confirmDelete(item)"
							></v-btn>
						</div>
					</template>

					<!-- 分页 -->
					<template #bottom>
						<div class="text-center pt-4 pb-2">
							<v-pagination
								v-model="page"
								:length="pageCount"
								density="compact"
								active-color="primary"
							></v-pagination>
						</div>
					</template>
				</v-data-table>
			</v-card>

			<!-- 创建/编辑 标签弹窗 -->
			<v-dialog v-model="isDialogOpen" max-width="600">
				<v-card class="rounded-xl">
					<!-- 编辑模式：简单表单 -->
					<template v-if="isEditing">
						<v-card-title class="pa-4 font-bold border-b">
							编辑标签
						</v-card-title>

						<v-form ref="formRef" v-model="isFormValid" class="pa-4">
							<v-row dense>
								<v-col cols="12">
									<v-text-field
										v-model="tagForm.content"
										label="标签内容"
										placeholder="例如：玄幻"
										variant="outlined"
										:rules="contentRules"
										:disabled="postPending"
										required
									></v-text-field>
								</v-col>
								<v-col cols="12">
									<!-- 当前封面预览 -->
									<div v-if="currentCoverUrl" class="mb-4">
										<v-label class="mb-2">当前封面</v-label>
										<v-img
											:src="currentCoverUrl"
											width="200"
											height="112"
											cover
											class="rounded-lg bg-grey-lighten-2 border"
										>
											<template #placeholder>
												<div
													class="d-flex align-center justify-center fill-height"
												>
													<v-progress-circular
														indeterminate
														size="14"
													></v-progress-circular>
												</div>
											</template>
										</v-img>
									</div>

									<!-- 文件上传 -->
									<v-file-input
										v-model="coverFile"
										label="选择新封面图片（可选）"
										accept="image/*"
										variant="outlined"
										prepend-icon="mdi-camera"
										show-size
										truncate-length="15"
										:disabled="postPending"
									></v-file-input>

									<!-- 文件预览 -->
									<div v-if="coverFilePreviewUrl" class="mt-2">
										<v-label class="mb-2">预览</v-label>
										<v-img
											:src="coverFilePreviewUrl"
											width="200"
											height="112"
											cover
											class="rounded-lg bg-grey-lighten-2 border"
										></v-img>
									</div>
								</v-col>
							</v-row>
						</v-form>

						<v-card-actions class="pa-4 pt-0">
							<v-spacer></v-spacer>
							<v-btn
								text="取消"
								variant="plain"
								:disabled="postPending"
								@click="isDialogOpen = false"
							></v-btn>
							<v-btn
								color="primary"
								variant="tonal"
								class="px-6 rounded-lg"
								:disabled="postPending || !isFormValid"
								@click="handleSubmit"
							>
								<v-progress-circular
									v-if="postPending"
									indeterminate
									size="20"
									class="mr-2"
								></v-progress-circular>
								保存修改
							</v-btn>
						</v-card-actions>
					</template>

					<!-- 创建模式：步骤条 -->
					<template v-else>
						<v-stepper
							v-model="currentStep"
							:items="['上传图片', '填写标签名称']"
							class="rounded-lg"
							elevation="0"
						>
							<v-card-title class="text-h5 font-weight-bold pa-4">
								{{ currentStep === 1 ? '上传封面图片' : '填写标签名称' }}
							</v-card-title>

							<!-- 第一步：上传图片 -->
							<div v-if="currentStep === 1" class="pa-4">
								<v-file-input
									v-model="coverFile"
									label="选择封面图片"
									accept="image/*"
									variant="outlined"
									prepend-icon="mdi-camera"
									show-size
									truncate-length="15"
									:disabled="postPending || isUploading"
								></v-file-input>

								<!-- 文件预览 -->
								<div v-if="coverFilePreviewUrl" class="mt-4">
									<v-label class="mb-2">预览</v-label>
									<v-img
										:src="coverFilePreviewUrl"
										width="300"
										height="168"
										cover
										class="rounded-lg bg-grey-lighten-2 border"
									></v-img>
								</div>

								<!-- 上传成功的提示 -->
								<div v-if="uploadedCoverId" class="mt-4">
									<v-alert type="success" variant="tonal" density="compact">
										图片上传成功！封面ID: {{ uploadedCoverId }}
									</v-alert>
								</div>
							</div>

							<!-- 第二步：填写标签名称 -->
							<div v-if="currentStep === 2" class="pa-4">
								<v-form ref="formRef" v-model="isFormValid">
									<v-text-field
										v-model="tagForm.content"
										label="标签内容"
										placeholder="例如：玄幻"
										variant="outlined"
										:rules="contentRules"
										:disabled="postPending"
										required
									></v-text-field>
								</v-form>
							</div>

							<template #actions="{ next, prev }">
								<v-card-actions class="d-flex justify-space-between mt-4 pa-4">
									<v-btn
										v-if="currentStep > 1"
										color="secondary"
										prepend-icon="mdi-arrow-left"
										variant="outlined"
										:disabled="postPending || isUploading"
										@click="prev()"
									>
										上一步
									</v-btn>
									<v-spacer></v-spacer>
									<v-btn
										v-if="currentStep === 1"
										color="primary"
										variant="tonal"
										size="large"
										prepend-icon="mdi-arrow-right"
										:disabled="postPending || isUploading || !coverFile"
										@click="handleUploadAndNext(next)"
									>
										<v-progress-circular
											v-if="isUploading"
											indeterminate
											size="20"
											class="mr-2"
										></v-progress-circular>
										确认上传并且下一步
									</v-btn>
									<v-btn
										v-if="currentStep === 2"
										color="primary"
										prepend-icon="mdi-check"
										:disabled="postPending || !isFormValid"
										@click="handleSubmit"
									>
										<v-progress-circular
											v-if="postPending"
											indeterminate
											size="20"
											class="mr-2"
										></v-progress-circular>
										提交
									</v-btn>
								</v-card-actions>
							</template>
						</v-stepper>
					</template>
				</v-card>
			</v-dialog>
		</v-container>
	</div>
</template>

<script setup lang="ts">
import { showConfirm } from '~/composables/useConfirm';
import { useNuxtApp } from '#app';
import { uploadToCos } from '~/composables/useCosUpload';

definePageMeta({
	layout: 'admin',
});

const { $tip } = useNuxtApp();

// === 状态定义 ===
const isDialogOpen = ref(false);
const isEditing = ref(false);
const searchKey = ref<string | null>(null);
const page = ref(1);
const limit = ref(10);
const postPending = ref(false);
const isFormValid = ref(false);
const currentStep = ref(1); // 步骤条当前步骤
const isUploading = ref(false); // 是否正在上传图片
const uploadedCoverId = ref<number | null>(null); // 第一步上传成功后保存的 cover_id
type VForm = {
	validate: () => Promise<{ valid: boolean }>;
	reset: () => void;
};
const formRef = ref<VForm | null>(null);

// 标签表单数据
const tagForm = reactive({
	content: '',
	cover_id: null as number | null,
});

// 当前编辑的标签 ID
const editingTagId = ref<number | null>(null);

// 文件上传相关状态
const coverFile = ref<File | null>(null);
const overlay = ref(false);
const progress = ref(0);
const speed = ref('0 B/s');
const uploadController = ref<AbortController | null>(null);

// 当前封面URL（编辑模式时显示）
const currentCoverUrl = ref<string | null>(null);

// 文件预览URL
const coverFilePreviewUrl = ref<string | null>(null);

// 表单验证规则
const contentRules = [
	(value: string) => {
		if (!value || !value.trim()) return '标签内容不能为空';
		if (value.length > 20) return '标签内容不能超过20个字符';
		// 创建模式下，验证 cover_id 是否存在
		if (!isEditing.value && !uploadedCoverId.value) {
			return '请先上传封面图片';
		}
		return true;
	},
];

// 监听文件变化，更新预览URL并清理旧的URL
watch(coverFile, (newFile) => {
	// 清理旧的预览URL
	if (coverFilePreviewUrl.value) {
		URL.revokeObjectURL(coverFilePreviewUrl.value);
		coverFilePreviewUrl.value = null;
	}

	// 创建新的预览URL
	if (newFile && newFile instanceof File) {
		coverFilePreviewUrl.value = URL.createObjectURL(newFile);
	}
});

// 组件卸载时清理预览URL
onUnmounted(() => {
	if (coverFilePreviewUrl.value) {
		URL.revokeObjectURL(coverFilePreviewUrl.value);
	}
});


// 表格列定义
const headers = [
	{ title: 'ID', key: 'id', width: '80px', sortable: true },
	{ title: '封面预览', key: 'cover', width: '140px', sortable: false },
	{ title: '标签内容', key: 'content', sortable: true },
	{ title: '操作', key: 'actions', align: 'center', width: '120px' },
] as const;

//API

// 获取标签列表（分页）
const {
	data: tagListData,
	refresh: refreshList,
	pending: isPending,
} = useApiFetch<{
	list: Array<{
		id: number;
		content: string;
		cover: string;
		created_at: string;
		updated_at: string | null;
	}>;
	total: number;
}>('/api/admin/tag', {
	query: computed(() => {
		const query: {
			page: number;
			limit: number;
			content?: string;
		} = {
			page: page.value,
			limit: limit.value,
		};
		// 如果选择了搜索关键词，添加到查询参数中
		if (searchKey.value) {
			query.content = searchKey.value;
		}
		return query;
	}),
});

// 获取所有标签（用于搜索下拉框）
const { data: allTagsData, refresh: refreshAllTags } = useApiFetch<
	Array<{
		id: number;
		content: string;
		cover: string;
		created_at: string;
	}>
>('/api/admin/tag/all');

// === 计算属性 ===

// 标签列表数据（直接使用 API 返回的数据，API 会根据 content 参数过滤）
const filteredList = computed(() => {
	const list = tagListData.value?.data?.list || [];
	// 确保 cover 字段是有效的 URL
	return list.map((item) => ({
		...item,
		cover: item.cover && item.cover.trim() ? item.cover : null,
	}));
});

// 所有标签名称（用于搜索下拉框）
const allTagNames = computed(() => {
	return allTagsData.value?.data?.map((item) => item.content) || [];
});

// 总页数
const totalItems = computed(() => tagListData.value?.data?.total || 0);
const pageCount = computed(() => Math.ceil(totalItems.value / limit.value));

// === 方法 ===

// 打开创建对话框
const openCreateDialog = () => {
	isEditing.value = false;
	editingTagId.value = null;
	tagForm.content = '';
	tagForm.cover_id = null;
	coverFile.value = null;
	currentCoverUrl.value = null;
	currentStep.value = 1; // 重置到第一步
	uploadedCoverId.value = null; // 重置上传的 cover_id
	isDialogOpen.value = true;
};

// 打开编辑对话框
const openEditDialog = (item: {
	id: number;
	content: string;
	cover: string;
	cover_id?: number | null;
}) => {
	isEditing.value = true;
	editingTagId.value = item.id;
	tagForm.content = item.content;
	tagForm.cover_id = item.cover_id ?? null;
	coverFile.value = null;
	currentCoverUrl.value = item.cover || null;
	currentStep.value = 1;
	uploadedCoverId.value = null;
	isDialogOpen.value = true;
};

// 第一步：上传图片并进入下一步
const handleUploadAndNext = async (next: () => void) => {
	if (!coverFile.value || !(coverFile.value instanceof File)) {
		$tip('请先选择图片', {
			color: 'warning',
			icon: 'mdi-alert-circle',
		});
		return;
	}

	const file = coverFile.value;

	isUploading.value = true;
	overlay.value = true;
	const controller = new AbortController();
	uploadController.value = controller;

	try {
		const coverId = await uploadToCos(
			file,
			'/api/admin/resource',
			'Cover',
			({ percent, speed: s }) => {
				progress.value = percent;
				speed.value = s;
			},
			controller.signal,
		);

		// 确保上传返回的是有效的数字
		if (coverId && typeof coverId === 'number' && coverId > 0) {
			uploadedCoverId.value = coverId;
			$tip('图片上传成功！', {
				color: 'success',
				icon: 'mdi-check-circle',
			});
			next(); // 进入下一步
		} else {
			$tip('封面上传失败：未获取到有效的资源ID', {
				color: 'error',
				icon: 'mdi-alert-circle',
			});
		}
	} catch (err: unknown) {
		// 捕获并处理用户取消的错误
		const errorMessage =
			err instanceof Error ? err.message : '封面上传失败';
		if (errorMessage === '用户取消了上传') {
			$tip('用户取消上传', {
				color: 'error',
				icon: 'mdi-alert-circle',
			});
			return;
		}

		$tip(errorMessage, {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
	} finally {
		isUploading.value = false;
		overlay.value = false;
		uploadController.value = null;
	}
};

// 提交表单（创建或更新）
const handleSubmit = async () => {
	// 验证表单
	const validation = await formRef.value?.validate();
	if (validation && !validation.valid) {
		$tip('请检查表单中所有必填项和格式！', {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
		return;
	}

	// 创建模式下，验证 cover_id 是否存在
	if (!isEditing.value && !uploadedCoverId.value) {
		$tip('请先上传封面图片', {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
		return;
	}

	postPending.value = true;
	let finalCoverId: number | null | undefined = undefined;

	try {
		if (isEditing.value) {
			// 编辑模式：如果选择了新文件，先上传获取 cover_id
			if (coverFile.value && coverFile.value instanceof File) {
				const file = coverFile.value;

				overlay.value = true;
				const controller = new AbortController();
				uploadController.value = controller;

				try {
					const uploadedId = await uploadToCos(
						file,
						'/api/admin/resource',
						'Cover',
						({ percent, speed: s }) => {
							progress.value = percent;
							speed.value = s;
						},
						controller.signal,
					);

					if (
						uploadedId &&
						typeof uploadedId === 'number' &&
						uploadedId > 0
					) {
						finalCoverId = uploadedId;
					} else {
						$tip('封面上传失败：未获取到有效的资源ID', {
							color: 'error',
							icon: 'mdi-alert-circle',
						});
						postPending.value = false;
						return;
					}
				} catch (err: unknown) {
					const errorMessage =
						err instanceof Error ? err.message : '封面上传失败';
					if (errorMessage === '用户取消了上传') {
						$tip('用户取消上传', {
							color: 'error',
							icon: 'mdi-alert-circle',
						});
						postPending.value = false;
						return;
					}

					$tip(errorMessage, {
						color: 'error',
						icon: 'mdi-alert-circle',
					});
					postPending.value = false;
					return;
				} finally {
					overlay.value = false;
					uploadController.value = null;
				}
			} else {
				// 编辑模式：保持原有的 cover_id
				finalCoverId = tagForm.cover_id ?? null;
			}
		} else {
			// 创建模式：使用第一步上传的 cover_id
			finalCoverId = uploadedCoverId.value;
		}

		// 构建请求体
		const requestBody: {
			content: string;
			cover_id?: number;
		} = {
			content: tagForm.content,
		};

		// 只有当 cover_id 是有效的正数时才添加到请求体中
		if (
			finalCoverId !== null &&
			finalCoverId !== undefined &&
			finalCoverId > 0
		) {
			requestBody.cover_id = finalCoverId;
		}

		if (isEditing.value && editingTagId.value) {
			// 更新标签
			const { error } = await useApiFetch(
				`/api/admin/tag/${editingTagId.value}`,
				{
					method: 'PUT',
					body: requestBody,
				},
			);

			if (error.value) {
				return;
			}

			$tip('标签更新成功！', {
				color: 'success',
				icon: 'mdi-check-circle',
			});
		} else {
			// 创建标签
			const { error } = await useApiFetch('/api/admin/tag', {
				method: 'POST',
				body: requestBody,
			});

			if (error.value) {
				return;
			}

			$tip('标签创建成功！', {
				color: 'success',
				icon: 'mdi-check-circle',
			});
		}

		// 关闭对话框
		isDialogOpen.value = false;

		// 重置表单
		formRef.value?.reset();
		tagForm.content = '';
		tagForm.cover_id = null;
		coverFile.value = null;
		currentCoverUrl.value = null;
		currentStep.value = 1;
		uploadedCoverId.value = null;

		// 刷新列表
		await refreshList();

		// 刷新所有标签列表（用于搜索下拉框）
		await refreshAllTags();
	} finally {
		postPending.value = false;
	}
};

// 取消上传
const cancelUpload = () => {
	if (uploadController.value) {
		uploadController.value.abort();

		// 重置 UI 状态
		overlay.value = false;
		progress.value = 0;
		speed.value = '0 B/s';
		uploadController.value = null;

		$tip('上传操作已取消', {
			color: 'warning',
			icon: 'mdi-cancel',
		});
	}
};

// 确认删除
const confirmDelete = (item: { id: number; content: string }) => {
	showConfirm({
		title: '确认删除',
		message: `你确认要删除标签 "${item.content}" 吗？`,
		icon: 'mdi-delete',
		confirmText: '确认删除',
		onConfirm: async () => {
			await handleDelete(item.id);
		},
	});
};

// 执行删除
const handleDelete = async (id: number) => {
	const { error } = await useApiFetch(`/api/admin/tag/${id}`, {
		method: 'DELETE',
	});

	if (error.value) {
		return;
	}

	$tip('标签删除成功！', {
		color: 'success',
		icon: 'mdi-check-circle',
	});

	// 刷新列表
	await refreshList();

	// 刷新所有标签列表（用于搜索下拉框）
	await refreshAllTags();

	// 如果删除后当前页没有数据，且不是第一页，则跳转到上一页
	if (filteredList.value.length === 0 && page.value > 1) {
		page.value = page.value - 1;
	}
};

// 监听分页变化，刷新列表
watch(page, () => {
	refreshList();
});

// 监听搜索关键词变化，重置到第一页并刷新列表
watch(searchKey, () => {
	if (page.value !== 1) {
		page.value = 1;
	} else {
		// 如果已经在第一页，直接刷新列表
		refreshList();
	}
});

useHead({
	title: '标签管理',
});
</script>

<style scoped></style>
