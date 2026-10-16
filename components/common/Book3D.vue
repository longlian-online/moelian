<template>
	<div class="book-3d-container" :class="{ 'book-3d-home': homepage }" :style="containerStyle">
		<div class="book-3d-wrapper" :style="wrapperStyle">
			<component
				:is="linkComponent"
				class="book-cover-link"
				:to="to"
				:aria-label="to ? `查看${title}` : undefined"
				@click="handleClick($event)"
			>
				<!-- 整个书体 -->
				<div class="book-body">
					<!-- 书脊（侧封） -->
					<div
						class="book-spine"
						:style="{
							backgroundImage: `url(${coverUrl})`,
						}"
					>
						<div v-if="showSpineText && !homepage" class="book-spine-content">
							<div class="book-spine-title">
								{{ title }}
							</div>
							<div class="book-spine-author">
								<span class="author-name">{{ author }}</span>
							</div>
						</div>
					</div>
					<template v-if="homepage">
						<div class="book-stack-layer book-stack-back" aria-hidden="true"></div>
						<div class="book-stack-layer book-stack-middle" aria-hidden="true"></div>
					</template>
					<!-- 封面（正面） -->
					<div class="book-cover-main" :aria-busy="imagePending">
						<Transition name="book-cover-reveal">
						<div v-if="imagePending" class="simple-skeleton book-image-loading" role="status" :aria-label="`正在加载${title}封面`">
							<img class="skeleton-cover-symbol" src="/image.png" alt="" aria-hidden="true" />
							<span class="skeleton-cover-line skeleton-cover-line--title" aria-hidden="true"></span>
							<span class="skeleton-cover-line skeleton-cover-line--subtitle" aria-hidden="true"></span>
						</div>
						</Transition>
						<v-img
							:src="coverUrl"
							:alt="title"
							class="book-cover-image"
							:height="height + 'px'"
							cover
							eager
							@load="handleImageLoad"
							@error="imagePending = false"
						>
							<template #error>
								<v-img
									cover
									src="/error-default.jpg"
									height="100%"
									width="100%"
									gradient="to bottom, rgba(0,0,0,.0), rgba(0,0,0,.4)"
								/>
							</template>
						</v-img>
						<!-- 插槽：用于放置标签等内容 -->
						<slot name="overlay"></slot>
						<!-- 标题覆盖层 -->
						<div v-if="showTitle" class="book-title-overlay" @click.stop>
							<span v-copy="title" v-tooltip="'右键复制标题'">
								{{ title }}
							</span>
						</div>
					</div>
				</div>
			</component>
		</div>
	</div>
</template>

<script setup lang="ts">
interface Props {
	homepage?: boolean;
	coverUrl: string;
	title: string;
	author: string;
	height?: number; // 书本高度，默认 400px
	width?: number; // 书本宽度，默认根据图片比例计算
	spineWidth?: number; // 书脊宽度，默认 50px
	showTitle?: boolean; // 是否显示底部标题，默认 true
	showSpineText?: boolean; // 是否显示书脊文字，默认 true
	to?: string; // 详情地址；传入后服务端 HTML 会输出可抓取的链接
}

const props = withDefaults(defineProps<Props>(), {
	homepage: false,
	height: 400,
	width: 260,
	spineWidth: 50,
	showTitle: true,
	showSpineText: true,
	to: undefined,
});

const emit = defineEmits<{
	click: [event?: Event];
	imageLoad: [width: number];
}>();

const linkComponent = computed(() =>
	props.to ? resolveComponent('NuxtLink') : 'div',
);

const imagePending = ref(true);
watch(() => props.coverUrl, () => { imagePending.value = true; });

// 计算出的动态宽度
const calculatedWidth = ref<number>(props.width);
const containerStyle = computed(() => ({
	'--spine-width': `${props.homepage ? props.height * 0.05 : props.spineWidth}px`,
	height: `${props.height}px`,
}));

const wrapperStyle = computed(() => ({
	width: `${props.homepage ? props.height * 0.665 : calculatedWidth.value}px`,
	...(props.homepage ? { aspectRatio: '266 / 369' } : {}),
}));

// 当封面图加载完成时，计算其物理比例
const handleImageLoad = (src: string | Event) => {
	imagePending.value = false;
	// v-img 的 load 事件可能传递 src 字符串或 Event 对象
	let img: HTMLImageElement | null = null;

	if (typeof src === 'string') {
		// 如果是字符串，需要找到对应的图片元素
		const imgElement = document.querySelector(
			`.book-cover-image img[src="${src}"]`,
		) as HTMLImageElement;
		if (imgElement) {
			img = imgElement;
		}
	} else if (src instanceof Event) {
		img = src.target as HTMLImageElement;
	}

	if (img && img.naturalWidth && img.naturalHeight) {
		// 计算图片在指定高度下的总宽度
		const totalWidth = (img.naturalWidth / img.naturalHeight) * props.height;

		// 书本封面部分的显示宽度 = 总宽度 - 书脊宽度
		// 设定一个合理的范围限制，防止极端比例
		const newWidth = props.homepage ? props.height * 0.6655 : Math.max(
			150,
			Math.min(320, totalWidth - props.spineWidth),
		);

		calculatedWidth.value = newWidth;
		emit('imageLoad', newWidth);
	}
};

const handleClick = (event?: Event) => {
	event?.stopPropagation();
	if (!props.to) {
		emit('click', event);
	}
};
</script>

<style scoped>
/* 3D 舞台环境 */
.book-3d-container {
	perspective: 1200px;
	perspective-origin: center center;
	width: 100%;
	margin: 20px 0;
	display: flex;
	justify-content: center;
	align-items: center;
}

.book-3d-wrapper {
	height: 100%;
	transform-style: preserve-3d;
	position: relative;
}

.book-cover-link {
	display: block;
	width: 100%;
	height: 100%;
	cursor: pointer;
	color: inherit;
	text-decoration: none;
}

/* 书体组合 - 绕交界线旋转 */
.book-body {
	position: relative;
	width: 100%;
	height: 100%;
	transform-style: preserve-3d;
	/* 关键：整个书向右侧倾斜，露出左边的书脊 */
	transform: rotateY(35deg);
	transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform;
	/* 强制开启 GPU 高精度渲染 */
	-webkit-font-smoothing: antialiased;
}

/* 书脊 - 物理上垂直于封面 */
.book-spine {
	position: absolute;
	top: 0px;
	height: 100%;
	left: 0;
	width: var(--spine-width);
	z-index: 5;
	/* 旋转轴在右边缘，向左转 90 度 */
	transform-origin: right center;
	transform: translateX(calc(-1 * var(--spine-width))) rotateY(-90deg);

	background-size: auto 100%;
	background-position: left center;
	background-repeat: no-repeat;
	box-shadow: inset -3px 0 10px rgba(0, 0, 0, 0.5);
	overflow: hidden;
	/* 防止闪烁 */
	backface-visibility: hidden;
}

/* 书脊遮罩 */
.book-spine::after {
	content: '';
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.15);
	z-index: 1;
}

.book-spine-content {
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 30px 4px;
	box-sizing: border-box;
}

.book-spine-title {
	color: #ffffff;
	font-size: 19px;
	font-weight: 800;
	font-style: italic;
	writing-mode: vertical-rl;
	text-orientation: upright;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
	max-height: calc(100% - 110px);
	letter-spacing: 2px;
}

.book-spine-author {
	color: #ffffff;
	font-size: 13px;
	font-weight: 700;
	font-style: italic;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 15px;
	text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}

.author-name {
	writing-mode: vertical-rl;
	text-orientation: upright;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-height: 70px;
	margin-bottom: 6px;
	letter-spacing: 1px;
}

.book-cover-reveal-leave-active {
	transition: opacity 360ms ease;
}
.book-cover-reveal-leave-to {
	opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
	.book-cover-reveal-leave-active { transition: none; }
}
.book-image-loading {
	position: absolute;
	inset: 0;
	z-index: 1;
	pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
	.book-image-loading { animation: none; }
}
/* 暖灰封面占位，加载状态与书页底板区分。 */
.simple-skeleton {
	width: 100%;
	height: 100%;
	background: #ddd2c3;
	overflow: hidden;
}
.book-image-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
}
.book-image-loading::after {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(100deg, transparent 15%, rgba(255, 250, 240, 0.6) 48%, transparent 80%);
	transform: translateX(-100%);
	animation: cover-skeleton-shimmer 1.7s ease-in-out infinite;
}
.skeleton-cover-symbol {
	width: 72%;
	max-width: 190px;
	height: auto;
	object-fit: contain;
	margin-bottom: 14px;
}
.skeleton-cover-line {
	display: block;
	height: 9px;
	border-radius: 5px;
	background: #c7b8a4;
}
.skeleton-cover-line--title { width: 54%; }
.skeleton-cover-line--subtitle { width: 32%; height: 6px; }
@keyframes cover-skeleton-shimmer {
	to { transform: translateX(100%); }
}
@media (prefers-reduced-motion: reduce) {
	.book-image-loading::after { animation: none; }
}

@keyframes skeleton-loading {
	0% {
		background-position: 200% 0;
	}
	100% {
		background-position: -200% 0;
	}
}

/* 封面主体 */
.book-cover-main {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: #222;
	box-shadow: 5px 5px 20px rgba(0, 0, 0, 0.3);
	/* 关键：封面稍微向前推 0.1px，确保盖住书脊的边缘 */
	transform: translateZ(0.1px);
}

/* 书脊与封面交界处的白色装订线 */
.book-cover-main::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	width: 2px;
	height: 100%;
	background: linear-gradient(
		to bottom,
		rgba(255, 255, 255, 0.5) 20%,
		rgba(255, 255, 255, 0.65) 50%,
		rgba(200, 200, 200, 0.4) 80%
	);
	z-index: 20;
	pointer-events: none;
	box-shadow:
		1px 0 1px rgba(255, 255, 255, 0.4),
		-1px 0 2px rgba(0, 0, 0, 0.2);
}

/* 封面图片：关键位移逻辑 */
:deep(.book-cover-image .v-img__img) {
	/* 强制增加宽度以容纳书脊部分的像素 */
	width: calc(100% + var(--spine-width)) !important;
	/* 向左偏移，跳过书脊展示的像素 */
	left: calc(-1 * var(--spine-width)) !important;
	/* 关键修改：使用 fill，因为容器宽度已经按比例算好了，fill 此时就是 100% 原生比例 */
	object-fit: fill !important;
	object-position: left center !important;
}

/* 折痕处的高光阴影过渡 */
.book-cover-main::after {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	width: 15px;
	height: 100%;
	z-index: 10;
	background: linear-gradient(
		to right,
		rgba(0, 0, 0, 0.4) 0%,
		rgba(0, 0, 0, 0.1) 20%,
		transparent 100%
	);
	pointer-events: none;
}

/* 底部投影 */
.book-body::before {
	content: '';
	position: absolute;
	bottom: -15px;
	left: -5px;
	width: calc(100% + 10px);
	height: 30px;
	background: rgba(0, 0, 0, 0.4);
	filter: blur(12px);
	transform: rotateX(90deg) translateZ(-10px);
	z-index: -1;
}

/* 标题覆盖层 */
.book-title-overlay {
	position: absolute;
	bottom: 0;
	inset-inline: 0;
	padding: 16px 12px;
	color: white;
	font-weight: 600;
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
	z-index: 15;
}

@media (max-width: 960px) {
	.book-3d-wrapper {
		width: 220px;
	}
	.book-3d-container {
		--spine-width: 35px;
	}
}
/* 主页采用两层完整底板，悬停时围绕左边缘依次翻开。 */
.book-3d-container.book-3d-home .book-3d-wrapper {
	max-width: calc(100% - 32px);
	height: auto !important;
	flex: 0 1 auto;
}
.book-3d-home .book-body {
	transform: none;
	transform-style: flat;
	will-change: auto;
	filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.1));
}
.book-3d-home .book-cover-image {
	height: 100% !important;
}
.book-3d-container.book-3d-home .book-stack-layer,
.book-3d-container.book-3d-home .book-cover-main {
	position: absolute;
	width: 94% !important;
	height: 96.2% !important;
	border-radius: 6px;
	transform-origin: left center;
}
.book-3d-home .book-stack-back {
	bottom: 0;
	right: 0;
	background: #e3dfe1;
}
.book-3d-home .book-stack-middle {
	top: 2%;
	left: 3%;
	background: #eeedee;
	transition: transform 0.6s cubic-bezier(0.19, 1.74, 0.47, 0.62) 0.05s;
}
.book-3d-home .book-cover-main {
	top: 0;
	left: 0;
	background: white;
	box-shadow: none;
	transform: none;
	transition: transform 0.6s cubic-bezier(0.19, 1.74, 0.47, 0.62);
}
.book-3d-home :deep(.book-cover-image .v-img__img) {
	width: 100% !important;
	left: 0 !important;
	object-fit: cover !important;
	object-position: center !important;
}
.book-3d-home .book-spine,
.book-3d-home .book-cover-main::before,
.book-3d-home .book-cover-main::after,
.book-3d-home .book-body::before {
	display: none;
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
	.book-3d-home .book-cover-link:hover .book-cover-main {
		transform: perspective(3000px) rotateY(-30deg);
	}
	.book-3d-home .book-cover-link:hover .book-stack-middle {
		transform: perspective(3000px) rotateY(-20deg);
	}
}
</style>
