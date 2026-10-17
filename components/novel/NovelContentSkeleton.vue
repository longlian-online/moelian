<template>
	<div class="novel-skeleton" role="status" aria-label="正在加载章节正文">
		<div class="skeleton-title" />
		<div v-for="paragraph in 5" :key="paragraph" class="skeleton-paragraph">
			<span v-for="line in 4" :key="line" class="skeleton-line" />
		</div>
	</div>
</template>

<style scoped>
.novel-skeleton {
	min-height: 70vh;
	padding: 18px 4px;
	overflow: hidden;
}
.skeleton-title,
.skeleton-line {
	display: block;
	border-radius: 3px;
	background: linear-gradient(
		100deg,
		rgba(var(--v-theme-on-surface), 0.07) 25%,
		rgba(var(--v-theme-on-surface), 0.12) 45%,
		rgba(var(--v-theme-on-surface), 0.07) 65%
	);
	background-size: 220% 100%;
	animation: novel-shimmer 1.8s ease-in-out infinite;
}
.skeleton-title {
	width: 38%;
	height: 22px;
	margin: 8px auto 38px;
}
.skeleton-paragraph {
	margin-bottom: 30px;
}
.skeleton-line {
	height: 12px;
	margin-bottom: 16px;
}
.skeleton-line:first-child {
	margin-left: 2em;
}
.skeleton-line:last-child {
	width: 68%;
}
@keyframes novel-shimmer {
	from {
		background-position: 100% 0;
	}
	to {
		background-position: -100% 0;
	}
}
@media (prefers-reduced-motion: reduce) {
	.skeleton-title,
	.skeleton-line {
		animation: none;
	}
}
</style>
