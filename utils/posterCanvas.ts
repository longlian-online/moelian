export function roundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number | DOMPointInit | (number | DOMPointInit)[],
) {
	ctx.beginPath();
	ctx.roundRect(x, y, width, height, radius);
}

export function loadImage(
	src: string,
	crossOrigin?: 'anonymous',
): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		if (crossOrigin) image.crossOrigin = crossOrigin;
		image.onload = () => resolve(image);
		image.onerror = reject;
		image.src = src;
	});
}

export function drawImageContain(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement | HTMLCanvasElement,
	x: number,
	y: number,
	width: number,
	height: number,
) {
	const imageWidth = 'naturalWidth' in image ? image.naturalWidth : image.width;
	const imageHeight = 'naturalHeight' in image ? image.naturalHeight : image.height;
	const scale = Math.min(
		width / imageWidth,
		height / imageHeight,
	);
	const drawWidth = imageWidth * scale;
	const drawHeight = imageHeight * scale;
	ctx.drawImage(
		image,
		x + (width - drawWidth) / 2,
		y + (height - drawHeight) / 2,
		drawWidth,
		drawHeight,
	);
}

export function downloadPosterImage(
	dataUrl: string,
	title: string,
	suffix: string,
) {
	const safeTitle = title.replace(/[\\/:*?"<>|]/g, '-');
	const link = document.createElement('a');
	link.href = dataUrl;
	link.download = `${safeTitle}-${suffix}.png`;
	document.body.appendChild(link);
	link.click();
	link.remove();
}
