<template>
	<div>
		<!-- 加载遮罩 -->
		<UploadProgressOverlay
			v-model="overlay"
			:progress="progress"
			:speed="speed"
			@cancel="cancelUpload"
		></UploadProgressOverlay>

		<v-container>
			<v-card class="pa-4">
				<v-stepper
					v-model="currentStep"
					:items="['基本信息', '上传封面']"
					class="rounded-lg"
					elevation="0"
				>
					<v-form ref="form">
						<v-card-title class="text-h5 font-weight-bold">
							{{ currentStep === 1 ? '创建作品' : '上传封面' }}
						</v-card-title>

						<div v-if="currentStep === 1" key="step-1">
							<v-row class="pl-2 d-flex align-center" no-gutters>
								<v-col cols="4">
									<v-radio-group
										v-model="formData.contentType"
										label="作品类型"
										required
										inline
									>
										<v-radio label="漫画" value="Manga"></v-radio>
										<v-radio label="小说" value="Novel"></v-radio>
									</v-radio-group>
								</v-col>
								<v-col cols="4">
									<v-radio-group
										v-model="formData.lengthType"
										label="篇幅长度"
										required
										inline
									>
										<v-radio label="短篇" value="Short"></v-radio>
										<v-radio label="中篇" value="Medium"></v-radio>
										<v-radio label="长篇" value="Long"></v-radio>
									</v-radio-group>
								</v-col>
							</v-row>
							<v-text-field
								v-model="formData.title"
								label="书名"
								:rules="titleRules"
								required
							></v-text-field>
							<v-row>
								<v-col cols="6">
									<v-text-field
										v-model="formData.author"
										label="作者"
										:rules="authorRules"
										required
									></v-text-field>
								</v-col>
								<!-- <v-col cols="6">
									<v-select
										v-model="formData.typeId"
										label="作品类别"
										:items="typeItems"
										:rules="typeRules"
										required
									></v-select>
								</v-col> -->
							</v-row>
							<v-textarea
								v-model="formData.description"
								label="描述"
								:rules="descriptionRules"
								required
							></v-textarea>
						</div>

						<div v-if="currentStep === 2" key="step-2">
							<v-sheet class="mt-4">
								<v-file-input
									v-model="coverFile"
									label="选择封面文件"
									accept="image/*"
									prepend-icon="mdi-camera"
									show-size
									truncate-length="15"
								></v-file-input>
								<v-checkbox v-model="isOpenDefaultCover">
									<template #label>
										<span class="text-caption">是否启用默认封面</span>
									</template></v-checkbox
								>
							</v-sheet>
						</div>
					</v-form>

					<template #actions="{ next, prev }">
						<v-card-actions class="d-flex justify-space-between mt-4">
							<v-btn
								v-if="currentStep > 1"
								color="secondary"
								prepend-icon="mdi-arrow-left"
								variant="outlined"
								@click="prev()"
							>
								上一步
							</v-btn>
							<v-spacer></v-spacer>
							<v-btn
								v-if="currentStep < 2"
								color="primary"
								variant="tonal"
								size="large"
								prepend-icon="mdi-arrow-right"
								@click="() => validateAndGoNext(next)"
							>
								创建作品并下一步
							</v-btn>
							<v-btn
								v-if="currentStep === 2"
								color="primary"
								prepend-icon="mdi-check"
								@click="submitForm"
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
import { useCoverCanvas } from '@/composables/useCoverCanvas';
import type { VForm } from 'vuetify/components';
import type { WorkCreateReq, WorkCreateRes } from '~/shared/dto/admin/work';
import defaultCover from '~/public/default.jpg';
definePageMeta({
	layout: 'admin',
});
const { generateCoverImage } = useCoverCanvas();
const { $tip } = useNuxtApp();
const adminWorkStore = useAdminWorkStore();
const overlay = ref(false);
// 步骤状态，从 1 开始
const currentStep = ref(1);
const router = useRouter();
const form = ref<VForm | null>(null);
const coverFile = ref<File | null>(null);
//进度条和速度
const progress = ref(0);
const speed = ref('O MB/s');
//取消上传函数
const uploadController = ref<AbortController | null>(null);

let workId: number | null = null;
const formData = ref<WorkCreateReq>({
	title: '',
	author: '',
	description: '',
	lengthType: 'Short',
	contentType: 'Manga',
});
//是否启用默认封面
const isOpenDefaultCover = ref(false);

// 验证规则
const titleRules = [
	(v: string) => !!v || '标题不能为空',
	(v: string) => v.length <= 64 || '标题不能超过64个字符',
];
const authorRules = [
	(v: string) => !!v || '作者不能为空',
	(v: string) => v.length <= 30 || '作者名不能超过30个字符',
];
const descriptionRules = [
	(v: string) => !!v || '描述不能为空',
	(v: string) => v.length >= 10 || '描述至少需要10个字符',
	(v: string) => v.length <= 500 || '描述不能超过500个字符',
];
//预留字段
// const typeRules = [(v: string) => !!v || '作品类别不能为空'];

// 验证表单并调用 API 创建作品
async function validateAndGoNext(next: () => void) {
	if (!form.value) return;

	const validationResult = await form.value.validate();
	if (!validationResult.valid) {
		$tip('表单验证失败', { color: 'error', icon: 'mdi-alert-circle' });
		return;
	}

	const { data, error } = await useApiFetch<WorkCreateRes>('/api/admin/work', {
		method: 'POST',
		body: formData.value,
	});

	// 如果有业务错误，useApiFetch 已经弹提示了，这里直接 return
	if (error.value) {
		console.error('创建作品失败:', error.value);
		return;
	}

	// 成功逻辑
	workId = data.value.data.id;
	await adminWorkStore.refreshList();
	$tip('作品创建成功！', { color: 'success', icon: 'mdi-check-circle' });
	next();
}

async function submitForm() {
	// 1. 如果勾选了默认封面
	if (isOpenDefaultCover.value) {
		// 1a. 检查是否同时上传了文件
		if (coverFile.value) {
			// 默认封面和文件上传冲突，阻止提交并给出提示
			$tip('你已启用默认封面，不可以再上传封面。', {
				color: 'error',
				icon: 'mdi-alert-circle',
				timeout: 5000, // 自动关闭
			});
			return; // 阻止函数继续执行
		}

		// 1b. 仅启用默认封面，不上传文件
		await handleGenerateCover();
		return;
	}
	// 2. 如果没有勾选默认封面，但没有选择文件
	if (!coverFile.value) {
		$tip('没有封面文件被选中', {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
		return;
	}

	try {
		overlay.value = true; // 开启遮罩
		//创建新的 AbortController 并保存
		const controller = new AbortController();
		uploadController.value = controller;
		// 1. 调用工具函数上传到 COS
		const coverId = await uploadToCos(
			coverFile.value,
			'/api/admin/resource',
			'Cover',
			({ percent, speed: s }) => {
				progress.value = percent;
				speed.value = s;
			},
			controller.signal,
		);
		// 2. 上传成功
		// TODO: 调用后端接口，保存封面 URL 到作品数据
		await adminWorkStore.updateWorkCover(workId, coverId);
		//timeout -1代表永远保留 需要手动关闭
		$tip('封面上传成功！', {
			color: 'success',
			icon: 'mdi-check',
			timeout: -1,
		});
		router.push('/admin');
	} catch (err) {
		//  捕获并静默处理用户取消的错误
		if (err.message === '用户取消了上传') {
			$tip('用户取消上传', {
				color: 'error',
				icon: 'mdi-alert-circle',
			});
			return;
		}

		$tip(err.message || '封面上传失败', {
			color: 'error',
			icon: 'mdi-alert-circle',
			timeout: -1,
		});
	} finally {
		overlay.value = false; // 关闭遮罩
		uploadController.value = null; // 清除 controller
	}
}

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

// 自动生成默认封面并上传
async function handleGenerateCover() {
	try {
		const file = await generateCoverImage(
			formData.value.author,
			formData.value.title,
			defaultCover,
		);
		const fileId = await uploadToCos(file, '/api/admin/resource', 'Cover');
		await adminWorkStore.updateWorkCover(workId, fileId);
		$tip('默认封面启用成功！', {
			color: 'success',
			icon: 'mdi-check',
		});
		router.push('/admin');
	} catch (err) {
		$tip(err.message || '默认封面上传失败', {
			color: 'error',
			icon: 'mdi-alert-circle',
			timeout: -1,
		});
	}
}

useHead({
	title: '创建作品 ',
});
</script>

<style scoped></style>
