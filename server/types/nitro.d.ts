import type { PrismaClient } from '@prisma/client'
import type COS from 'cos-nodejs-sdk-v5';

declare module 'nitropack' {
    interface NitroApp {
        prisma: PrismaClient;
        cosClient: COS;
    }
}

export { }