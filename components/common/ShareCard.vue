<template>
	<div class="share-poster-wrapper">
		<div class="share-poster-preview">
			<v-skeleton-loader
				v-if="isGenerating"
				type="image"
				class="poster-skeleton"
			/>
			<img
				v-else-if="posterImage"
				:src="posterImage"
				alt="作品分享海报"
				class="share-poster-image"
			/>
		</div>
		<canvas ref="posterCanvas" class="share-poster-canvas"></canvas>
		<div class="share-actions">
			<v-btn
				class="share-action-btn"
				color="primary"
				prepend-icon="mdi-download"
				size="large"
				:disabled="!posterImage || isGenerating"
				:loading="isGenerating"
				@click="downloadPoster"
			>
				下载海报
			</v-btn>
			<v-btn
				class="share-action-btn"
				color="primary"
				prepend-icon="mdi-link-variant"
				size="large"
				variant="outlined"
				@click="copyShareLink"
			>
				分享链接
			</v-btn>
		</div>
		<p class="save-poster-tip">保存图片后，可发送到任意聊天或社交平台</p>
	</div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode';

const { $tip } = useNuxtApp();
const props = defineProps<{
	coverUrl?: string;
	shareUrl: string;
	title?: string;
	author?: string;
}>();

const posterCanvas = ref<HTMLCanvasElement | null>(null);
const posterImage = ref('');
const isGenerating = ref(false);
const POSTER_WIDTH = 760;
const POSTER_HEIGHT = 1110;
const DESIGN_WIDTH = 900;
const SPINE_TEXTURE_WIDTH = 50;
const SPINE_WIDTH = 36;
const COVER_X = 218;
const COVER_Y = 182;
const COVER_WIDTH = 500;
const COVER_HEIGHT = 750;

function roundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) {
	ctx.beginPath();
	ctx.roundRect(x, y, width, height, radius);
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => resolve(image);
		image.onerror = reject;
		image.src = src;
	});
}

function drawImageContain(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement,
	x: number,
	y: number,
	width: number,
	height: number,
) {
	const scale = Math.min(
		width / image.naturalWidth,
		height / image.naturalHeight,
	);
	const drawWidth = image.naturalWidth * scale;
	const drawHeight = image.naturalHeight * scale;
	ctx.drawImage(
		image,
		x + (width - drawWidth) / 2,
		y + (height - drawHeight) / 2,
		drawWidth,
		drawHeight,
	);
}

function getBookCoverSource(image: HTMLImageElement) {
	const targetRatio = (COVER_WIDTH + SPINE_TEXTURE_WIDTH) / COVER_HEIGHT;
	const imageRatio = image.naturalWidth / image.naturalHeight;
	let sourceX = 0;
	let sourceY = 0;
	let sourceWidth = image.naturalWidth;
	let sourceHeight = image.naturalHeight;
	if (imageRatio > targetRatio) {
		sourceWidth = image.naturalHeight * targetRatio;
		sourceX = (image.naturalWidth - sourceWidth) / 2;
	} else {
		sourceHeight = image.naturalWidth / targetRatio;
		sourceY = (image.naturalHeight - sourceHeight) / 2;
	}
	const spineSourceWidth =
		sourceWidth * (SPINE_TEXTURE_WIDTH / (COVER_WIDTH + SPINE_TEXTURE_WIDTH));
	return {
		sourceX,
		sourceY,
		sourceWidth,
		sourceHeight,
		spineSourceWidth,
	};
}

function drawBookCoverFront(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement,
) {
	const source = getBookCoverSource(image);
	ctx.drawImage(
		image,
		source.sourceX + source.spineSourceWidth,
		source.sourceY,
		source.sourceWidth - source.spineSourceWidth,
		source.sourceHeight,
		COVER_X,
		COVER_Y,
		COVER_WIDTH,
		COVER_HEIGHT,
	);
}

function drawWrappedText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number,
	maxLines: number,
) {
	const characters = Array.from(text);
	const lines: string[] = [];
	let line = '';
	for (let index = 0; index < characters.length; index += 1) {
		const character = characters[index] ?? '';
		const candidate = line + character;
		if (!line || ctx.measureText(candidate).width <= maxWidth) {
			line = candidate;
			continue;
		}
		lines.push(line);
		line = character;
		if (lines.length === maxLines - 1) {
			const remaining = line + characters.slice(index + 1).join('');
			lines.push(truncateText(ctx, remaining, maxWidth));
			line = '';
			break;
		}
	}
	if (line && lines.length < maxLines) lines.push(line);
	for (const [index, content] of lines.entries()) {
		ctx.fillText(content, x, y + index * lineHeight);
	}
	return lines.length;
}

function truncateText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
) {
	if (ctx.measureText(text).width <= maxWidth) return text;
	let result = text;
	while (result && ctx.measureText(`${result}…`).width > maxWidth) {
		result = result.slice(0, -1);
	}
	return `${result}…`;
}

function drawLilyAccent(ctx: CanvasRenderingContext2D) {
	ctx.save();
	ctx.translate(748, 968);
	ctx.rotate(-0.48);
	ctx.strokeStyle = 'rgba(223, 135, 68, 0.78)';
	ctx.lineWidth = 3;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	// 六瓣百合花头，朝向二维码。
	ctx.beginPath();
	ctx.moveTo(0, 12);
	ctx.bezierCurveTo(-12, -10, -14, -37, 0, -64);
	ctx.bezierCurveTo(17, -37, 16, -10, 0, 12);
	ctx.bezierCurveTo(-17, -7, -40, -22, -65, -18);
	ctx.bezierCurveTo(-50, 8, -26, 18, 0, 12);
	ctx.bezierCurveTo(-24, 23, -39, 42, -39, 65);
	ctx.bezierCurveTo(-12, 57, 1, 37, 0, 12);
	ctx.bezierCurveTo(13, 35, 32, 48, 56, 47);
	ctx.bezierCurveTo(51, 21, 29, 10, 0, 12);
	ctx.bezierCurveTo(25, 4, 45, -10, 54, -34);
	ctx.bezierCurveTo(29, -36, 12, -18, 0, 12);
	ctx.stroke();

	// 花蕊与花药。
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(0, 12);
	ctx.quadraticCurveTo(-18, -3, -28, -28);
	ctx.moveTo(0, 12);
	ctx.quadraticCurveTo(2, -8, -4, -35);
	ctx.moveTo(0, 12);
	ctx.quadraticCurveTo(19, -4, 28, -25);
	ctx.stroke();
	ctx.fillStyle = '#df8744';
	for (const [x, y, angle] of [
		[-29, -30, -0.5],
		[-4, -37, -0.1],
		[29, -27, 0.45],
	] as const) {
		ctx.beginPath();
		ctx.ellipse(x, y, 6, 3, angle, 0, Math.PI * 2);
		ctx.fill();
	}

	// 斜向枝干与两片叶子。
	ctx.beginPath();
	ctx.moveTo(2, 14);
	ctx.bezierCurveTo(18, 72, 28, 126, 18, 196);
	ctx.moveTo(20, 104);
	ctx.bezierCurveTo(-12, 86, -34, 92, -50, 112);
	ctx.bezierCurveTo(-19, 118, 2, 115, 20, 104);
	ctx.moveTo(24, 142);
	ctx.bezierCurveTo(48, 122, 69, 126, 82, 144);
	ctx.bezierCurveTo(58, 151, 41, 151, 24, 142);
	ctx.stroke();
	ctx.restore();
}

function drawFallbackCover(ctx: CanvasRenderingContext2D) {
	const gradient = ctx.createLinearGradient(
		COVER_X,
		COVER_Y,
		COVER_X + COVER_WIDTH,
		COVER_Y + COVER_HEIGHT,
	);
	gradient.addColorStop(0, '#ffb7c5');
	gradient.addColorStop(0.55, '#d9c7ff');
	gradient.addColorStop(1, '#bdebf2');
	ctx.fillStyle = gradient;
	ctx.fillRect(COVER_X, COVER_Y, COVER_WIDTH, COVER_HEIGHT);
	ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
	ctx.font = '700 42px sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText('夢怜龍華', DESIGN_WIDTH / 2, 505);
	ctx.font = '500 24px sans-serif';
	ctx.fillText('发现值得阅读的故事', DESIGN_WIDTH / 2, 555);
}

function drawBookStructure(
	ctx: CanvasRenderingContext2D,
	cover?: HTMLImageElement,
) {
	ctx.save();
	ctx.shadowColor = 'rgba(71, 53, 49, 0.34)';
	ctx.shadowBlur = 30;
	ctx.shadowOffsetX = 12;
	ctx.shadowOffsetY = 20;
	ctx.fillStyle = 'rgba(71, 53, 49, 0.1)';
	roundedRect(
		ctx,
		COVER_X - SPINE_WIDTH,
		COVER_Y + 8,
		COVER_WIDTH + SPINE_WIDTH + 16,
		COVER_HEIGHT + 14,
		18,
	);
	ctx.fill();
	ctx.restore();

	ctx.fillStyle = '#eee7e3';
	ctx.beginPath();
	ctx.moveTo(COVER_X + COVER_WIDTH, COVER_Y + 12);
	ctx.lineTo(COVER_X + COVER_WIDTH + 15, COVER_Y + 24);
	ctx.lineTo(COVER_X + COVER_WIDTH + 15, COVER_Y + COVER_HEIGHT - 6);
	ctx.lineTo(COVER_X + COVER_WIDTH, COVER_Y + COVER_HEIGHT);
	ctx.closePath();
	ctx.fill();
	for (let offset = 0; offset < 10; offset += 3) {
		ctx.strokeStyle = `rgba(155, 127, 127, ${0.2 - offset * 0.01})`;
		ctx.beginPath();
		ctx.moveTo(COVER_X + COVER_WIDTH + offset, COVER_Y + 34);
		ctx.lineTo(COVER_X + COVER_WIDTH + offset, COVER_Y + COVER_HEIGHT - 18);
		ctx.stroke();
	}

	ctx.save();
	ctx.beginPath();
	ctx.moveTo(COVER_X - SPINE_WIDTH, COVER_Y + 30);
	ctx.lineTo(COVER_X, COVER_Y);
	ctx.lineTo(COVER_X, COVER_Y + COVER_HEIGHT);
	ctx.lineTo(COVER_X - SPINE_WIDTH, COVER_Y + COVER_HEIGHT - 30);
	ctx.closePath();
	ctx.clip();
	if (cover) {
		const source = getBookCoverSource(cover);
		ctx.drawImage(
			cover,
			source.sourceX,
			source.sourceY,
			source.spineSourceWidth,
			source.sourceHeight,
			COVER_X - SPINE_WIDTH,
			COVER_Y,
			SPINE_WIDTH,
			COVER_HEIGHT,
		);
	} else {
		ctx.fillStyle = '#c98596';
		ctx.fillRect(COVER_X - SPINE_WIDTH, COVER_Y, SPINE_WIDTH, COVER_HEIGHT);
	}
	const spineShade = ctx.createLinearGradient(
		COVER_X - SPINE_WIDTH,
		0,
		COVER_X,
		0,
	);
	spineShade.addColorStop(0, 'rgba(61, 39, 44, 0.56)');
	spineShade.addColorStop(0.7, 'rgba(61, 39, 44, 0.18)');
	spineShade.addColorStop(1, 'rgba(255, 255, 255, 0.16)');
	ctx.fillStyle = spineShade;
	ctx.fillRect(COVER_X - SPINE_WIDTH, COVER_Y, SPINE_WIDTH, COVER_HEIGHT);
	ctx.restore();

	ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(COVER_X + 3, COVER_Y + 18);
	ctx.lineTo(COVER_X + 3, COVER_Y + COVER_HEIGHT - 18);
	ctx.stroke();
}

async function generateCard() {
	const canvas = posterCanvas.value;
	if (!canvas || !props.shareUrl || isGenerating.value) return;
	isGenerating.value = true;
	try {
		canvas.width = POSTER_WIDTH;
		canvas.height = POSTER_HEIGHT;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('浏览器不支持生成分享海报');

		ctx.fillStyle = '#f7f4fa';
		ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
		ctx.translate(-70, -80);
		try {
			const headerLogo = await loadImage('/image.png');
			ctx.save();
			ctx.globalCompositeOperation = 'multiply';
			drawImageContain(ctx, headerLogo, 180, 96, 220, 70);
			ctx.restore();
		} catch {
			ctx.fillStyle = '#a77ac4';
			ctx.font = '900 30px serif';
			ctx.textAlign = 'left';
			ctx.fillText('moelian', 180, 145);
		}
		const searchWidth = 230;
		const searchX = 560 - searchWidth / 2;
		ctx.fillStyle = '#fffafa';
		roundedRect(ctx, searchX, 111, searchWidth, 40, 20);
		ctx.fill();
		ctx.strokeStyle = '#efd9dc';
		ctx.lineWidth = 2;
		roundedRect(ctx, searchX, 111, searchWidth, 40, 20);
		ctx.stroke();
		ctx.strokeStyle = '#b4878d';
		ctx.lineWidth = 2.5;
		ctx.beginPath();
		ctx.arc(searchX + searchWidth - 22, 130, 7, 0, Math.PI * 2);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(searchX + searchWidth - 17, 135);
		ctx.lineTo(searchX + searchWidth - 11, 141);
		ctx.stroke();
		ctx.fillStyle = '#76595b';
		ctx.font = '700 17px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('夢怜龍華汉化组', 560, 137);
		let coverImage: HTMLImageElement | undefined;
		if (props.coverUrl) {
			try {
				coverImage = await loadImage(props.coverUrl);
			} catch {
				coverImage = undefined;
			}
		}
		drawBookStructure(ctx, coverImage);
		ctx.save();
		roundedRect(ctx, COVER_X, COVER_Y, COVER_WIDTH, COVER_HEIGHT, 14);
		ctx.clip();
		if (coverImage) {
			drawBookCoverFront(ctx, coverImage);
		} else {
			drawFallbackCover(ctx);
		}
		ctx.restore();

		const titleAccent = ctx.createLinearGradient(180, 0, 180, 1040);
		titleAccent.addColorStop(0, '#ff7898');
		titleAccent.addColorStop(1, '#d68ac5');
		ctx.fillStyle = titleAccent;
		roundedRect(ctx, 180, 978, 5, 32, 2.5);
		ctx.fill();
		ctx.fillStyle = '#604e4b';
		ctx.font = '800 30px "Noto Serif SC", "Songti SC", serif';
		ctx.textAlign = 'left';
		const titleLineCount = drawWrappedText(
			ctx,
			props.title || '发现一部好作品',
			198,
			1002,
			352,
			40,
			3,
		);
		const authorY = 1002 + (titleLineCount - 1) * 40 + 56;
		ctx.font = '800 26px sans-serif';
		const author = truncateText(ctx, props.author || '夢怜龍華汉化组', 330);
		ctx.fillStyle = '#ff8fa3';
		ctx.font = '900 17px sans-serif';
		ctx.fillText('BY', 180, authorY);
		ctx.fillStyle = '#8f7774';
		ctx.font = '800 26px sans-serif';
		ctx.fillText(author, 212, authorY);
		const authorWidth = Math.min(ctx.measureText(author).width, 330);
		const authorUnderline = ctx.createLinearGradient(
			180,
			0,
			Math.max(298, 212 + authorWidth),
			0,
		);
		authorUnderline.addColorStop(0, '#ff8fa3');
		authorUnderline.addColorStop(0.55, '#e8a6d8');
		authorUnderline.addColorStop(1, 'rgba(184, 156, 244, 0.12)');
		ctx.fillStyle = authorUnderline;
		roundedRect(
			ctx,
			180,
			authorY + 14,
			Math.max(118, authorWidth + 32),
			5,
			2.5,
		);
		ctx.fill();

		const qrDataUrl = await QRCode.toDataURL(props.shareUrl, {
			width: 210,
			margin: 1,
			color: { dark: '#5a463d', light: '#ffffff' },
		});
		const qrImage = await loadImage(qrDataUrl);
		drawLilyAccent(ctx);
		ctx.drawImage(qrImage, 570, 972, 150, 150);
		ctx.fillStyle = '#9b7f7f';
		ctx.font = '700 16px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('想推荐给喜欢百合的你', 645, 1150);

		posterImage.value = canvas.toDataURL('image/png');
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : '分享海报生成失败';
		$tip(message, { color: 'error', icon: 'mdi-alert-circle' });
	} finally {
		isGenerating.value = false;
	}
}

function downloadPoster() {
	if (!posterImage.value) return;
	const safeTitle = (props.title || '作品分享').replace(/[\\/:*?"<>|]/g, '-');
	const link = document.createElement('a');
	link.href = posterImage.value;
	link.download = `${safeTitle}-分享海报.png`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	$tip('分享海报已保存', { color: 'success', icon: 'mdi-download' });
}

async function copyShareLink() {
	const shareText = `这部作品想推荐给喜欢百合的你：\n${props.shareUrl}`;
	try {
		await navigator.clipboard.writeText(shareText);
		$tip('分享链接已复制', {
			color: 'success',
			icon: 'mdi-check-circle',
		});
	} catch {
		$tip('复制失败，请稍后重试', {
			color: 'error',
			icon: 'mdi-alert-circle',
		});
	}
}

defineExpose({ generateCard, downloadPoster });
</script>

<style scoped>
.share-poster-wrapper {
	display: flex;
	flex-direction: column;
	gap: 14px;
}
.share-poster-preview {
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}
.poster-skeleton {
	min-height: 420px;
}
.poster-skeleton,
.share-poster-image {
	width: 100%;
	max-height: min(66vh, 660px);
}
.share-poster-image {
	display: block;
	object-fit: contain;
}
.share-poster-canvas {
	display: none;
}
.share-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
}
.share-action-btn {
	border-radius: 12px !important;
	font-weight: 800 !important;
	letter-spacing: 0.06em !important;
}
.save-poster-tip {
	margin: -4px 0 0;
	color: #9b7f7f;
	font-size: 12px;
	text-align: center;
}
</style>
