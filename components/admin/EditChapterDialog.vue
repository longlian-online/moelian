<template>
	<v-dialog v-model="dialog" max-width="600">
		<template #activator="{ props: activatorProps }">
			<v-btn
				class="text-none font-weight-regular"
				prepend-icon="mdi-upload"
				stacked
				size="x-small"
				color="primary"
				variant="text"
				text="上传"
				v-bind="activatorProps"
			>
				上传</v-btn
			>
		</template>

		<v-card prepend-icon="mdi-pencil" title="编辑作品">
			<template #append>
				<v-btn icon="mdi-close" elevation="0" @click="dialog = false"></v-btn>
			</template>
			<v-form ref="form">
				<v-card-text>
					<template v-if="selectedContentType === 'Manga'">
						<v-file-input
							v-model="chapterFile"
							label="上传章节压缩包"
							prepend-icon="mdi-zip-box-outline"
							accept=".zip,.rar,.7z"
							:rules="fileRules"
							show-size
							counter
							hint="支持拖拽上传，只支持 .zip, .rar, .7z 等压缩文件"
							persistent-hint
						></v-file-input>
					</template>
					<template v-else>
						<v-file-input
							v-model="chapterFile"
							label="上传章节文档文件"
							prepend-icon="mdi-file-document-outline"
							accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
							:rules="fileDocxRules"
							show-size
							counter
							hint="支持拖拽上传，只支持 .docx 格式的文档文件"
							persistent-hint
						></v-file-input>
					</template>
				</v-card-text>

				<v-divider></v-divider>

				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn text="关闭" variant="plain" @click="dialog = false"></v-btn>
					<v-btn
						color="primary"
						text="保存"
						variant="tonal"
						@click="submitFile()"
					></v-btn>
				</v-card-actions>
			</v-form>
		</v-card>
	</v-dialog>

	<!-- 加载遮罩 -->
	<UploadProgressOverlay
		v-model="overlay"
		:progress="progress"
		:speed="speed"
		@cancel="cancelUpload"
	></UploadProgressOverlay>
</template>

<script lang="ts" setup>
import { VForm } from 'vuetify/components';
import type { ChapterAdminListItem } from '~/shared/dto/admin/chapter';
const props = defineProps<{
	itemData: ChapterAdminListItem;
}>();
const selectedContentType = computed(() => props.itemData.contentType);
const chapterId = computed(() => props.itemData.id);
const chapterStore = useAdminChapterStore();
const { $tip } = useNuxtApp();
const chapterFile = ref<File | null>(null);
const overlay = ref(false);
//进度条信息
const progress = ref(0);
const speed = ref('O MB/s');
//取消上传函数
const uploadController = ref<AbortController | null>(null);

const fileRules = [
	(v: File | null) => !!v || '请选择章节压缩包',
	(v: File) => {
		const allowedTypes = ['zip', 'rar', '7z'];
		const fileExtension = v.name.split('.').pop()?.toLowerCase();
		return (
			allowedTypes.includes(fileExtension as string) ||
			'只支持 .zip, .rar, .7z 等压缩文件'
		);
	},
];

const fileDocxRules = [
	(v: File | null) => !!v || '请选择章节文件',
	(v: File) => {
		const fileExtension = v.name.split('.').pop()?.toLowerCase();
		return fileExtension === 'docx' || '只支持 .docx 文件';
	},
];

async function uploadChapterContent(
	chapterId: number,
	contentId: number,
	totalPage: number,
) {
	return await useApiFetch(`/api/admin/chapter/${chapterId}/content`, {
		method: 'POST',
		body: {
			contentId,
			totalPage,
		},
	});
}

// 提交文件函数
async function submitFile() {
	if (!form.value) return;

	const validationResult = await form.value.validate();

	if (validationResult.valid && chapterFile.value) {
		try {
			showConfirm({
				title: '确认上传',
				message: '你确认要上传所选文件吗？\n上传过程可能需要一些时间。',
				confirmText: '确认上传',
				icon: 'mdi-upload-multiple',
				onConfirm: async () => {
					dialog.value = false; // 关闭编辑对话框
					overlay.value = true; // 开启全局遮罩
					//创建新的 AbortController 并保存
					const controller = new AbortController();
					uploadController.value = controller;
					const contentId = await uploadToCos(
						chapterFile.value,
						'/api/admin/resource',
						selectedContentType.value,
						({ percent, speed: s }) => {
							progress.value = percent;
							speed.value = s;
						},
						controller.signal,
					);

					await uploadChapterContent(chapterId.value!, contentId, 0);
					await chapterStore.refreshList();
					overlay.value = false; // 成功后立即关闭遮罩
					dialog.value = false; // 成功后立即关闭对话框
					uploadController.value = null; // 清除引用
					//timeout -1代表永远保留 需要手动关闭
					$tip(`上传成功！`, {
						timeout: -1,
					});
				},
			});
		} catch (err) {
			if (err.message === '用户取消了上传') {
				$tip('用户取消上传', {
					color: 'error',
					icon: 'mdi-alert-circle',
				});
				return;
			}
			console.error(err);
			$tip('上传失败', { color: 'error', icon: 'mdi-alert-circle' });
		} finally {
			if (overlay.value) {
				// 仅在出错时执行清理
				overlay.value = false;
			}
			if (dialog.value) {
				dialog.value = false;
			}
			uploadController.value = null; // 清除 controller
		}
	} else {
		$tip('文件验证失败');
	}
}

// 步骤1: 明确指定 form ref 的类型
const form = ref<VForm | null>(null);
const dialog = ref(false);

function cancelUpload() {
	if (uploadController.value) {
		uploadController.value.abort(); // 中断请求

		// 重置 UI 状态
		overlay.value = false;
		progress.value = 0;
		speed.value = '0 MB/s';
		uploadController.value = null; // 清除引用

		$tip('上传操作已取消', {
			color: 'warning',
			icon: 'mdi-cancel',
		});
	}
}
</script>

<style scoped></style>
