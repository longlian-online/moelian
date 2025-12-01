import {NatsConsumer} from "~/server/service/consumer/nats";

export default defineNitroPlugin(async () => {
    const consumer = new NatsConsumer()
    await consumer.init()
});
