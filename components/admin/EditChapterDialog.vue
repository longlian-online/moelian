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
		:message="overlayMessage"
		@cancel="cancelUpload"
	></UploadProgressOverlay>
</template>

<script lang="ts" setup>
import { VForm } from 'vuetify/components';
import type { ChapterAdminListItem } from '~/shared/dto/admin/chapter';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// DOCX 内容项接口
interface ChapterContentItem {
	text: string | null;
	resourceId: number | null;
	file?: File | null;
}
const props = defineProps<{
	itemData: ChapterAdminListItem;
}>();
const selectedContentType = computed(() => props.itemData.contentType);
const chapterId = computed(() => props.itemData.id);
const chapterStore = useAdminChapterStore();
const { $tip } = useNuxtApp();
const chapterFile = ref<File | null>(null);
const overlay = ref(false);
// 自定义遮罩提示信息
const overlayMessage = ref('');
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

// 解析 DOCX 文件
async function processDocx(file: File): Promise<ChapterContentItem[]> {
	const arrayBuffer = await file.arrayBuffer();
	const imageMap = new Map<string, File>();
	let imageCounter = 0;

	const options = {
		convertImage: mammoth.images.imgElement(function (image) {
			return image.read('base64').then(function (imageBuffer) {
				const type = image.contentType;
				const byteCharacters = atob(imageBuffer);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: type });
				const imgFile = new File(
					[blob],
					`image-${imageCounter}.${type.split('/')[1]}`,
					{ type },
				);

				const id = `img-${imageCounter++}`;
				imageMap.set(id, imgFile);
				return { src: id };
			});
		}),
	};

	const result = await mammoth.convertToHtml({ arrayBuffer }, options);
	const html = result.value;

	// 解析生成的 HTML
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const contentArray: ChapterContentItem[] = [];

	// 递归遍历提取内容
	function traverse(node: Node) {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent?.trim();
			if (text) {
				contentArray.push({ text: text, resourceId: null });
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as Element;
			if (el.tagName.toLowerCase() === 'img') {
				const src = el.getAttribute('src');
				if (src && imageMap.has(src)) {
					contentArray.push({
						text: null,
						resourceId: null,
						file: imageMap.get(src),
					});
				}
			} else {
				// 递归遍历子节点 (例如 <p> 中的内容)
				el.childNodes.forEach(traverse);
			}
		}
	}

	doc.body.childNodes.forEach(traverse);
	return contentArray;
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

					const isDocx =
						chapterFile.value!.name.endsWith('.docx') ||
						chapterFile.value!.type ===
							'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

					if (isDocx) {
						// --- DOCX 处理流程 ---
						overlayMessage.value = '正在解析文档...';
						progress.value = 0;
						speed.value = '';

						// 1. 解析
						const contentItems = await processDocx(chapterFile.value!);

						// 2. 构建 ZIP 包和 index.json
						overlayMessage.value = '正在打包数据...';
						const zip = new JSZip();
						const indexData: Array<{
							type: string;
							content?: string;
							url?: string;
						}> = [];
						let imageIndex = 1;

						for (const item of contentItems) {
							// 检查是否取消
							if (controller.signal.aborted) {
								throw new Error('用户取消了上传');
							}

							if (item.file) {
								// 将图片添加到 ZIP（使用 placeholder_{index} 命名）
								const fileExtension = item.file.name.split('.').pop() || 'png';
								const fileName = `placeholder_${imageIndex}`;
								zip.file(`${fileName}.${fileExtension}`, item.file);

								// 在 index.json 中使用占位符
								indexData.push({
									type: 'img',
									url: fileName,
								});

								imageIndex++;
							} else if (item.text) {
								indexData.push({
									type: 'text',
									content: item.text,
								});
							}
						}

						// 3. 添加 index.json 到 ZIP
						zip.file('index.json', JSON.stringify(indexData, null, 2));

						// 4. 生成并下载 ZIP
						overlayMessage.value = '正在生成下载文件...';
						const zipBlob = await zip.generateAsync({ type: 'blob' });
						const downloadUrl = URL.createObjectURL(zipBlob);
						const link = document.createElement('a');
						link.href = downloadUrl;
						link.download = `chapter-${chapterId.value}-data.zip`;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
						URL.revokeObjectURL(downloadUrl);

						await chapterStore.refreshList();
						overlay.value = false;
						dialog.value = false;
						uploadController.value = null;
						$tip('处理完成！数据已输出到控制台并下载为 ZIP 文件', {
							icon: 'mdi-check-circle',
							timeout: -1,
						});
					} else {
						// --- 原有 ZIP 处理流程 ---
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
					}
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
		overlayMessage.value = '';
		uploadController.value = null; // 清除引用

		$tip('上传操作已取消', {
			color: 'warning',
			icon: 'mdi-cancel',
		});
	}
}
</script>

<style scoped></style>
