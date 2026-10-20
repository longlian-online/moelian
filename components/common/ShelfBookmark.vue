<script setup lang="ts">
const props = defineProps<{
	title: string;
	author?: string | null;
	to: string;
}>();
// 使用作品链接稳定分配款式，保证 SSR、刷新和列表重排时保持一致。
const artworkSrc = computed(() => {
	let hash = 0;
	for (const character of props.to)
		hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
	return `/bookmarks/art-${String((hash % 13) + 1).padStart(2, '0')}.png`;
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
		:to="props.to"
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
					<span class="bookmark-art" aria-hidden="true">
						<span class="bookmark-image">
							<img src="/bookmarks/base.png" alt="" width="820" height="1918" />
							<img
								class="bookmark-character"
								:src="artworkSrc"
								alt=""
								width="600"
								height="600"
							/>
						</span>
					</span>
					<span class="bookmark-title-area">
						<span class="bookmark-title"
							><span
								v-for="(character, index) in characters"
								:key="index"
								>{{ character }}</span
							></span
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
</style>
