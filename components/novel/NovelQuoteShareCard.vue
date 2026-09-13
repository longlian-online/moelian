<template>
	<div class="novel-quote-share-card">
		<div class="novel-quote-share-card__preview">
			<v-skeleton-loader
				v-if="isGenerating"
				type="image"
				class="novel-quote-share-card__skeleton"
			/>
			<img
				v-else-if="posterImage"
				:src="posterImage"
				alt="小说选段分享海报"
				class="novel-quote-share-card__image"
			/>
		</div>
		<canvas ref="posterCanvas" class="novel-quote-share-card__canvas"></canvas>
		<v-fade-transition>
			<div v-if="posterImage && !isGenerating" class="novel-quote-share-card__actions">
				<v-btn
					v-if="canSystemShare"
					color="primary"
					prepend-icon="mdi-share-variant-outline"
					aria-label="系统分享"
					title="系统分享"
					@click="sharePoster"
				>
					系统分享
				</v-btn>
				<v-btn
					color="primary"
					prepend-icon="mdi-download"
					aria-label="保存海报"
					title="保存海报"
					@click="downloadPoster"
				>
					保存海报
				</v-btn>
			</div>
		</v-fade-transition>
		<p class="novel-quote-share-card__tip">保存后可发送到任意聊天或社交平台</p>
	</div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode';
import { getNovelPosterLayout, NOVEL_POSTER_METRICS } from '~/utils/novelShare';
import {
	downloadPosterImage,
	drawImageContain,
	loadImage,
	roundedRect,
} from '~/utils/posterCanvas';

const props = defineProps<{
	quote: string;
	title: string;
	author: string;
	chapterLabel: string;
	shareUrl: string;
}>();

const { $tip } = useNuxtApp();
const posterCanvas = ref<HTMLCanvasElement | null>(null);
const posterImage = ref('');
const isGenerating = ref(false);
const canSystemShare = ref(false);

const POSTER_WIDTH = NOVEL_POSTER_METRICS.width;

function getWrappedLines(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
) {
	const lines: string[] = [];
	for (const paragraph of text.split('\n')) {
		let line = '';
		for (const character of Array.from(paragraph || ' ')) {
			const candidate = line + character;
			if (!line || ctx.measureText(candidate).width <= maxWidth) {
				line = candidate;
				continue;
			}
			lines.push(line);
			line = character;
		}
		lines.push(line || ' ');
	}
	return lines;
}

function drawTextLines(
	ctx: CanvasRenderingContext2D,
	lines: string[],
	x: number,
	y: number,
	lineHeight: number,
) {
	for (const [index, line] of lines.entries()) {
		ctx.fillText(line, x, y + index * lineHeight);
	}
}

function drawLabel(
	ctx: CanvasRenderingContext2D,
	label: string,
	x: number,
	y: number,
) {
	ctx.fillStyle = '#af8a95';
	ctx.font = '700 17px sans-serif';
	ctx.fillText(label, x, y);
}

async function generateCard() {
	const canvas = posterCanvas.value;
	if (!canvas || isGenerating.value) return;

	isGenerating.value = true;
	try {
		canvas.width = POSTER_WIDTH;
		canvas.height = 1;
		let ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('浏览器不支持生成分享海报');
		ctx.font = NOVEL_POSTER_METRICS.quoteFont;
		const quoteLines = getWrappedLines(
			ctx,
			props.quote,
			NOVEL_POSTER_METRICS.quoteMaxWidth,
		);
		ctx.font = NOVEL_POSTER_METRICS.detailFont;
		const titleLines = getWrappedLines(
			ctx,
			props.title,
			NOVEL_POSTER_METRICS.detailMaxWidth,
		);
		const authorLines = getWrappedLines(
			ctx,
			props.author,
			NOVEL_POSTER_METRICS.detailMaxWidth,
		);
		const layout = getNovelPosterLayout({
			quoteLineCount: quoteLines.length,
			titleLineCount: titleLines.length,
			authorLineCount: authorLines.length,
		});
		canvas.height = layout.canvasHeight;
		ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('浏览器不支持生成分享海报');

		const background = ctx.createLinearGradient(
			0,
			0,
			POSTER_WIDTH,
			layout.canvasHeight,
		);
		background.addColorStop(0, '#fff5fb');
		background.addColorStop(1, '#f0e7f5');
		ctx.fillStyle = background;
		ctx.fillRect(0, 0, POSTER_WIDTH, layout.canvasHeight);

		const cardTop = NOVEL_POSTER_METRICS.cardTop;
		const cardLeft = NOVEL_POSTER_METRICS.cardLeft;
		const cardWidth = NOVEL_POSTER_METRICS.cardWidth;
		const cardBottom = layout.footerTop + layout.footerHeight;
		ctx.fillStyle = '#f1bed1';
		ctx.shadowColor = 'rgba(98, 70, 84, 0.13)';
		ctx.shadowBlur = 30;
		roundedRect(
			ctx,
			cardLeft,
			cardTop,
			cardWidth,
			cardBottom - cardTop,
			NOVEL_POSTER_METRICS.cardRadius,
		);
		ctx.fill();
		ctx.shadowColor = 'transparent';
		try {
			const hands = await loadImage('/novel-share-yuri-hands.png');
			const cardHeight = cardBottom - cardTop;
			ctx.globalCompositeOperation = 'source-over';
			ctx.globalAlpha = 0.5;
			ctx.save();
			roundedRect(
				ctx,
				cardLeft,
				cardTop,
				cardWidth,
				cardHeight,
				NOVEL_POSTER_METRICS.cardRadius,
			);
			ctx.clip();
			drawImageContain(ctx, hands, cardLeft, cardTop, cardWidth, cardHeight);
			const tintCanvas = document.createElement('canvas');
			tintCanvas.width = hands.naturalWidth;
			tintCanvas.height = hands.naturalHeight;
			const tintContext = tintCanvas.getContext('2d');
			if (tintContext) {
				tintContext.drawImage(hands, 0, 0);
				tintContext.globalCompositeOperation = 'source-in';
				tintContext.fillStyle = '#e58fb5';
				tintContext.fillRect(0, 0, tintCanvas.width, tintCanvas.height);
				ctx.globalAlpha = 0.22;
				drawImageContain(ctx, tintCanvas, cardLeft, cardTop, cardWidth, cardHeight);
			}
			ctx.restore();
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = 'source-over';
		} catch {
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = 'source-over';
			// 装饰素材加载失败时不影响海报生成。
		}
		ctx.fillStyle = 'rgba(255, 241, 248, 0.78)';
		roundedRect(ctx, cardLeft, cardTop, cardWidth, layout.cardBottom - cardTop, [
			NOVEL_POSTER_METRICS.cardRadius,
			NOVEL_POSTER_METRICS.cardRadius,
			0,
			0,
		]);
		ctx.fill();

		ctx.fillStyle = '#d85a9a';
		ctx.font = '900 96px Georgia, serif';
		ctx.fillText('“', 94, layout.quoteTop - 38);
		ctx.fillStyle = '#322d31';
		ctx.font = NOVEL_POSTER_METRICS.quoteFont;
		drawTextLines(
			ctx,
			quoteLines,
			120,
			layout.quoteTop,
			NOVEL_POSTER_METRICS.quoteLineHeight,
		);

		const chapter = props.chapterLabel.split(' · ')[0] ?? props.chapterLabel;
		drawLabel(ctx, '章节', 120, layout.metadataTop);
		ctx.fillStyle = '#97727e';
		ctx.font = NOVEL_POSTER_METRICS.detailFont;
		ctx.fillText(chapter, 120, layout.metadataTop + 36);
		try {
			const logo = await loadImage('/image.png');
			const ratio = Math.min(190 / logo.naturalWidth, 58 / logo.naturalHeight);
			const width = logo.naturalWidth * ratio;
			const height = logo.naturalHeight * ratio;
			ctx.drawImage(
				logo,
				800 - width,
				layout.metadataTop + 36 - height,
				width,
				height,
			);
		} catch {
			ctx.fillStyle = '#a6718e';
			ctx.font = '800 32px serif';
			ctx.textAlign = 'right';
			ctx.fillText('moelian', 800, layout.metadataTop + 36);
			ctx.textAlign = 'left';
		}

		ctx.fillStyle = 'rgba(249, 218, 235, 0.82)';
		roundedRect(ctx, cardLeft, layout.footerTop, cardWidth, layout.footerHeight, [
			0,
			0,
			NOVEL_POSTER_METRICS.cardRadius,
			NOVEL_POSTER_METRICS.cardRadius,
		]);
		ctx.fill();
		ctx.fillStyle = '#c6879b';
		roundedRect(
			ctx,
			94,
			layout.footerTop + 34,
			5,
			layout.footerHeight - 68,
			2.5,
		);
		ctx.fill();
		drawLabel(ctx, '作品', 120, layout.footerTop + 54);
		ctx.fillStyle = '#513f44';
		ctx.font = NOVEL_POSTER_METRICS.detailFont;
		drawTextLines(
			ctx,
			titleLines,
			120,
			layout.footerTop + 88,
			NOVEL_POSTER_METRICS.detailLineHeight,
		);
		const authorLabelY =
			layout.footerTop +
			88 +
			titleLines.length * NOVEL_POSTER_METRICS.detailLineHeight +
			30;
		drawLabel(ctx, '作者', 120, authorLabelY);
		ctx.fillStyle = '#513f44';
		ctx.font = NOVEL_POSTER_METRICS.detailFont;
		drawTextLines(
			ctx,
			authorLines,
			120,
			authorLabelY + 34,
			NOVEL_POSTER_METRICS.detailLineHeight,
		);
		const qrDataUrl = await QRCode.toDataURL(props.shareUrl, {
			width: 180,
			margin: 1,
			color: { dark: '#543d47', light: '#ffffff' },
		});
		const qr = await loadImage(qrDataUrl);
		const qrX = 664;
		const qrY = layout.qrTop;
		ctx.drawImage(qr, qrX, qrY, NOVEL_POSTER_METRICS.qrSize, NOVEL_POSTER_METRICS.qrSize);
		try {
			const lily = await loadImage('/novel-share-yuri-lily.png');
			ctx.globalCompositeOperation = 'multiply';
			ctx.globalAlpha = 0.32;
			ctx.drawImage(lily, 480, qrY - 4, 170, 143);
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = 'source-over';
		} catch {
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = 'source-over';
			// 装饰素材加载失败时不影响海报生成。
		}
		ctx.fillStyle = '#9d8189';
		ctx.font = '600 14px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('推荐给喜欢百合的你', 730, qrY + NOVEL_POSTER_METRICS.qrSize + 24);
		ctx.textAlign = 'left';

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
	downloadPosterImage(posterImage.value, props.title, '选段分享');
	$tip('分享海报已保存', { color: 'success', icon: 'mdi-download' });
}

async function sharePoster() {
	const canvas = posterCanvas.value;
	if (!canvas || !navigator.share) return;
	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, 'image/png'),
	);
	if (!blob) {
		downloadPoster();
		return;
	}

	const file = new File([blob], `${props.title}-选段分享.png`, {
		type: 'image/png',
	});
	if (navigator.canShare && !navigator.canShare({ files: [file] })) {
		downloadPoster();
		return;
	}

	try {
		await navigator.share({
			files: [file],
			title: props.title,
			text: props.quote,
		});
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') return;
		downloadPoster();
	}
}

onMounted(() => {
	canSystemShare.value = Boolean(
		navigator.share && typeof File !== 'undefined',
	);
});

defineExpose({ generateCard, downloadPoster });
</script>

<style scoped>
.novel-quote-share-card {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 20px;
	background: #fff;
}

.novel-quote-share-card__preview,
.novel-quote-share-card__skeleton,
.novel-quote-share-card__image {
	width: 100%;
	border-radius: 16px;
}

.novel-quote-share-card__preview {
	min-height: 280px;
	overflow: hidden;
	background: #f7f0f4;
}

.novel-quote-share-card__image {
	display: block;
}

.novel-quote-share-card__canvas {
	display: none;
}

.novel-quote-share-card__actions {
	display: flex;
	justify-content: center;
	gap: 12px;
}

.novel-quote-share-card__tip {
	margin: 0;
	color: #765f68;
	font-size: 0.875rem;
	font-weight: 500;
	text-align: center;
}
</style>
