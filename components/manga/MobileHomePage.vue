<template>
	<v-container class="pa-0">
		<v-card>
			<v-tabs
				center-active
				slider-color="#77C138"
				color="#77C138"
				:elevation="0"
			>
				<v-tab value="manga" to="/manga">漫画</v-tab>
				<v-tab value="novel" to="/novel">小说</v-tab>
			</v-tabs>
		</v-card>
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
