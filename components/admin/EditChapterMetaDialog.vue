<template>
	<v-dialog v-model="dialog" max-width="600">
		<template  #activator="{ props: activatorProps }">
			<v-btn
				stacked
				text="编辑"
				size="x-small"
				color="green"
				variant="text"
				prepend-icon="mdi-pencil"
				v-bind="activatorProps"
			>
			</v-btn>
		</template>

		<v-card prepend-icon="mdi-pencil" title="编辑作品"  class="pa-4">
			<template #append>
				<v-btn icon="mdi-close" elevation="0" @click="dialog = false"></v-btn>
			</template>
			<v-form ref="form">
				<v-text-field
					v-model="formData.title"
					label="章节标题"
					required
					:rules="titleRules"
				></v-text-field>
			<v-number-input v-model="formData.priority" :rules="priorityRules" control-variant="split" :precision="1" :step="0.1" label="顺序"></v-number-input>

				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn text="关闭" variant="plain" @click="dialog = false"></v-btn>
					<v-btn
						color="primary"
						text="保存"
						variant="tonal"
						@click="handleSubmit()"
					></v-btn>
				</v-card-actions>
			</v-form>
		</v-card>
	</v-dialog>
</template>

<script lang="ts" setup>
import { VForm } from 'vuetify/components';

const props = defineProps<{
	id: number;
	title: string;
	priority: number;
	refresh: ()=>Promise<void>
}>()

const dialog = ref(false);
const form = ref<VForm | null>(null);
const formData = ref({
	title: props.title ?? "",
	priority: props.priority ? props.priority/10 : 0,
});

const titleRules = [
	(v: string) => !!v || '章节标题不能为空',
	(v: string) => v.length <= 100 || '章节标题不能超过100个字符',
];
const priorityRules = [
	(v: number) => !!v || '顺序不能为空',
	(v: number) => v!=0 || '顺序不能为0',
]

async function updateChapter(id: number, priority: number, title: string) {
	return useApiFetch(`/api/admin/chapter/${id}`, {
		method: 'put',
		body: {
			priority,
			title,
		},
	});
}

async function handleSubmit() {
	if (!formData.value) return;
	const validationResult = await form.value.validate();
	if (validationResult.valid) {
		showConfirm({
			title: '确认更改',
			message: '你确认要保存这些更改吗？',
			icon: 'mdi-help-circle',
			confirmText: '确认',
			onConfirm: async () => {
				// 异步操作
				const current = JSON.parse(JSON.stringify(formData.value));

				await updateChapter(props.id, current.priority*10, current.title);

				props.refresh();
				dialog.value = false;
			},
		});
	}
}
</script>

<style scoped></style>
