import { useApiFetch } from '#imports';
import axios from 'axios';
/**
 * 获取 COS 上传 URL 的接口返回类型
 */

interface CosUploadUrlRes {
	id: number;
	url: string;
	fileUrl: string;
}

export interface UploadProgress {
	percent: number; // 上传进度（0-100）
	speed: string; // 上传速度（格式化，如 "2.3 MB/s"）
	loaded: number; // 已上传字节数
	total: number; // 总字节数
}

/**
 * 上传文件到 COS
 * @param file 要上传的 File 对象
 * @param getUploadUrlApi 后端获取上传 URL 的 API 路径
 * @param bizType 业务类型 (Manga / Novel / Avatar / Cover)
 * @returns 上传完成的文件 URL
 */

export async function uploadToCos(
	file: File,
	getUploadUrlApi: string,
	type: 'Manga' | 'Novel' | 'Avatar' | 'Cover',
	onProgress?: (progress: UploadProgress) => void,
	signal?: AbortSignal,
): Promise<number> {
	// 验证文件参数
	if (!file || !(file instanceof File)) {
		throw new Error('文件参数无效');
	}

	if (!file.name) {
		throw new Error('文件名称无效');
	}

	//获取扩展名
	const ext = file.name.split('.').pop() || '';

	const { data, error } = await useApiFetch<CosUploadUrlRes>(getUploadUrlApi, {
		method: 'POST',
		body: {
			ext,
			size: file.size,
			type,
		},
	});

	if (error.value) {
		console.error('获取上传URL失败:', error.value);
		throw new Error('获取上传URL失败');
	}

	if (!data.value || !data.value.data) {
		console.error('API返回数据格式错误:', data.value);
		throw new Error('API返回数据格式错误');
	}

	const fileId = data.value.data.id;
	const uploadInfo = data.value.data;

	if (!fileId || typeof fileId !== 'number') {
		console.error('获取到的fileId无效:', fileId);
		throw new Error('获取到的资源ID无效');
	}

	if (!uploadInfo || !uploadInfo.url) {
		console.error('获取到的上传URL无效:', uploadInfo);
		throw new Error('获取到的上传URL无效');
	}
	// 上传文件（
	let lastLoaded = 0;
	let lastTime = Date.now();

	try {
		await axios.put(uploadInfo.url, file, {
			headers: {
				'Content-Type': file.type,
			},
			signal: signal,
			onUploadProgress: (event) => {
				if (event.total) {
					const now = Date.now();
					const deltaTime = (now - lastTime) / 1000; // 秒
					const deltaLoaded = event.loaded - lastLoaded;

					const speedBps = deltaLoaded / deltaTime; // bytes/s
					const speedStr = formatSpeed(speedBps);

					lastLoaded = event.loaded;
					lastTime = now;

					const percent = Math.round((event.loaded / event.total) * 100);

					onProgress?.({
						percent,
						speed: speedStr,
						loaded: event.loaded,
						total: event.total,
					});
				}
			},
		});

		return fileId;
	} catch (error) {
		//  捕获并识别取消错误
		if (
			axios.isCancel(error) ||
			(error instanceof DOMException && error.name === 'AbortError')
		) {
			// 抛出一个特殊错误信息，供上层组件捕获并静默处理
			throw new Error('用户取消了上传');
		}

		throw error;
	}
}

/**
 * 格式化上传速度
 */
function formatSpeed(bytesPerSecond: number): string {
	if (!bytesPerSecond || bytesPerSecond < 0) return '0 B/s';
	const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
	let index = 0;
	let speed = bytesPerSecond;
	while (speed > 1024 && index < units.length - 1) {
		speed /= 1024;
		index++;
	}
	return `${speed.toFixed(2)} ${units[index]}`;
}
