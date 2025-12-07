<template>
	<v-app id="app">
		<Tip></Tip>
		<MobileBar></MobileBar>
		<v-main>
			<slot></slot>
		</v-main>
		<DesktopFooter></DesktopFooter>
	</v-app>
</template>

<script setup lang="ts"></script>

<style scoped></style>
