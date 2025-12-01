import logger from '../../lib/winston';
import type { NatsConnection } from '@nats-io/transport-node';
import { connect } from '@nats-io/transport-node';
import type { Consumer, ConsumerMessages } from '@nats-io/jetstream';
import { jetstream, jetstreamManager } from '@nats-io/jetstream'; // Nats消费者
import { BaseConsumer } from '.';
import type {
	CreateChapterFormConsumerInput,
	CreateWorkFormConsumerInput,
	EditChapterFormConsumerInput,
	EditWorkFromConsumerInput,
	Handler,
} from '~/server/types/consumer';
import {
	DeleteChapterFromConsumerInput,
	DeleteWorkFromConsumerInput,
} from '~/server/types/consumer';
import {
	createWorkFormConsumer,
	deleteWorkFromConsumer,
	updateWorkFormConsumer,
} from '../work';
import {
	createChapterFormConsumer,
	deleteChapterFromConsumer,
	updateChapterFormConsumer,
} from '../chapter';
import { createDeadMessage } from '~/server/repository/dead_message';

const StreamType = {
	Content: 'content',
	User: 'user',
} as const;

type StreamType = (typeof StreamType)[keyof typeof StreamType];

const SubjectType = {
	WorkAll: 'work.*',
	ChapterAll: 'chapter.*',
	WorkEdit: 'work.edit',
	ChapterEdit: 'chapter.edit',
	WorkCreate: 'work.create',
	ChapterCreate: 'chapter.create',
	WorkDelete: 'work.delete',
	ChapterDelete: 'chapter.delete',
} as const;

const ConsumerType = {
	WorkCreate: 'work_create',
	ChapterCreate: 'chapter_create',
	WorkEdit: 'work_edit',
	ChapterEdit: 'chapter_edit',
	WorkDelete: 'work_delete',
	ChapterDelete: 'chapter_delete',
	User: 'user',
} as const;

export class NatsConsumer extends BaseConsumer {
	private nats?: NatsConnection;
	handlers: Record<string, ConsumerMessages> = {};

	override async init(): Promise<void> {
		const natsConf = useRuntimeConfig().nats;
		this.nats = await connect({
			servers: natsConf.server,
			token: natsConf.token,
		});
		logger.info(`nats connected`);

		const jsm = await jetstreamManager(this.nats);
		await jsm.streams.add({
			name: StreamType.Content,
			subjects: [SubjectType.WorkAll, SubjectType.ChapterAll],
			retention: 'interest',
			storage: 'file',
			max_msgs: 1000,
		});
		const js = jetstream(this.nats);
		// 作品创建消费者
		await jsm.consumers.add(StreamType.Content, {
			durable_name: ConsumerType.WorkCreate,
			filter_subject: SubjectType.WorkCreate,
			ack_policy: 'explicit',
		});
		// 章节创建消费者
		await jsm.consumers.add(StreamType.Content, {
			durable_name: ConsumerType.ChapterCreate,
			filter_subject: SubjectType.ChapterCreate,
			ack_policy: 'explicit',
		});
		// 作品修改消费者
		await jsm.consumers.add(StreamType.Content, {
			durable_name: ConsumerType.WorkEdit,
			filter_subject: SubjectType.WorkEdit,
			ack_policy: 'explicit',
		});
		// 章节修改消费者
		await jsm.consumers.add(StreamType.Content, {
			durable_name: ConsumerType.ChapterEdit,
			filter_subject: SubjectType.ChapterEdit,
			ack_policy: 'explicit',
		});
		// 作品修改消费者
		await jsm.consumers.add(StreamType.Content, {
			durable_name: ConsumerType.WorkDelete,
			filter_subject: SubjectType.WorkDelete,
			ack_policy: 'explicit',
		});
		// 章节修改消费者
		await jsm.consumers.add(StreamType.Content, {
			durable_name: ConsumerType.ChapterDelete,
			filter_subject: SubjectType.ChapterDelete,
			ack_policy: 'explicit',
		});

		const workCreateConsumer = await js.consumers.get(
			StreamType.Content,
			ConsumerType.WorkCreate,
		);
		const chapterCreateConsumer = await js.consumers.get(
			StreamType.Content,
			ConsumerType.ChapterCreate,
		);
		const workEditConsumer = await js.consumers.get(
			StreamType.Content,
			ConsumerType.WorkEdit,
		);
		const chapterEditConsumer = await js.consumers.get(
			StreamType.Content,
			ConsumerType.ChapterEdit,
		);
		const workDeleteConsumer = await js.consumers.get(
			StreamType.Content,
			ConsumerType.WorkDelete,
		);
		const chapterDeleteConsumer = await js.consumers.get(
			StreamType.Content,
			ConsumerType.ChapterDelete,
		);
		this.handlers[ConsumerType.WorkCreate] = await this.consume(
			workCreateConsumer,
			async (data: CreateWorkFormConsumerInput) => {
				await createWorkFormConsumer(data);
			},
		);
		this.handlers[ConsumerType.ChapterCreate] = await this.consume(
			chapterCreateConsumer,
			async (data: CreateChapterFormConsumerInput) => {
				await createChapterFormConsumer(data);
			},
		);
		this.handlers[ConsumerType.WorkEdit] = await this.consume(
			workEditConsumer,
			async (data: EditWorkFromConsumerInput) => {
				await updateWorkFormConsumer(data);
			},
		);
		this.handlers[ConsumerType.ChapterEdit] = await this.consume(
			chapterEditConsumer,
			async (data: EditChapterFormConsumerInput) => {
				await updateChapterFormConsumer(data);
			},
		);
		this.handlers[ConsumerType.WorkDelete] = await this.consume(
			workDeleteConsumer,
			async (data: unknown) => {
				const result = DeleteWorkFromConsumerInput.safeParse(data);
				if (!result.success) {
					logger.error(
						`workDeleteConsumer input data schema error, data:${JSON.stringify(data)}`,
					);
					return;
				}
				await deleteWorkFromConsumer(result.data);
			},
		);
		this.handlers[ConsumerType.ChapterDelete] = await this.consume(
			chapterDeleteConsumer,
			async (data: unknown) => {
				const result = DeleteChapterFromConsumerInput.safeParse(data);
				if (!result.success) {
					logger.error(
						`chapterDeleteConsumer, input data schema error, data:${JSON.stringify(data)}`,
					);
					return;
				}
				await deleteChapterFromConsumer(result.data);
			},
		);
	}

	override async stop(): Promise<void> {
		await this.nats?.drain();
	}

	async consume<T>(consumer: Consumer, handler: Handler<T>) {
		return await consumer.consume({
			callback: (msg) => {
				const dataStr = msg.data.toString();
				logger.info(`${msg.subject} event triggered! data:${dataStr}`);
				if (msg.info.deliveryCount > 3) {
					try {
						createDeadMessage({
							data: dataStr,
							subject: msg.subject,
						});
					} catch (e) {
						logger.error(`Dead Message save fail reason:${e}`);
					}
					logger.error(`consume message fatal:${dataStr}`);
					msg.ack();
					return;
				}
				const data: T = JSON.parse(dataStr);
				handler(data)
					.then(() => {
						logger.info(`${msg.subject} event handler success!`);
						msg.ack();
					})
					.catch((e) => {
						logger.info(`consume message fail: ${e}`);
						msg.nak(5 * 1000);
						return;
					});
			},
		});
	}
}
