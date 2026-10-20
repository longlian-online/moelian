import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRandomArtworkPicker, getRandomArtwork } from '~/utils/artwork';

afterEach(() => vi.restoreAllMocks());

describe('随机手绘插图', () => {
	it('随机区间覆盖全部十三张素材', () => {
		const random = vi.spyOn(Math, 'random');
		for (let index = 0; index < 13; index++) {
			random.mockReturnValue((index + 0.5) / 13);
			expect(getRandomArtwork()).toBe(`/bookmarks/art-${String(index + 1).padStart(2, '0')}.png`);
		}
	});

	it('同一位置重渲染保持原图，新位置重新随机', () => {
		vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99);
		const pick = createRandomArtworkPicker({});
		expect(pick('cover')).toBe('/bookmarks/art-01.png');
		expect(pick('cover')).toBe('/bookmarks/art-01.png');
		expect(pick('recommendation:7')).toBe('/bookmarks/art-13.png');
	});

	it('客户端复用序列化的服务端选图，不重新抽取', () => {
		const random = vi.spyOn(Math, 'random').mockReturnValue(0);
		const state: Record<string, string> = {};
		const serverImage = createRandomArtworkPicker(state)('cover');
		const restored: Record<string, string> = JSON.parse(JSON.stringify(state));
		random.mockReturnValue(0.99);
		expect(createRandomArtworkPicker(restored)('cover')).toBe(serverImage);
	});

	it('不同请求独立抽图，不共享状态', () => {
		vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99);
		expect(createRandomArtworkPicker({})('cover')).toBe('/bookmarks/art-01.png');
		expect(createRandomArtworkPicker({})('cover')).toBe('/bookmarks/art-13.png');
	});
});
