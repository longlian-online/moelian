import {
	getBaseFilenameFromCosUrl,
	parseFilenameIndexes,
	sortUrlArrayByFilenameNaturalOrder,
} from '~/utils/parseCosUrl';

import { describe, it, expect } from 'vitest';

// 模拟一个基础 URL 路径，以便测试集中于文件名和签名部分
const BASE_URL = 'https://loc-1308050490.cos.ap-guangzhou.myqcloud.com/path/';
const SIGNATURE = '?q-sign-algorithm=sha1&...'; // 模拟签名部分

// --- 辅助函数测试 ---

describe('getBaseFilenameFromCosUrl', () => {
	it('应该正确提取不带扩展名和签名的文件名', () => {
		const url = `${BASE_URL}01-2.png${SIGNATURE}`;
		expect(getBaseFilenameFromCosUrl(url)).toBe('01-2');
	});

	it('应该处理不带连字符的简单文件名', () => {
		const url = `${BASE_URL}10.jpg${SIGNATURE}`;
		expect(getBaseFilenameFromCosUrl(url)).toBe('10');
	});

	it('应该处理空字符串', () => {
		expect(getBaseFilenameFromCosUrl('')).toBe('');
	});

	it('应该处理没有查询参数的 URL', () => {
		const url = `${BASE_URL}test.gif`;
		expect(getBaseFilenameFromCosUrl(url)).toBe('test');
	});

	it('应该处理没有扩展名的 URL', () => {
		const url = `${BASE_URL}no-extension${SIGNATURE}`;
		expect(getBaseFilenameFromCosUrl(url)).toBe('no-extension');
	});
});

describe('parseFilenameIndexes', () => {
	it('应该正确解析 X-Y 格式', () => {
		const index = parseFilenameIndexes('5-12');
		expect(index).toEqual({ mainIndex: 5, subIndex: 12 });
	});

	it('应该正确解析 X 格式 (子索引为 0)', () => {
		const index = parseFilenameIndexes('20');
		expect(index).toEqual({ mainIndex: 20, subIndex: 0 });
	});

	it('应该处理带前导零的数字 (X-Y)', () => {
		const index = parseFilenameIndexes('01-05');
		expect(index).toEqual({ mainIndex: 1, subIndex: 5 });
	});

	it('应该处理带前导零的数字 (X)', () => {
		const index = parseFilenameIndexes('007');
		expect(index).toEqual({ mainIndex: 7, subIndex: 0 });
	});

	it('应该处理无效的输入 (返回 0, 0)', () => {
		const index = parseFilenameIndexes('abc-def');
		expect(index).toEqual({ mainIndex: 0, subIndex: 0 });
	});
});

// --- 主要排序函数测试 ---

describe('sortUrlArrayByFilenameNaturalOrder', () => {
	const createUrl = (filename: string) => `${BASE_URL}${filename}${SIGNATURE}`;

	it('应该对混合格式的文件名进行正确的自然排序', () => {
		const unsortedUrls = [
			createUrl('1.jpg'),
			createUrl('0-1.png'),
			createUrl('1-0.webp'),
			createUrl('10.jpg'),
			createUrl('0-0.jpg'),
			createUrl('2.png'),
			createUrl('1-5.webp'),
		];

		const sortedBaseNames = [
			'0-0',
			'0-1',
			'1', // main: 1, sub: 0
			'1-0', // main: 1, sub: 0 (需要注意，如果 1.jpg 和 1-0.webp 索引完全相同，它们的位置取决于 sort 的稳定性，但通常不会影响逻辑)
			'1-5',
			'2',
			'10',
		];

		const sortedUrls = sortUrlArrayByFilenameNaturalOrder(unsortedUrls);

		// 提取排序后的文件名进行比对
		const resultBaseNames = sortedUrls.map(getBaseFilenameFromCosUrl);

		expect(resultBaseNames).toEqual(sortedBaseNames);
	});

	it('应该正确处理三位数和两位数的排序', () => {
		const unsortedUrls = [
			createUrl('100.jpg'),
			createUrl('5.jpg'),
			createUrl('10.jpg'),
			createUrl('99.jpg'),
		];
		const expectedBaseNames = ['5', '10', '99', '100'];

		const sortedUrls = sortUrlArrayByFilenameNaturalOrder(unsortedUrls);
		const resultBaseNames = sortedUrls.map(getBaseFilenameFromCosUrl);

		expect(resultBaseNames).toEqual(expectedBaseNames);
	});

	it('应该正确处理混合页码和子页码的排序', () => {
		const unsortedUrls = [
			createUrl('1-2.jpg'),
			createUrl('1-10.jpg'),
			createUrl('10-1.jpg'),
			createUrl('10-2.jpg'),
			createUrl('1-1.jpg'),
		];
		const expectedBaseNames = ['1-1', '1-2', '1-10', '10-1', '10-2'];

		const sortedUrls = sortUrlArrayByFilenameNaturalOrder(unsortedUrls);
		const resultBaseNames = sortedUrls.map(getBaseFilenameFromCosUrl);

		expect(resultBaseNames).toEqual(expectedBaseNames);
	});

	it('应该返回空数组当传入空数组时', () => {
		expect(sortUrlArrayByFilenameNaturalOrder([])).toEqual([]);
	});

	it('应该返回空数组当传入 null 时', () => {
		// 由于你的函数签名是 string[]，传入 null 应该使用 as any 忽略类型检查
		expect(sortUrlArrayByFilenameNaturalOrder(null)).toEqual([]);
	});
});
