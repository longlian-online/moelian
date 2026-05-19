<template>
	<div class="share-qrcode-wrapper">
		<img
			v-if="cardImage"
			:src="cardImage"
			alt="分享卡片"
			class="share-card-image"
		/>
		<canvas ref="cardCanvas" class="share-card-canvas"></canvas>
	</div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode';

const { $tip } = useNuxtApp();

const props = defineProps<{
	coverUrl?: string;
	shareUrl: string;
	title?: string;
}>();

const cardCanvas = ref<HTMLCanvasElement | null>(null);
const cardImage = ref<string>('');

const CARD_SIZE = 400;
const QR_RATIO = 2 / 3;
const QR_SIZE = Math.round(CARD_SIZE * QR_RATIO);
const QR_X = (CARD_SIZE - QR_SIZE) / 2;
const QR_Y = (CARD_SIZE - QR_SIZE) / 2;

function drawRoundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

function drawCoverAsBackground(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	w: number,
	h: number,
) {
	const imgRatio = img.naturalWidth / img.naturalHeight;
	const boxRatio = w / h;

	let sx = 0,
		sy = 0,
		sw = img.naturalWidth,
		sh = img.naturalHeight;

	if (imgRatio > boxRatio) {
		sw = img.naturalHeight * boxRatio;
		sx = (img.naturalWidth - sw) / 2;
	} else {
		sh = img.naturalWidth / boxRatio;
		sy = (img.naturalHeight - sh) / 2;
	}

	ctx.filter = 'blur(20px) brightness(0.7)';
	ctx.drawImage(img, sx, sy, sw, sh, -20, -20, w + 40, h + 40);
	ctx.filter = 'none';
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

async function generateCard() {
	const canvas = cardCanvas.value;
	if (!canvas || !props.shareUrl) return;

	canvas.width = CARD_SIZE * 2;
	canvas.height = CARD_SIZE * 2;
	canvas.style.width = `${CARD_SIZE}px`;
	canvas.style.height = `${CARD_SIZE}px`;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	ctx.scale(2, 2);

	if (props.coverUrl) {
		try {
			const img = await loadImage(props.coverUrl);
			drawCoverAsBackground(ctx, img, CARD_SIZE, CARD_SIZE);
		} catch {
			drawFallbackBackground(ctx);
		}
	} else {
		drawFallbackBackground(ctx);
	}

	try {
		const qrDataUrl = await QRCode.toDataURL(props.shareUrl, {
			width: QR_SIZE * 2,
			margin: 0,
			color: {
				dark: '#5a463d',
				light: '#ffffff',
			},
		});
		const qrImg = await loadImage(qrDataUrl);
		ctx.save();
		drawRoundedRect(ctx, QR_X, QR_Y, QR_SIZE, QR_SIZE, 8);
		ctx.clip();
		ctx.drawImage(qrImg, QR_X, QR_Y, QR_SIZE, QR_SIZE);
		ctx.restore();
	} catch {
		$tip('二维码生成失败', { color: 'error', icon: 'mdi-alert-circle' });
	}

	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 16px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	const displayTitle = props.title
		? props.title.length > 8
			? props.title.slice(0, 8) + '…'
			: props.title
		: '';
	ctx.fillText(`扫码阅读《${displayTitle}》`, CARD_SIZE / 2, CARD_SIZE - 30);

	ctx.font = 'bold 14px sans-serif';
	ctx.textAlign = 'left';
	ctx.fillText('moelian', 20, 30);

	cardImage.value = canvas.toDataURL('image/png');
}

function drawFallbackBackground(ctx: CanvasRenderingContext2D) {
	const gradient = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
	gradient.addColorStop(0, '#ff9a9e');
	gradient.addColorStop(1, '#fecfef');
	ctx.fillStyle = gradient;
	drawRoundedRect(ctx, 0, 0, CARD_SIZE, CARD_SIZE, 16);
	ctx.fill();
}

defineExpose({ generateCard });
</script>

<style scoped>
.share-qrcode-wrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 8px 0;
}

.share-card-canvas {
	display: none;
}

.share-card-image {
	width: 400px;
	height: auto;
	aspect-ratio: 1 / 1;
	border-radius: 16px;
	box-shadow: 0 8px 24px rgba(255, 117, 140, 0.15);
	max-width: 100%;
	cursor: pointer;
}
</style>
