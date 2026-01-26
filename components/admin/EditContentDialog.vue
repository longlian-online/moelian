<template>
	<v-dialog v-model="dialog" max-width="600">
		<template #activator="{ props: activatorProps }">
			<v-btn
				stacked
				prepend-icon="mdi-pencil"
				text="编辑"
				size="x-small"
				variant="text"
				color="primary"
				v-bind="activatorProps"
			></v-btn>
		</template>
		<v-card prepend-icon="mdi-pencil" title="编辑作品">
			<template #append>
				<v-btn icon="mdi-close" elevation="0" @click="dialog = false"></v-btn>
			</template>
			<v-form ref="form">
				<v-card-text>
					<v-row dense>
						<v-col cols="12" md="8" sm="8">
							<v-text-field
								v-model="formData.title"
								label="标题"
								required
								variant="outlined"
								:rules="rules.title"
							></v-text-field>
						</v-col>
						<v-col cols="12" md="4" sm="4">
							<v-text-field
								v-model="formData.author"
								label="作者"
								required
								variant="outlined"
								:rules="rules.author"
							></v-text-field>
						</v-col>

						<v-col cols="6">
							<v-select
								v-model="formData.length_type"
								label="篇幅"
								:items="contentLengthItems"
								item-title="title"
								item-value="value"
								required
								variant="outlined"
								:rules="rules.required"
							></v-select>
						</v-col>
						<!-- 预留字段typeId -->

						<!-- <v-col cols="12" md="4" sm="6">
								<v-select
									v-model="formData.type"
									label="作品类别"
									:items="['现代', '古风', '架空', '科幻', '甜宠', '虐恋']"
									required
									variant="outlined"
									:rules="rules.required"
								></v-select>
							</v-col> -->

						<v-col cols="6">
							<v-select
								v-model="formData.content_type"
								label="作品类型"
								:items="contentTypeItems"
								item-title="title"
								item-value="value"
								required
								variant="outlined"
								:rules="rules.required"
							></v-select>
						</v-col>
						<v-col cols="12">
							<v-select
								v-model="formData.serial_status"
								label="连载状态"
								:items="serialStatusItems"
								item-title="title"
								item-value="value"
								required
								variant="outlined"
								:rules="rules.required"
							></v-select>
						</v-col>

						<v-col cols="12" md="12" sm="12">
							<v-textarea
								v-model="formData.description"
								label="描述"
								required
								variant="outlined"
								:rules="rules.description"
							></v-textarea>
						</v-col>

						<v-col cols="12">
							<v-combobox
								v-model="selectedTagNames"
								:items="allTagItems"
								label="选择标签"
								prepend-icon="mdi-tag-multiple"
								variant="outlined"
								chips
								clearable
								closable-chips
								multiple
								:return-object="false"
								:menu-props="{ maxHeight: '300' }"
								no-data-text="没有可用的标签"
								placeholder="选择已有标签"
							>
								<template v-slot:chip="{ props: chipProps, item }">
									<v-chip v-bind="chipProps" color="primary" variant="tonal">
										<strong>{{ item.raw }}</strong>
									</v-chip>
								</template>
							</v-combobox>
						</v-col>
					</v-row>
				</v-card-text>

				<v-divider></v-divider>

				<v-card-actions>
					<v-btn
						text="编辑封面"
						variant="tonal"
						color="warning"
						prepend-icon="mdi-image-edit"
						@click="uploadCoverDialog = true"
					></v-btn>

					<v-spacer></v-spacer>
					<v-btn text="关闭" variant="plain" @click="dialog = false"></v-btn>
					<v-btn
						color="primary"
						text="保存"
						variant="tonal"
						@click="handleSaveClick()"
					></v-btn>
				</v-card-actions>
			</v-form>
		</v-card>
	</v-dialog>

	<v-dialog v-model="uploadCoverDialog" max-width="600">
		<v-card prepend-icon="mdi-image-edit" title="编辑封面">
			<v-card-text>
				<v-sheet class="pa-0">
					<v-file-input
						v-model="coverFile"
						label="选择封面文件"
						accept="image/*"
						variant="outlined"
						prepend-icon="mdi-camera"
						show-size
						truncate-length="15"
					></v-file-input>
				</v-sheet>
			</v-card-text>
			<v-card-actions>
				<v-btn
					text="替换默认封面"
					variant="tonal"
					color="warning"
					prepend-icon="mdi-swap-horizontal"
					@click="replaceCover()"
				></v-btn>
				<v-spacer></v-spacer>
				<v-btn
					text="取消"
					variant="plain"
					@click="uploadCoverDialog = false"
				></v-btn>
				<v-btn
					color="primary"
					text="确认"
					variant="tonal"
					@click="confirmUpdateCover()"
				></v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts" setup>
import { VForm } from 'vuetify/components';
import type {
	WorkAdminListItem,
	WorkPutReq,
} from '../../shared/dto/admin/work';
import { useCoverCanvas } from '@/composables/useCoverCanvas';
import defaultCover from '~/public/default.jpg';

const { $tip } = useNuxtApp();
const props = defineProps<{
	itemData: WorkAdminListItem;
	overlay: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:overlay', value: boolean): void;
}>();

const { generateCoverImage } = useCoverCanvas();
// 步骤1: 明确指定 form ref 的类型
const form = ref<VForm | null>(null);
const uploadCoverDialog = ref(false);
const dialog = ref(false);
const formData = ref({ ...props.itemData });
const coverFile = ref<File | null>(null);
const workId = ref(props.itemData.id);
const rules = {
	// 使用 unknown 类型代替 any
	required: [
		(value: unknown) =>
			(value !== null && value !== undefined) || '此项为必填项。',
	],
	// 标题规则
	title: [
		(value: string) => !!value || '标题不能为空',
		(value: string) => value.length <= 100 || '标题不能超过100个字符',
	],
	// 作者规则
	author: [
		(value: string) => !!value || '作者不能为空',
		(value: string) => value.length <= 30 || '作者名不能超过30个字符',
	],
	// 描述规则
	description: [
		(value: string) => !!value || '描述不能为空',
		(value: string) => value.length >= 10 || '描述至少需要10个字符',
		(value: string) => value.length <= 500 || '描述不能超过500个字符',
	],
};

const handleSaveClick = async () => {
	// 使用可选链和非空断言来调用方法
	const { valid } = (await form.value?.validate()) || { valid: false };
	if (valid) {
		// 校验通过后，调用带确认框的保存操作
		confirmSave();
	}
};

const adminWorkStore = useAdminWorkStore();

// 获取所有标签列表
const { data: allTagsData } = useApiFetch<
	Array<{
		id: number;
		content: string;
		cover: string;
		created_at: string;
	}>
>('/api/admin/tag/all');

// 所有标签选项（用于 combobox）
const allTagItems = computed(() => {
	return allTagsData.value?.data?.map((tag) => tag.content) || [];
});

// 标签名称到 ID 的映射
const tagNameToIdMap = computed(() => {
	const map = new Map<string, number>();
	allTagsData.value?.data?.forEach((tag) => {
		map.set(tag.content, tag.id);
	});
	return map;
});

// 选中的标签名称
const selectedTagNames = ref<string[]>([]);

// 监听 dialog 打开，初始化选中的标签
watch(dialog, (newValue) => {
	if (newValue) {
		formData.value = JSON.parse(JSON.stringify(props.itemData));
		// 初始化选中的标签名称
		selectedTagNames.value = [...(props.itemData.tags || [])];
		// 使用可选链调用方法，并使用非空断言来满足类型检查
		form.value?.resetValidation();
	}
});

const confirmSave = async () => {
	showConfirm({
		title: '确认更改',
		message: '你确认要保存这些更改吗？',
		icon: 'mdi-help-circle',
		confirmText: '确认',
		onConfirm: async () => {
			// 异步操作
			const original = props.itemData;
			const current = JSON.parse(JSON.stringify(formData.value));

			// 检查标签是否有变化
			const originalTagNames = original.tags || [];
			const currentTagNames = selectedTagNames.value || [];
			const originalTagNamesSorted = [...originalTagNames].sort().join(',');
			const currentTagNamesSorted = [...currentTagNames].sort().join(',');

			// 判断有没有变化（包括标签）
			const hasFormDataChanged =
				JSON.stringify(original) !== JSON.stringify(current);
			const hasTagsChanged = originalTagNamesSorted !== currentTagNamesSorted;

			if (!hasFormDataChanged && !hasTagsChanged) {
				$tip('没有任何修改', { color: 'warning', icon: 'mdi-alert-circle' });
				return;
			}

			// 如果有表单数据变化，更新作品信息
			if (hasFormDataChanged) {
				// payload 严格按 WorkPutReq
				const payload: WorkPutReq = {
					title: current.title,
					author: current.author,
					description: current.description,
					lengthType: current.length_type,
					contentType: current.content_type,
					serialStatus: current.serial_status,
				};

				await adminWorkStore.updateWork(original.id, payload);
			}

			// 更新标签（如果有变化）
			if (hasTagsChanged) {
				// 过滤掉不在已有标签列表中的标签名称
				const validTagNames = currentTagNames.filter((name) =>
					tagNameToIdMap.value.has(name),
				);

				// 如果有无效的标签，提示用户
				if (validTagNames.length !== currentTagNames.length) {
					const invalidTags = currentTagNames.filter(
						(name) => !tagNameToIdMap.value.has(name),
					);
					$tip(`以下标签不存在，已自动移除：${invalidTags.join(', ')}`, {
						color: 'warning',
						icon: 'mdi-alert-circle',
					});
				}

				// 将标签名称转换为标签 ID
				const tagIds = validTagNames
					.map((name) => tagNameToIdMap.value.get(name))
					.filter((id): id is number => id !== undefined);

				const { error } = await useApiFetch(`/api/admin/work/${original.id}/tags`, {
					method: 'PATCH',
					body: {
						tag_ids: tagIds,
					},
				});

				if (error.value) {
					return;
				}
			}

			dialog.value = false;
		},
	});
};

const confirmUpdateCover = async () => {
	if (!coverFile.value) {
		$tip('请先选择封面', { color: 'warning' });
		return;
	}
	try {
		// 1. 调用工具函数上传到 COS
		emit('update:overlay', true); // 开启遮罩
		const coverId = await uploadToCos(
			coverFile.value,
			'/api/admin/resource',
			'Cover',
		);
		// 2. 上传成功
		// TODO: 调用后端接口，保存封面 URL 到作品数据
		await adminWorkStore.updateWorkCover(workId.value, coverId);
		$tip('封面上传成功！', { color: 'success', icon: 'mdi-check' });
		//关闭编辑封面对话框
		uploadCoverDialog.value = false;
		//关闭编辑对话框
		dialog.value = false;
	} catch (err) {
		$tip(err.message || '封面上传失败', {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
	} finally {
		emit('update:overlay', false); // 关闭遮罩
	}
};

//替换封面函数
function replaceCover() {
	showConfirm({
		title: '确认替换封面',
		message: '你确认要替换这部作品的封面吗？',
		icon: 'mdi-swap-horizontal',
		confirmText: '确认替换',
		onConfirm: async () => {
			await handleGenerateCover();
		},
	});
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
		await adminWorkStore.updateWorkCover(workId.value, fileId);
		$tip('替换封面成功！', {
			color: 'success',
			icon: 'mdi-check',
		});
		//关闭编辑封面对话框
		uploadCoverDialog.value = false;
		//关闭编辑对话框
		dialog.value = false;
	} catch (err) {
		$tip(err.message || '默认封面上传失败', {
			color: 'error',
			icon: 'mdi-alert-circle',
			timeout: -1,
		});
	} finally {
		emit('update:overlay', false); // 关闭遮罩
	}
}

const contentTypeItems = [
	{
		title: '漫画',
		value: 'Manga',
	},
	{
		title: '小说',
		value: 'Novel',
	},
];

const contentLengthItems = [
	{
		title: '短篇',
		value: 'Short',
	},
	{
		title: '中篇',
		value: 'Medium',
	},
	{
		title: '长篇',
		value: 'Long',
	},
];

const serialStatusItems = [
	{
		title: '连载中',
		value: 'Serializing',
	},
	{
		title: '已完结',
		value: 'Completed',
	},
];
</script>

<style scoped></style>
