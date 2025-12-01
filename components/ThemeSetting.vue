<template>
	<v-card class="pa-4 rounded-xl">
		<v-card-title class="text-h5 font-weight-black mb-4 d-flex align-center">
			<v-icon icon="mdi-theme-light-dark" color="primary" class="mr-3"></v-icon>
			主题设置
		</v-card-title>

		<!-- 主题选择区 -->
		<v-card-text>
			<v-row class="px-2">
				<!-- 循环遍历所有主题预设 -->
				<v-col
					v-for="(config, key) in READER_THEME_PRESETS"
					:key="key"
					cols="6"
					sm="4"
					md="3"
					class="d-flex flex-column align-center pa-2"
				>
					<div
						v-ripple
						class="theme-option cursor-pointer pa-1"
						:class="{ 'active-theme': themeChoice === key }"
						@click="setReaderThemeChoice(key)"
					>
						<!-- 主题颜色圆形预览 -->
						<div
							class="theme-circle rounded-circle elevation-4"
							:style="{ backgroundColor: config.background }"
						></div>
					</div>

					<!-- 主题名称 -->
					<span
						class="text-caption mt-3 text-center font-weight-medium"
						:class="{
							'text-primary font-weight-bold': themeChoice === key,
						}"
					>
						{{ config.name }}
					</span>
				</v-col>
			</v-row>
		</v-card-text>
	</v-card>
</template>

<script setup lang="ts">
import { useReaderTheme } from '~/composables/useReaderTheme';

const { themeChoice, applyReaderTheme, READER_THEME_PRESETS } =
	useReaderTheme();

const setReaderThemeChoice = (key: keyof typeof READER_THEME_PRESETS) => {
	applyReaderTheme(key);
};
</script>

<style scoped>
/* 主题样式 */
.theme-option {
	transition: all 0.2s ease-in-out;
	width: 76px;
	height: 76px;
	border-radius: 50%;
	display: flex;
	justify-content: center;
	align-items: center;
}

/* 实际的颜色预览圆形 */
.theme-circle {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}

/* 选中状态的样式 */
.active-theme {
	border-color: rgb(var(--v-theme-primary));
	border: 4px solid rgb(var(--v-theme-primary));
	transform: scale(1.1);
}

.cursor-pointer {
	cursor: pointer;
}
</style>
