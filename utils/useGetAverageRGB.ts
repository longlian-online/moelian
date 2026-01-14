async function useGetAverageRGB(imageUrl: string): Promise<Array<number>> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		// 设置 crossOrigin 以允许跨域读取图片像素
		img.crossOrigin = 'Anonymous';
		
		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				// 缩小尺寸以提高性能，计算平均值不需要完整尺寸
				const size = 50; 
				canvas.width = size;
				canvas.height = size;
				
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('无法创建 Canvas 上下文'));
					return;
				}
				
				ctx.drawImage(img, 0, 0, size, size);
				const imageData = ctx.getImageData(0, 0, size, size);
				const data = imageData.data;
				
				let r = 0, g = 0, b = 0;
				let count = 0;
				
				for (let i = 0; i < data.length; i += 4) {
					// 忽略过度透明或过度接近纯黑/纯白的像素
					const alpha = data[i + 3];
					if (alpha < 128) continue;
					
					r += data[i];
					g += data[i + 1];
					b += data[i + 2];
					count++;
				}
				
				if (count === 0) {
					resolve([255, 255, 255]);
					return;
				}
				
				resolve([
					Math.floor(r / count),
					Math.floor(g / count),
					Math.floor(b / count)
				]);
			} catch (e) {
				reject(e);
			}
		};
		
		img.onerror = (err) => {
			reject(err);
		};
		
		img.src = imageUrl;
	});
}

export { useGetAverageRGB };
