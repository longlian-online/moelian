<template>
	<div class="book-3d-container" :style="containerStyle">
		<div class="book-3d-wrapper" :style="wrapperStyle">
			<div class="book-cover-link" @click="handleClick($event)">
				<!-- 整个书体 -->
				<div class="book-body">
					<!-- 书脊（侧封） -->
					<div
						class="book-spine"
						:style="{
							backgroundImage: `url(${coverUrl})`,
						}"
					>
						<div v-if="showSpineText" class="book-spine-content">
							<div class="book-spine-title">
								{{ title }}
							</div>
							<div class="book-spine-author">
								<span class="author-name">{{ author }}</span>
							</div>
						</div>
					</div>
					<!-- 封面（正面） -->
					<div class="book-cover-main">
						<v-img
							:src="coverUrl"
							:alt="title"
							class="book-cover-image"
							:height="height + 'px'"
							cover
							eager
							@load="handleImageLoad"
						>
							<template #placeholder>
								<div class="simple-skeleton"></div>
							</template>
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
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
interface Props {
	coverUrl: string;
	title: string;
	author: string;
	height?: number; // 书本高度，默认 400px
	width?: number; // 书本宽度，默认根据图片比例计算
	spineWidth?: number; // 书脊宽度，默认 50px
	showTitle?: boolean; // 是否显示底部标题，默认 true
	showSpineText?: boolean; // 是否显示书脊文字，默认 true
}

const props = withDefaults(defineProps<Props>(), {
	height: 400,
	width: 260,
	spineWidth: 50,
	showTitle: true,
	showSpineText: true,
});

const emit = defineEmits<{
	click: [event?: Event];
	imageLoad: [width: number];
}>();

// 计算出的动态宽度
const calculatedWidth = ref<number>(props.width);

const containerStyle = computed(() => ({
	'--spine-width': `${props.spineWidth}px`,
	height: `${props.height}px`,
}));

const wrapperStyle = computed(() => ({
	width: `${calculatedWidth.value}px`,
}));

// 当封面图加载完成时，计算其物理比例
const handleImageLoad = (src: string | Event) => {
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
		const newWidth = Math.max(
			150,
			Math.min(320, totalWidth - props.spineWidth),
		);

		calculatedWidth.value = newWidth;
		emit('imageLoad', newWidth);
	}
};

const handleClick = (event?: Event) => {
	event?.stopPropagation();
	emit('click', event);
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

/* 简单骨架屏 */
.simple-skeleton {
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%);
	background-size: 200% 100%;
	animation: skeleton-loading 1.5s ease-in-out infinite;
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
</style>
