<template>
	<div>
		<!-- 加载遮罩 -->
		<UploadProgressOverlay
			v-model="overlay"
			:progress="progress"
			:speed="speed"
			:message="overlayMessage"
			@cancel="cancelUpload"
		></UploadProgressOverlay>

		<v-container>
			<v-card class="pa-4">
				<v-stepper
					v-model="currentStep"
					:items="['基本信息', '上传文件']"
					class="rounded-lg"
					elevation="0"
				>
					<v-form ref="form">
						<v-card-title class="text-h5 font-weight-bold">
							{{ currentStep === 1 ? '上传章节' : '上传文件' }}
						</v-card-title>

						<div v-if="currentStep === 1" key="step-1">
							<v-card-text>
								<v-text-field
									v-model="workInfo.title"
									label="作品"
									disabled
								></v-text-field>
								<v-text-field
									v-model="contentTypeText"
									label="类型"
									disabled
								></v-text-field>

								<v-text-field
									v-model="formData.chapterTitle"
									label="章节标题"
									:rules="chapterTitleRules"
									required
								></v-text-field>
							</v-card-text>
						</div>

						<div v-if="currentStep === 2" key="step-2">
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
						</div>
					</v-form>

					<template #actions="{ next, prev }">
						<v-card-actions class="d-flex justify-space-between mt-4">
							<v-btn
								v-if="currentStep > 1"
								prepend-icon="mdi-arrow-left"
								color="secondary"
								variant="outlined"
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
								@click="() => submitInfoAndGoNext(next)"
							>
								提交信息且下一步
							</v-btn>
							<v-btn
								v-if="currentStep === 2"
								prepend-icon="mdi-check"
								color="primary"
								@click="submitFile"
							>
								提交
							</v-btn>
						</v-card-actions>
					</template>
				</v-stepper>
			</v-card>
		</v-container>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { VForm } from 'vuetify/components';
import mammoth from 'mammoth';
import JSZip from 'jszip';

definePageMeta({
	layout: 'admin',
});
const { $tip } = useNuxtApp();
const router = useRouter();
const route = useRoute();
const id = Number(route.params.id);
const chapterId = ref<number | null>(null);
// 步骤状态，从 1 开始
const currentStep = ref(1);
const chapterStore = useAdminChapterStore();
const overlay = ref(false);
// 自定义遮罩提示信息
const overlayMessage = ref('');
//进度条信息
const progress = ref(0);
const speed = ref('O MB/s');
//取消上传函数
const uploadController = ref<AbortController | null>(null);
// 从 store 拿到 work
const adminStore = useAdminWorkStore();
const info = computed(() => adminStore.getWorkById(id));

const formData = ref({
	workId: null as number | null,
	chapterNumber: 1,
	chapterTitle: '',
});

const workInfo = computed(() => ({
	title: info.value?.title ?? '',
	id: info.value?.id ?? null,
	content_type: info.value?.content_type ?? 'Manga',
}));

const selectedContentType = computed<'Manga' | 'Novel' | 'Avatar' | 'Cover'>(
	() => workInfo.value.content_type,
);

const contentTypeText = computed(() =>
	workInfo.value.content_type === 'Manga' ? '漫画' : '小说',
);

const chapterFile = ref<File | null>(null);
const form = ref<VForm | null>(null);

const chapterTitleRules = [
	(v: string) => !!v || '章节标题不能为空',
	(v: string) => v.length <= 100 || '章节标题不能超过100个字符',
];

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

// 提交基本信息并进入下一步
async function submitInfoAndGoNext(next: () => void) {
	if (!form.value) return;

	const validationResult = await form.value.validate();

	// 确保 workId 不为 null
	formData.value.workId = workInfo.value.id;

	if (validationResult.valid) {
		const payload = {
			title: formData.value.chapterTitle,
			workId: formData.value.workId,
			no: formData.value.chapterNumber,
			contentType: selectedContentType.value,
		};

		//这里应该返回章节id和biz_no
		const { data, error } = await useApiFetch('/api/admin/chapter', {
			method: 'POST',
			body: payload,
		});

		// 如果有业务错误，useApiFetch 已经弹提示了，这里直接 return
		if (error.value) {
			console.error('创建作品失败:', error.value);
			return;
		}

		// 成功逻辑
		// @ts-expect-error 能访问的到id，不想添加类型判断
		chapterId.value = data.value?.data!.id;
		$tip('章节创建成功！');
		next();
	}
}

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

// DOCX 内容项接口
interface ChapterContentItem {
	text: string | null;
	resourceId: number | null;
	file?: File | null;
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
			overlay.value = true; // 开启全局遮罩
			//创建新的 AbortController 并保存
			const controller = new AbortController();
			uploadController.value = controller;

			const isDocx =
				chapterFile.value.name.endsWith('.docx') ||
				chapterFile.value.type ===
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

			if (isDocx) {
				// --- DOCX 处理流程 ---
				overlayMessage.value = '正在解析文档...';
				progress.value = 0;
				speed.value = '';

				// 1. 解析
				const contentItems = await processDocx(chapterFile.value);

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

				$tip('处理完成！数据已输出到控制台并下载为 ZIP 文件', {
					icon: 'mdi-check-circle',
					timeout: -1,
				});
			} else {
				// --- 原有 ZIP 处理流程 ---
				overlayMessage.value = '正在上传文件...';
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
				//timeout -1代表永远保留 需要手动关闭
				$tip(`上传成功！`, {
					timeout: -1,
				});
				router.push(`/admin/chapter/${id}`);
			}
		} catch (err) {
			//  捕获并静默处理用户取消的错误
			if (err.message === '用户取消了上传') {
				$tip('用户取消上传', {
					color: 'error',
					icon: 'mdi-alert-circle',
				});
				return;
			}
			//处理其他失败
			console.error(err);
			$tip('上传失败: ' + (err.message || '未知错误'), {
				color: 'error',
				icon: 'mdi-alert-circle',
				timeout: -1,
			});
		} finally {
			overlay.value = false; // 关闭全局遮罩
			overlayMessage.value = ''; // 重置消息
			uploadController.value = null; // 清除 controller
		}
	} else {
		$tip('文件验证失败');
	}
}

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

useHead({
	title: '上传章节',
});
</script>

<style scoped></style>
