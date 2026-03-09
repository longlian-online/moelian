<template>
	<div id="canvasContainer" class="canvas-container">
		<canvas ref="canvasRef" :width="props.width" :height="props.height">
			您的浏览器不支持 Canvas。
		</canvas>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
	author: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	url: {
		type: String,
		default: 'default.jpg', // 默认背景
	},
	width: {
		type: Number,
		default: 278,
	},
	height: {
		type: Number,
		default: 400,
	},
});

const canvasRef = ref<HTMLCanvasElement | null>(null);

// 常量配置
const CANVAS_WIDTH = 278;
const CANVAS_HEIGHT = 400;
const TITLE_COLORS = ['#B59A72', '#E28766', '#3E91B3'];
const TITLE_BACKGROUND_COLOR = 'rgba(240,230,210,0.9)';
const TITLE_PADDING_Y = 12;
const BACKGROUND_RADIUS = 8;

onMounted(() => {
	loadAndDraw();
});

// 当 props 变化时，重新绘制
watch(
	() => [props.author, props.title, props.url],
	() => loadAndDraw(),
);

// ---------------- 绘制逻辑 ----------------
function loadAndDraw() {
	const canvas = canvasRef.value;
	if (!canvas) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	canvas.width = CANVAS_WIDTH;
	canvas.height = CANVAS_HEIGHT;

	const bgImg = new Image();
	bgImg.crossOrigin = 'Anonymous';

	bgImg.onload = () => drawAll(ctx, bgImg);
	bgImg.onerror = () => {
		console.warn('背景图片加载失败，使用默认背景。');
		drawAll(ctx, bgImg, false);
	};
	bgImg.src = props.url;

	if (bgImg.complete && bgImg.naturalHeight !== 0) {
		drawAll(ctx, bgImg);
	}
}

function drawAll(
	ctx: CanvasRenderingContext2D,
	bgImg: HTMLImageElement,
	loaded = true,
) {
	// 1. 背景
	if (loaded && bgImg.complete && bgImg.naturalHeight !== 0) {
		ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	} else {
		ctx.fillStyle = '#fef08a';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	}

	// 2. 文本
	drawTexts(ctx);
}

function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.arcTo(x + width, y, x + width, y + radius, radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
	ctx.lineTo(x + radius, y + height);
	ctx.arcTo(x, y + height, x, y + height - radius, radius);
	ctx.lineTo(x, y + radius);
	ctx.arcTo(x, y, x + radius, y, radius);
	ctx.closePath();
	ctx.fill();
}

function drawColoredLine(
	ctx: CanvasRenderingContext2D,
	lineText: string,
	startX: number,
	startY: number,
) {
	let currentX = startX;
	ctx.strokeStyle = '#FFFFFF';
	ctx.lineWidth = 3;
	ctx.textAlign = 'left';

	const characters = Array.from(lineText);
	characters.forEach((char, index) => {
		const color = TITLE_COLORS[index % TITLE_COLORS.length];
		ctx.strokeText(char, currentX, startY);
		ctx.fillStyle = color;
		ctx.fillText(char, currentX, startY);
		currentX += ctx.measureText(char).width;
	});
}

function drawTexts(ctx: CanvasRenderingContext2D) {
	const AUTHOR_TEXT = props.author;
	const TITLE_TEXT = props.title;

	const centerX = ctx.canvas.width / 2;
	const bottomMargin = 80;

	// 作者
	const AUTHOR_LINE_HEIGHT = 25;
	const AUTHOR_FONT_SIZE = 18;

	ctx.fillStyle = '#3f3f46';
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 1.5;
	ctx.font = `normal ${AUTHOR_FONT_SIZE}px "Noto Sans JP", "Microsoft YaHei", sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'alphabetic';

	const authorY = ctx.canvas.height - bottomMargin;
	ctx.strokeText(AUTHOR_TEXT, centerX, authorY);
	ctx.fillText(AUTHOR_TEXT, centerX, authorY);

	// 标题
	const TITLE_LINE_HEIGHT = 35;
	const TITLE_FONT_SIZE = 28;
	const MAX_TEXT_WIDTH = CANVAS_WIDTH - 60;

	ctx.font = `bold ${TITLE_FONT_SIZE}px "Noto Serif JP", serif`;

	// 分行逻辑
	const lines: string[] = [];
	let currentLine = '';
	const chars = Array.from(TITLE_TEXT);

	for (let i = 0; i < chars.length; i++) {
		const testLine = currentLine + chars[i];
		if (
			ctx.measureText(testLine).width > MAX_TEXT_WIDTH &&
			currentLine.length > 0
		) {
			lines.push(currentLine);
			currentLine = chars[i];
			if (lines.length === 2) {
				lines.push(chars.slice(i).join(''));
				break;
			}
		} else {
			currentLine = testLine;
		}
	}
	if (currentLine) lines.push(currentLine);

	const line1 = lines[0] || '';
	let line2 = lines[1] || '';

	if (lines.length > 2) {
		const remaining = lines.slice(1).join('');
		line2 = '';
		const ellipsis = '...';
		const ellipsisWidth = ctx.measureText(ellipsis).width;
		for (let i = 0; i < remaining.length; i++) {
			const testLine = line2 + remaining[i];
			if (ctx.measureText(testLine).width + ellipsisWidth > MAX_TEXT_WIDTH) {
				line2 += ellipsis;
				break;
			} else {
				line2 = testLine;
			}
		}
	}

	const totalLines = line2 ? 2 : 1;
	const totalBgHeight = totalLines * TITLE_LINE_HEIGHT + 2 * TITLE_PADDING_Y;
	const backgroundBottomY = authorY - AUTHOR_LINE_HEIGHT;
	const backgroundTopY = backgroundBottomY - totalBgHeight;

	const line1Y = backgroundTopY + TITLE_PADDING_Y + TITLE_LINE_HEIGHT / 2;
	const line2Y = line1Y + TITLE_LINE_HEIGHT;

	// 背景
	ctx.fillStyle = TITLE_BACKGROUND_COLOR;
	roundRect(
		ctx,
		0,
		backgroundTopY,
		CANVAS_WIDTH,
		totalBgHeight,
		BACKGROUND_RADIUS,
	);

	// 标题
	ctx.textBaseline = 'middle';
	if (line1) {
		const x = centerX - ctx.measureText(line1).width / 2;
		drawColoredLine(ctx, line1, x, line1Y);
	}
	if (line2) {
		const x = centerX - ctx.measureText(line2).width / 2;
		drawColoredLine(ctx, line2, x, line2Y);
	}
	ctx.textBaseline = 'alphabetic';
}
</script>

<style scoped>
.canvas-container {
	box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
	border-radius: 0.75rem;
	overflow: hidden;
	display: inline-block;
}

canvas {
	display: block;
	border: 1px solid #ccc;
}
</style>
