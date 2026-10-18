<template>
	<div class="manga-page-skeleton" role="status" aria-label="正在加载漫画页面">
		<div class="skeleton-page">
			<img src="/moelian-logo.png" alt="" aria-hidden="true" />
			<p class="skeleton-loading-text">正在努力加载中…</p>
		</div>
	</div>
</template>
<style scoped>
.manga-page-skeleton {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4px;
	background: #121212;
}
.skeleton-page {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: #292929;
	border: 1px solid #383838;
}
.skeleton-page img {
	position: absolute;
	width: 32%;
	max-width: 160px;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	opacity: .55;
}
.skeleton-page::after {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(100deg, transparent 30%, #ffffff09 50%, transparent 70%);
	transform: translateX(-100%);
	animation: manga-page-shimmer 1.8s ease-in-out infinite;
}
@keyframes manga-page-shimmer { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .skeleton-page::after { animation: none; } }
</style>

<style scoped>
.skeleton-loading-text {
	position: absolute;
	top: calc(50% + 36px);
	left: 0;
	right: 0;
	margin: 0;
	padding: 0 12px;
	text-align: center;
	font-size: 13px;
	line-height: 1.6;
	letter-spacing: 1px;
	color: #aaa;
}
</style>
