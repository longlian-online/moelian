# ===== 构建阶段 =====
FROM node:20.19.5-alpine AS builder

WORKDIR /app

# 设置pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. 安装依赖
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 2. 复制源码和构建
COPY . .
RUN pnpm run build

# 3. 清理缓存（关键！）
RUN pnpm store prune && \
    rm -rf /pnpm/store/v3/files && \
    rm -rf /root/.cache /tmp/*

# ===== 生产阶段 =====
FROM node:20.19.5-alpine

WORKDIR /app

# 只复制运行必需
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# 生产环境依赖
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && \
    pnpm install --prod --frozen-lockfile && \
    pnpm store prune && \
    rm -rf /pnpm/store /root/.npm /root/.cache /var/cache/apk/*

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]