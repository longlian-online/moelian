/** 从现有透明手绘素材中随机选取一张。 */
export function getRandomArtwork(): string {
	const number = Math.floor(Math.random() * 13) + 1;
	return `/bookmarks/art-${String(number).padStart(2, '0')}.png`;
}

/** 选图结果写入可序列化状态，同一位置在水合和重渲染时复用。 */
export function createRandomArtworkPicker(state: Record<string, string>) {
	return (slot: string): string => {
		if (!Object.hasOwn(state, slot)) state[slot] = getRandomArtwork();
		return state[slot];
	};
}
