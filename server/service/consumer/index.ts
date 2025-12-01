export interface IEventConsumer {
    // 初始化消费者并注册监听相关 handler 
    init(): Promise<void>;
    // 停止消费者以实现优雅关闭
    stop(): Promise<void>
}

/**
 * 禁用消费者
 */
export class DisableConsumer implements IEventConsumer {
    async init(): Promise<void> {
    }

    stop(): Promise<void> {
        return Promise.resolve(undefined);
    }
}


export class BaseConsumer implements IEventConsumer {
    init(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    stop(): Promise<void> {
        return Promise.resolve(undefined);
    }
}

