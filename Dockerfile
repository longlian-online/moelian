# 使用Node.js 20作为基础镜像
FROM node:20.19.5-alpine AS base

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./
COPY pnpm-lock.yaml ./
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# 安装依赖
RUN pnpm install --frozen-lockfile --prod --registry https://mirrors.cloud.tencent.com/npm/

# 复制源代码
COPY . .

ENV PRISMA_ENGINES_MIRROR https://registry.npmmirror.com/-/binary/prisma

# 运行Prisma生成和构建
RUN pnpm run build

# 生产阶段
FROM node:20.19.5-alpine AS production

# 设置工作目录
WORKDIR /app

RUN corepack enable
# 从构建阶段复制构建产物
COPY --from=base /app/.output ./.output
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", ".output/server/index.mjs"]