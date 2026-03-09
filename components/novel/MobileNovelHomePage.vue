<template>
	<v-container class="pa-0">
		<MobileTopBar />
		<!-- 小说默认为行布局 -->
		<template v-if="isNovelVertical">
			<MobileHomepageRowLayout
				:on-card-click="gotoChapter"
				work-type="Novel"
			></MobileHomepageRowLayout>
		</template>
		<!-- 移动端行布局 -->
		<template v-if="!isNovelVertical">
			<MobileHomepageColumnLayout
				:on-card-click="gotoChapter"
				work-type="Novel"
			></MobileHomepageColumnLayout>
		</template>
	</v-container>
</template>

<script setup lang="ts">
const settingsStore = useSettingsStore();
//toRefs保持响应式
const { isNovelVertical } = storeToRefs(settingsStore);

//获取作品章节的最小id（第一章）

const router = useRouter();

const gotoChapter = (id: number) => {
	router.push(`/novel/${id}`);
};
</script>

<style scoped></style>
