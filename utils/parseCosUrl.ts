/**
 * 从带有签名参数的 COS URL 中提取出文件名（不含扩展名和查询参数）。
 * 例如: "https://.../0-0.jpg?q-sign..." => "0-0"
 */
export function getBaseFilenameFromCosUrl(url: string): string {
	if (!url) return '';
	const urlWithoutQuery = url.split('?')[0];
	const pathParts = urlWithoutQuery.split('/');
	const filenameWithExt = pathParts[pathParts.length - 1];
	const lastDotIndex = filenameWithExt.lastIndexOf('.');
	return lastDotIndex > 0
		? filenameWithExt.substring(0, lastDotIndex)
		: filenameWithExt;
}

/**
 * 解析文件名基础部分，提取主页码和子页码。
 */
export function parseFilenameIndexes(filenameBase: string): {
	mainIndex: number;
	subIndex: number;
} {
	let mainIndex: number;
	let subIndex: number;

	if (filenameBase.includes('-')) {
		// 格式: X-Y (e.g., "0-0", "10-5")
		const parts = filenameBase.split('-');
		mainIndex = parseInt(parts[0], 10);
		subIndex = parseInt(parts[1], 10);
	} else {
		// 格式: X (e.g., "01", "10")
		mainIndex = parseInt(filenameBase, 10);
		subIndex = 0; // 假定没有子页码的文件的子页码为 0
	}

	// 确保解析失败时，能得到一个有效数字，默认为 0
	return {
		mainIndex: isNaN(mainIndex) ? 0 : mainIndex,
		subIndex: isNaN(subIndex) ? 0 : subIndex,
	};
}

/**
 * 根据文件名中的页码和子页码（如 "0-0", "0-1", "1.jpg"）对 COS URL 数组进行自然排序。
 *
 * @param urlsArray 包含 URL 字符串的数组。
 * @returns 排序后的 URL 字符串数组（原数组会被修改）。
 */
export function sortUrlArrayByFilenameNaturalOrder(
	urlsArray: string[],
): string[] {
	if (!urlsArray || urlsArray.length === 0) {
		return [];
	}

	// 使用 Array.prototype.sort() 进行原地排序
	urlsArray.sort((urlA, urlB) => {
		// 1. 解析第一个 URL 的索引
		const baseNameA = getBaseFilenameFromCosUrl(urlA);
		const indexA = parseFilenameIndexes(baseNameA);

		// 2. 解析第二个 URL 的索引
		const baseNameB = getBaseFilenameFromCosUrl(urlB);
		const indexB = parseFilenameIndexes(baseNameB);

		// 3. 比较主页码
		if (indexA.mainIndex !== indexB.mainIndex) {
			return indexA.mainIndex - indexB.mainIndex;
		}

		// 4. 主页码相同时，比较子页码
		return indexA.subIndex - indexB.subIndex;
	});

	return urlsArray; // 返回已排序的数组
}
