<template>
	<v-container class="pa-0">
		<MobileTopBar />
		<!-- 漫画默认为列布局 -->
		<template v-if="!isMangaVertical">
			<MobileHomepageColumnLayout
				:on-card-click="gotoManga"
				work-type="Manga"
			></MobileHomepageColumnLayout>
		</template>
		<!-- 移动端行布局 -->
		<template v-if="isMangaVertical">
			<MobileHomepageRowLayout
				:on-card-click="gotoManga"
				work-type="Manga"
			></MobileHomepageRowLayout>
		</template>
	</v-container>
</template>
<script setup lang="ts">
const settingsStore = useSettingsStore();
const { isMangaVertical } = storeToRefs(settingsStore);

const router = useRouter();
const gotoManga = (id: number) => {
	router.push(`/manga/${id}`);
};
</script>

<style scoped></style>
