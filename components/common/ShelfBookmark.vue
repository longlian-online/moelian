<script setup lang="ts">
const props = defineProps<{
	title: string;
	author?: string | null;
	to: string;
}>();
const pickArtwork = useRandomArtwork();
const artworkSrc = computed(() => pickArtwork(props.to));
const basePending = ref(true);
const artworkPending = ref(true);
const baseFailed = ref(false);
const artworkFailed = ref(false);
watch(artworkSrc, () => {
	artworkPending.value = true;
	artworkFailed.value = false;
});
// 缓存图片可能早于水合完成，补查 complete，避免占位一直不消失。
onMounted(() => {
	for (const img of surface.value?.querySelectorAll<HTMLImageElement>('img') ??
		[]) {
		if (!img.complete) continue;
		if (img.classList.contains('bookmark-character')) {
			artworkPending.value = false;
			artworkFailed.value = img.naturalWidth === 0;
		} else {
			basePending.value = false;
			baseFailed.value = img.naturalWidth === 0;
		}
	}
});
const characters = computed(() => Array.from(props.title));
const surface = useTemplateRef<HTMLElement>('surface');
let motion: Animation | undefined;
const setFloating = (floating: boolean) => {
	const paper = surface.value?.querySelector<HTMLElement>(
		'.bookmark-layer--paper',
	);
	if (!paper) return;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (floating && (!window.matchMedia('(hover: hover)').matches || reduced))
		return;
	// 先保存当前姿态，移开或再次进入时从当前位置接续。
	const current = getComputedStyle(paper).transform;
	motion?.cancel();
	motion = paper.animate(
		floating
			? [
					{ transform: current },
					{ transform: 'skewX(1.5deg) rotate(-2deg)', offset: 0.3 },
					{ transform: 'skewX(-1deg) rotate(1.4deg)', offset: 0.7 },
					{ transform: 'skewX(0deg) rotate(0deg)' },
				]
			: [{ transform: current }, { transform: 'skewX(0deg) rotate(0deg)' }],
		{
			duration: reduced ? 0 : floating ? 3000 : 650,
			iterations: floating ? Infinity : 1,
			easing: 'ease-in-out',
			fill: 'forwards',
		},
	);
};
onBeforeUnmount(() => motion?.cancel());
</script>

<template>
	<NuxtLink
		class="bookmark"
		:class="{ 'bookmark--loading': basePending || artworkPending }"
		:to="props.to"
		:aria-busy="basePending || artworkPending"
		:title="`${props.title} · ${props.author || '未知作者'}`"
		:aria-label="`${props.title} · ${props.author || '未知作者'}`"
		@pointerenter="setFloating(true)"
		@pointerleave="setFloating(false)"
	>
		<span ref="surface" class="bookmark-surface" aria-hidden="true">
			<span
				v-for="layer in ['clip', 'paper']"
				:key="layer"
				class="bookmark-layer"
				:class="`bookmark-layer--${layer}`"
			>
				<span class="bookmark-body">
					<span
						v-if="basePending || artworkPending || baseFailed"
						class="bookmark-base-placeholder"
						:class="{ 'bookmark-shimmer': basePending || artworkPending }"
					>
						<template v-if="basePending || artworkPending">
							<span class="bookmark-skeleton-title" />
							<span class="bookmark-skeleton-author" />
						</template>
					</span>
					<span
						v-if="basePending || artworkPending"
						class="bookmark-skeleton-hook"
					/>
					<span class="bookmark-art" aria-hidden="true">
						<span class="bookmark-image">
							<img
								class="bookmark-base-image"
								:class="{ 'bookmark-image-hidden': basePending || baseFailed }"
								src="/bookmarks/base.png"
								alt=""
								width="820"
								height="1918"
								@load="basePending = false"
								@error="
									basePending = false;
									baseFailed = true;
								"
							/>
							<img
								class="bookmark-character"
								:class="{
									'bookmark-image-hidden': artworkPending || artworkFailed,
								}"
								@load="artworkPending = false"
								@error="
									artworkPending = false;
									artworkFailed = true;
								"
								:src="artworkSrc"
								alt=""
								width="600"
								height="600"
							/>
						</span>
					</span>
					<span class="bookmark-title-area">
						<span class="bookmark-title"
							><span v-for="(character, index) in characters" :key="index">{{
								character
							}}</span></span
						>
					</span>
					<span class="bookmark-author">{{ props.author || '未知作者' }}</span>
				</span>
			</span>
		</span>
	</NuxtLink>
</template>

<style scoped>
.bookmark {
	display: block;
	position: relative;
	width: 76px;
	height: 390px;
	text-decoration: none;
	perspective: 700px;
}
.bookmark-surface {
	position: absolute;
	inset: 0;
	pointer-events: none;
}
.bookmark-layer {
	position: absolute;
	inset: 0;
	transform-origin: 50% 18%;
}
.bookmark-layer--clip {
	clip-path: inset(0 0 82% 0);
}
.bookmark-layer--paper {
	clip-path: inset(18% -50% -10% -50%);
}
.bookmark-body {
	position: absolute;
	inset: 0;
}
.bookmark:focus-visible {
	outline: 2px solid #a82355;
	outline-offset: 4px;
}
.bookmark-art {
	position: absolute;
	inset: 0;
	overflow: hidden;
}
.bookmark-image {
	position: absolute;
	top: 0;
	left: 50%;
	transform: translateX(-50%);
	aspect-ratio: 820 / 1918;
	height: 100%;
}
.bookmark-image img {
	display: block;
	width: 100%;
	height: 100%;
	max-width: none;
}
.bookmark-image .bookmark-character {
	position: absolute;
	left: 31.707317%;
	top: 76.642336%;
	width: 36.585366%;
	height: 15.641293%;
}
.bookmark-title-area {
	position: absolute;
	top: 26%;
	left: 38%;
	transform: translateX(-50%);
	width: 40%;
	height: 50%;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: 2px;
	overflow: hidden;
}
.bookmark-title,
.bookmark-author {
	font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'Yu Mincho', serif;
	font-weight: 500;
	color: #243247;
	text-shadow: none;
	writing-mode: vertical-rl;
	text-orientation: upright;
}
.bookmark-title {
	max-height: 100%;
	font-size: 17px;
	line-height: 1;
	letter-spacing: 1px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.bookmark-author {
	position: absolute;
	top: 54%;
	left: 73%;
	transform: translateX(-50%);
	max-height: 21%;
	font-size: 14px;
	font-weight: 600;
	line-height: 1;
	letter-spacing: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	color: #243247;
	text-shadow: none;
}
.bookmark-image img {
	transition: opacity 200ms ease;
}
.bookmark-image .bookmark-image-hidden {
	opacity: 0;
}
.bookmark-base-placeholder {
	position: absolute;
	top: 6%;
	bottom: 6%;
	left: 5%;
	right: 5%;
	border: 1px solid #ddc6b5;
	border-radius: 8px 8px 4px 4px;
	background: #f5e9dc;
	overflow: hidden;
}
.bookmark--loading .bookmark-art,
.bookmark--loading .bookmark-title-area,
.bookmark--loading .bookmark-author {
	opacity: 0;
}
.bookmark-art,
.bookmark-title-area,
.bookmark-author {
	transition: opacity 200ms ease;
}
.bookmark-skeleton-title,
.bookmark-skeleton-author {
	position: absolute;
	width: 5px;
	border-radius: 4px;
	background: #dacbbb;
}
.bookmark-skeleton-title {
	top: 26%;
	left: 34%;
	height: 38%;
}
.bookmark-skeleton-author {
	top: 54%;
	left: 70%;
	width: 3px;
	height: 17%;
}
.bookmark-skeleton-hook {
	position: absolute;
	top: 0;
	left: calc(50% - 4px);
	width: 8px;
	height: 10%;
	border: 2px solid #c9b79e;
	border-radius: 50%;
	transform: rotate(-10deg);
}
.bookmark-shimmer::after {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(
		105deg,
		transparent 25%,
		rgb(255 250 241 / 70%) 50%,
		transparent 75%
	);
	animation: bookmark-shimmer 1.5s ease-in-out infinite;
}
@keyframes bookmark-shimmer {
	from {
		transform: translateX(-100%);
	}
	to {
		transform: translateX(100%);
	}
}
@media (prefers-reduced-motion: reduce) {
	.bookmark-shimmer::after {
		animation: none;
	}
	.bookmark-image img {
		transition: none;
	}
}
</style>
