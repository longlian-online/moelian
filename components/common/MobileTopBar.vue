<template>
	<v-card v-if="isMobile">
		<v-tabs center-active slider-color="#77C138" color="#77C138" :elevation="0">
			<v-tab value="manga" to="/manga">漫画</v-tab>
			<v-tab value="novel" to="/novel">小说</v-tab>
			<v-tab value="classify" to="/classify">分类</v-tab>
		</v-tabs>
	</v-card>
</template>

<script setup lang="ts">
const { isMobile } = useDevice();
</script>
