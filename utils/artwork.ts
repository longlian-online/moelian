import { publicAssets } from '~/utils/assets';

/** 从现有透明手绘素材中随机选取一张。 */
export function getRandomArtwork(): string {
	const index = Math.floor(Math.random() * publicAssets.artworks.length);
	return publicAssets.artworks[index];
}

/** 选图结果写入可序列化状态，同一位置在水合和重渲染时复用。 */
export function createRandomArtworkPicker(state: Record<string, string>) {
	return (slot: string): string => {
		if (!Object.hasOwn(state, slot)) state[slot] = getRandomArtwork();
		return state[slot];
	};
}
