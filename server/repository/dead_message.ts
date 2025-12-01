import type { DeadMessage } from "../lib/prisma";

export const createDeadMessage = async (data: Pick<DeadMessage, 'data' | 'subject'>) => {
    return useDB().deadMessage.create({ data })
}