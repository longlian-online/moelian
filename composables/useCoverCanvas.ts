export function useCoverCanvas() {
	/**
	 * 生成封面图（固定 278×400px）
	 * @param author 作者名
	 * @param title 标题
	 * @param bgUrl 背景图片 URL（可空）
	 * @returns Promise<File> 可直接上传的 JPG 文件
	 */
	function generateCoverImage(
		author: string,
		title: string,
		bgUrl: string,
	): Promise<File> {
		return new Promise((resolve) => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d')!;
			const CANVAS_WIDTH = 278;
			const CANVAS_HEIGHT = 400;

			canvas.width = CANVAS_WIDTH;
			canvas.height = CANVAS_HEIGHT;

			const bgImg = new Image();
			bgImg.crossOrigin = 'Anonymous';

			bgImg.onload = () => {
				ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
				drawTexts(ctx, author, title);
				const dataURL = canvas.toDataURL('image/jpeg', 0.9);
				resolve(dataURLToFile(dataURL, `${title}.jpg`));
			};

			bgImg.onerror = () => {
				ctx.fillStyle = '#fef08a'; // 默认背景
				ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
				drawTexts(ctx, author, title);
				const dataURL = canvas.toDataURL('image/jpeg', 0.9);
				resolve(dataURLToFile(dataURL, `${title}.jpg`));
			};

			bgImg.src = bgUrl || '/default.jpg';
		});
	}

	/** Base64 转 File */
	function dataURLToFile(dataURL: string, filename: string) {
		const arr = dataURL.split(',');
		const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8arr = new Uint8Array(n);
		while (n--) u8arr[n] = bstr.charCodeAt(n);
		return new File([u8arr], filename, { type: mime });
	}

	// ------------------ 核心绘制逻辑 ------------------
	function drawTexts(
		ctx: CanvasRenderingContext2D,
		author: string,
		title: string,
	) {
		const CANVAS_WIDTH = 278;
		const CANVAS_HEIGHT = 400;

		// --- 样式定义 ---
		const TITLE_COLORS = ['#B59A72', '#E28766', '#3E91B3']; // 标题彩色渐变
		const TITLE_BACKGROUND_COLOR = 'rgba(240,230,210,0.9)';
		const BACKGROUND_RADIUS = 8;

		// 作者文字参数
		const AUTHOR_FONT_SIZE = 18;
		const AUTHOR_LINE_HEIGHT = 24;
		const AUTHOR_Y = CANVAS_HEIGHT - 80; // 作者底部距底 80px

		// 标题文字参数
		const TITLE_FONT_SIZE = 28;
		const TITLE_LINE_HEIGHT = 36;
		const TITLE_MAX_WIDTH = 218; // 左右各留 30px
		const TITLE_PADDING_Y = 10;

		const centerX = CANVAS_WIDTH / 2;

		// 绘制作者文字
		ctx.fillStyle = '#3f3f46';
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 1.5;
		ctx.font = `normal ${AUTHOR_FONT_SIZE}px "Microsoft YaHei", "Noto Sans JP", sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'alphabetic';

		ctx.strokeText(author, centerX, AUTHOR_Y);
		ctx.fillText(author, centerX, AUTHOR_Y);

		// 绘制标题区域背景与文字
		ctx.font = `bold ${TITLE_FONT_SIZE}px "Noto Serif JP", serif`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';

		// 分行逻辑
		const chars = Array.from(title);
		const lines: string[] = [];
		let currentLine = '';

		for (let i = 0; i < chars.length; i++) {
			const testLine = currentLine + chars[i];
			if (
				ctx.measureText(testLine).width > TITLE_MAX_WIDTH &&
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
				if (ctx.measureText(testLine).width + ellipsisWidth > TITLE_MAX_WIDTH) {
					line2 += ellipsis;
					break;
				} else {
					line2 = testLine;
				}
			}
		}

		const totalLines = line2 ? 2 : 1;
		const totalBgHeight = totalLines * TITLE_LINE_HEIGHT + 2 * TITLE_PADDING_Y;

		const backgroundBottomY = AUTHOR_Y - AUTHOR_LINE_HEIGHT;
		const backgroundTopY = backgroundBottomY - totalBgHeight;

		const line1Y = backgroundTopY + TITLE_PADDING_Y + TITLE_LINE_HEIGHT / 2;
		const line2Y = line1Y + TITLE_LINE_HEIGHT;

		// 背景框
		ctx.fillStyle = TITLE_BACKGROUND_COLOR;
		roundRect(
			ctx,
			0,
			backgroundTopY,
			CANVAS_WIDTH,
			totalBgHeight,
			BACKGROUND_RADIUS,
		);

		// 绘制标题文字
		if (line1) {
			const x = centerX - ctx.measureText(line1).width / 2;
			drawColoredLine(ctx, line1, x, line1Y, TITLE_COLORS);
		}
		if (line2) {
			const x = centerX - ctx.measureText(line2).width / 2;
			drawColoredLine(ctx, line2, x, line2Y, TITLE_COLORS);
		}
	}

	function drawColoredLine(
		ctx: CanvasRenderingContext2D,
		lineText: string,
		startX: number,
		startY: number,
		colors: string[],
	) {
		let currentX = startX;
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 3;
		ctx.textAlign = 'left';

		const characters = Array.from(lineText);
		for (let i = 0; i < characters.length; i++) {
			const color = colors[i % colors.length];
			ctx.strokeText(characters[i], currentX, startY);
			ctx.fillStyle = color;
			ctx.fillText(characters[i], currentX, startY);
			currentX += ctx.measureText(characters[i]).width;
		}
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

	return { generateCoverImage };
}
