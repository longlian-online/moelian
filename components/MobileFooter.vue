<template>
	<v-bottom-navigation
		v-if="isMobile"
		v-model="value"
		color="teal"
		grow
		fixed
		class="force-bottom"
	>
		<v-btn>
			<v-icon>mdi-home-city</v-icon>
			主页
		</v-btn>

		<v-btn>
			<v-icon>mdi-account-group</v-icon>
			组员
		</v-btn>

		<v-btn>
			<v-icon>mdi-account</v-icon>
			我
		</v-btn>
	</v-bottom-navigation>
</template>

<script setup lang="ts">
const { isMobile } = useDevice();
const value = ref(0);
</script>

<style scoped></style>
