<template>
	<v-overlay
		:model-value="modelValue"
		class="align-center justify-center pa-8"
		persistent
	>
		<v-sheet
			class="pa-6 d-flex flex-column align-center"
			width="450"
			color="grey-darken-1"
			elevation="8"
			rounded="xl"
		>
			<v-progress-circular
				indeterminate
				color="primary"
				size="64"
			></v-progress-circular>
			<div class="mb-4 text-subtitle-1 text-white">
				<div :style="{ color: statusColor }">{{ statusText }}</div>
			</div>
			<v-progress-linear
				:model-value="progress"
				:color="progressColor"
				height="30"
				rounded
				striped
				class="w-100"
			>
				<template #default>
					<span class="font-weight-bold text-caption text-white pa-2">
						{{ progress }}%
					</span>
				</template>
			</v-progress-linear>

			<div
				class="mt-2 text-caption d-flex align-center justify-end w-100"
				style="color: orange"
			>
				<div style="font-size: 16px">当前速度：{{ speed }}</div>
				<v-spacer></v-spacer>
				<v-btn
					color="error"
					variant="text"
					style="font-size: 16px"
					@click="$emit('cancel')"
				>
					取消上传
				</v-btn>
			</div>
		</v-sheet>
	</v-overlay>
</template>

<script setup lang="ts">
// 定义组件接收的属性（Props）
const props = defineProps({
	/** 控制遮罩是否显示的布尔值 (用于 v-model) */
	modelValue: {
		type: Boolean,
		required: true,
	},
	/** 上传进度 (0-100) */
	progress: {
		type: Number,
		default: 0,
	},
	/** 上传速度文本 */
	speed: {
		type: String,
		default: '0 MB/s',
	},
	/** 自定义状态文本 */
	message: {
		type: String,
		default: '',
	},
});

// 定义组件发出的事件 (Emits)
defineEmits([
	'update:modelValue', // 默认的 v-model 更新事件
	'cancel', // 取消上传事件
]);

const statusText = computed(() => {
	if (props.message) {
		return props.message;
	}
	if (props.progress >= 100) {
		// 当进度达到 100% 时，表示文件传输已完成
		// 此时的延迟是服务器在处理（校验、写入、索引）
		return '上传完成，等待服务器处理和校验...';
	} else if (props.progress > 0) {
		// 进度在 0% 到 100% 之间
		return '正在上传中，喝杯咖啡吧☕';
	} else {
		// 进度为 0% 或初始状态
		return '正在准备上传，请稍候...';
	}
});

const statusColor = computed(() => {
	if (props.progress >= 100) {
		// 进度达到 100% 后，切换颜色
		return '#FFC107';
	} else {
		return 'white';
	}
});

const progressColor = computed(() => {
	if (props.progress >= 100) {
		// 进度达到 100% 后，切换颜色
		return 'warning';
	} else {
		return 'primary';
	}
});
</script>

<style scoped></style>
