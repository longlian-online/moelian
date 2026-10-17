<template>
	<DesktopDetail v-bind="props" mobile />
</template>

<script setup lang="ts">
const props = defineProps<{
	recommendedTitle: string;
	btnContent: string;
	contentType: string;
}>();
</script>
