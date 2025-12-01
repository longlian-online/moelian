<template>
	<v-card elevation="0">
		<v-toolbar title="设置">
			<template #prepend>
				<v-icon icon="mdi-cog" class="mx-2"></v-icon>
			</template>
		</v-toolbar>

		<div class="d-flex flex-row">
			<v-tabs v-model="tab" color="primary" direction="vertical">
				<v-tab prepend-icon="mdi-grid" text="布局设置" value="option-1"></v-tab>
				<v-tab
					prepend-icon="mdi-image-multiple"
					text="漫画设置"
					value="option-2"
				></v-tab>
				<v-tab prepend-icon="mdi-book" text="小说设置" value="option-3"></v-tab>
			</v-tabs>
			<v-divider vertical></v-divider>
			<v-tabs-window v-model="tab">
				<v-tabs-window-item value="option-1">
					<v-card flat>
						<v-card-text>
							<v-card-title class="pa-0">漫画布局喜好</v-card-title>
							<v-switch
								v-model="isMangaVertical"
								:label="` ${isMangaVertical ? '竖列' : '横列'}`"
								hide-details
								color="primary"
								inset
							></v-switch>
						</v-card-text>

						<v-card-text>
							<v-card-title class="pa-0">小说布局喜好</v-card-title>
							<v-switch
								v-model="isNovelVertical"
								:label="` ${isNovelVertical ? '竖列' : '横列'}`"
								hide-details
								color="primary"
								inset
							></v-switch>
						</v-card-text>
					</v-card>
				</v-tabs-window-item>

				<v-tabs-window-item value="option-2">
					<v-card flat>
						<v-card-text>
							<v-card-title class="pa-0">阅读模式</v-card-title>
							<v-switch
								v-model="scrollDirection"
								:label="` ${scrollDirection ? '左右滚动' : '上下滚动'}`"
								color="primary"
								hide-details
								inset
							>
							</v-switch>
							<v-card-title class="pa-0">翻页方向</v-card-title>
							<v-switch
								v-model="readingMode"
								:label="` ${readingMode ? '日漫模式' : '普通模式'}`"
								color="primary"
								hide-details
								inset
							></v-switch>
						</v-card-text>
					</v-card>
				</v-tabs-window-item>

				<v-tabs-window-item value="option-3">
					<ThemeSetting> </ThemeSetting>
				</v-tabs-window-item>
			</v-tabs-window>
		</div>
	</v-card>
</template>

<script setup lang="ts">
const settingsStore = useSettingsStore();
const { isMangaVertical, isNovelVertical } = storeToRefs(settingsStore);
const { scrollDirection, readingMode } = storeToRefs(settingsStore);
const tab = ref('option-1');

definePageMeta({
	readerTheme: 'setting',
	hideFooter: true,
});

useHead({
	title: '设置 - 阅读器设置',
});
</script>

<style scoped></style>
