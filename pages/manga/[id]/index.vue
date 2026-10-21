<template>
	<WorkDetail
		:mobile="isMobile"
		recommended-title="推荐漫画"
		content-type="manga"
	/>
</template>

<script setup lang="ts">
import { WorkDetailParams } from '~/shared/dto/web/work';
definePageMeta({
	validate: (route) => WorkDetailParams.safeParse(route.params).success,
});
const { isMobile } = useDevice();
</script>
