<script setup lang="ts">
import type { NuxtError } from '#app';
defineProps<{ error?: NuxtError | null }>();
const goHome = () => clearError({ redirect: '/' });
const retry = () => window.location.reload();
</script>
<template>
	<v-app>
		<NotFoundState v-if="error?.statusCode === 404" fullscreen @home="goHome" />
		<NetworkErrorState v-else fullscreen @retry="retry" @home="goHome" />
	</v-app>
</template>
