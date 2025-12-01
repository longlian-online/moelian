/**
 * 连载状态
 * 0 = Serializing (连载中)
 * 1 = Completed (已完结)
 */
export enum SerialStatus {
	Serializing,
	Completed,
}

export enum Status {
	Disable,
	Enable,
}

export enum LengthType {
	Short,
	Medium,
	Long,
}

export enum ContentType {
	Manga,
	Novel,
}

// 定义一个接口来描述 card 对象的结构
export interface Card {
	id: number;
	src: string;
	title: string;
	author: string;
	description: string;
	createAt: string;
	contentLength: LengthType;
	contentType: ContentType;
	type?: string; // 后期改为number
	status: SerialStatus;
	latestChapter?: number; // 作品的最新章节号
	lastUpdatedAt?: string; // 最近一次更新的时间 Date
	tag?: Array<string>;
}

export interface Chapter {
	id: number;
	cardId: number;
	chapterNumber: number;
	title: string;
	contentType: ContentType;
	content?: string | string[];
	lastUpdated: string; //后续改为Date
}
// 创建映射对象
export const ContentTypeMap: Record<ContentType, string> = {
	[ContentType.Manga]: '漫画',
	[ContentType.Novel]: '小说',
};

// 修复：使用 SerialStatus 作为键类型，并映射正确的枚举成员
export const ContentStatusMap: Record<SerialStatus, string> = {
	[SerialStatus.Serializing]: '连载中',
	[SerialStatus.Completed]: '已完结',
};

// 修复：使用 LengthType 作为键类型
export const ContentLengthMap: Record<LengthType, string> = {
	[LengthType.Short]: '短篇',
	[LengthType.Medium]: '中篇',
	[LengthType.Long]: '长篇',
};

