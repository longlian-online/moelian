import { LengthType, SerialStatus, ContentType } from '_db';
import { z } from 'zod';

const MessageLengthType = {
	Long: 1,
	Short: 2,
} as const;
type MessageLengthType =
	(typeof MessageLengthType)[keyof typeof MessageLengthType];
export const MessageLengthTypeMap = {
	[MessageLengthType.Long]: LengthType.Long,
	[MessageLengthType.Short]: LengthType.Short,
} as const;

const MessageSerialStatus = {
	Serializing: 1,
	Completed: 2,
} as const;
type MessageSerialStatus =
	(typeof MessageSerialStatus)[keyof typeof MessageSerialStatus];
export const MessageSerialStatusMap = {
	[MessageSerialStatus.Serializing]: SerialStatus.Serializing,
	[MessageSerialStatus.Completed]: SerialStatus.Completed,
};

const MessageContentType = {
	Manga: 1,
	Novel: 2,
} as const;
type MessageContentType =
	(typeof MessageContentType)[keyof typeof MessageContentType];
export const MessageContentTypeMap = {
	[MessageContentType.Manga]: ContentType.Manga,
	[MessageContentType.Novel]: ContentType.Novel,
};

export type Handler<T> = (data: T) => Promise<void>;

export type CreateWorkFormConsumerInput = {
	biz_no: string;
	title: string;
	content_type: MessageContentType;
	author: string;
	description: string;
	serial_status: MessageSerialStatus;
	length_type: MessageLengthType;
};
export type CreateChapterFormConsumerInput = {
	biz_no: string;
	work_biz_no: string;
	title: string;
	content_type: MessageContentType;
};

export type EditWorkFromConsumerInput = {
	biz_no: string;
	title: string;
	content_type: MessageContentType;
	author: string;
	description: string;
	serial_status: MessageSerialStatus;
	length_type: MessageLengthType;
};

export type EditChapterFormConsumerInput = {
	biz_no: string;
	title: string;
	content_type: MessageContentType;
};

export const DeleteWorkFromConsumerInput = z.object({
	biz_no: z.string(),
});

export type DeleteWorkFromConsumerInput = z.infer<
	typeof DeleteWorkFromConsumerInput
>;

export const DeleteChapterFromConsumerInput = z.object({
	biz_no: z.string(),
});
export type DeleteChapterFromConsumerInput = z.infer<
	typeof DeleteChapterFromConsumerInput
>;
