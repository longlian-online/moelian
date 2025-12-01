import { PrismaClient } from "_db";
export * from "_db";

const prismaClientSingleton = () => {
  const prisma = new PrismaClient({log: [{
      emit: 'stdout',
      level: 'query',
    }]});
    if (process.env.NODE_ENV !== 'production') {
        prisma.$on('query', (e) => {
            console.log('🎯 Prisma Query:', e.query);
            console.log('📦 Parameters:', e.params); // 👈 看到参数！
            console.log('⏱️  Duration:', e.duration, 'ms');
            console.log('---');
        });
    }
    return prisma
};



declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;