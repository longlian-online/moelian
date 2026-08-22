<template>
	<v-dialog :model-value="modelValue" max-width="880" persistent>
		<v-card rounded="xl">
			<v-card-title class="d-flex align-center pa-5">
				<v-icon icon="mdi-crop" class="mr-2" />
				裁剪标签封面
			</v-card-title>

			<v-card-text class="px-5">
				<p class="text-body-2 text-medium-emphasis mb-3">
					拖动图片或裁剪框调整范围，也可以自由缩放和旋转。
				</p>
				<div class="cropper-shell">
					<Cropper
						ref="cropperRef"
						class="cover-cropper"
						:src="src"
						:stencil-props="{ aspectRatio: 4 / 3 }"
						:resize-image="{ adjustStencil: false }"
						image-restriction="stencil"
					/>
				</div>

				<div class="d-flex flex-wrap justify-center ga-2 mt-4">
					<v-btn
						prepend-icon="mdi-magnify-minus-outline"
						variant="tonal"
						@click="cropperRef?.zoom(0.85)"
					>
						缩小
					</v-btn>
					<v-btn
						prepend-icon="mdi-magnify-plus-outline"
						variant="tonal"
						@click="cropperRef?.zoom(1.15)"
					>
						放大
					</v-btn>
					<v-btn
						prepend-icon="mdi-rotate-left"
						variant="tonal"
						@click="cropperRef?.rotate(-90)"
					>
						左转
					</v-btn>
					<v-btn
						prepend-icon="mdi-rotate-right"
						variant="tonal"
						@click="cropperRef?.rotate(90)"
					>
						右转
					</v-btn>
					<v-btn
						prepend-icon="mdi-restore"
						variant="text"
						@click="cropperRef?.reset()"
					>
						重置
					</v-btn>
				</div>
			</v-card-text>

			<v-card-actions class="pa-5 pt-2">
				<v-spacer />
				<v-btn variant="text" :disabled="isProcessing" @click="cancel">
					取消
				</v-btn>
				<v-btn
					color="primary"
					variant="flat"
					prepend-icon="mdi-check"
					:loading="isProcessing"
					@click="confirmCrop"
				>
					使用裁剪结果
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

type CropperInstance = {
	getResult: () => { canvas?: HTMLCanvasElement };
	reset: () => void;
	rotate: (angle: number) => void;
	zoom: (factor: number) => void;
};

const props = defineProps<{
	modelValue: boolean;
	src: string;
	fileName: string;
	mimeType: string;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
	cancel: [];
	confirm: [file: File];
}>();

const cropperRef = ref<CropperInstance | null>(null);
const isProcessing = ref(false);

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string) =>
	new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('无法生成裁剪图片'))),
			mimeType,
			0.92,
		);
	});

const cancel = () => {
	emit('update:modelValue', false);
	emit('cancel');
};

const confirmCrop = async () => {
	const canvas = cropperRef.value?.getResult().canvas;
	if (!canvas) return;

	isProcessing.value = true;
	try {
		const mimeType =
			props.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
		const blob = await canvasToBlob(canvas, mimeType);
		const baseName = props.fileName.replace(/\.[^.]+$/, '') || 'tag-cover';
		const extension = mimeType === 'image/png' ? 'png' : 'jpg';
		emit(
			'confirm',
			new File([blob], `${baseName}-cropped.${extension}`, {
				type: mimeType,
				lastModified: Date.now(),
			}),
		);
		emit('update:modelValue', false);
	} finally {
		isProcessing.value = false;
	}
};
</script>

<style scoped>
.cropper-shell {
	height: min(58vh, 520px);
	min-height: 320px;
	overflow: hidden;
	border-radius: 12px;
	background: #171717;
}

.cover-cropper {
	height: 100%;
	width: 100%;
}
</style>
