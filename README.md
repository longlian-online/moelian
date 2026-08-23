# 📚 在线阅读平台 (Online Reading Platform)

> 基于 Nuxt 4 构建的现代化漫画/小说在线阅读服务，提供沉浸式阅读体验和完善的内容管理系统

## 🎯 项目概述

这是一个功能完善的在线阅读平台，支持漫画和小说两种内容类型。项目采用现代化的全栈技术架构，实现了从内容上传、管理到用户阅读的完整业务流程。

详细的功能说明、技术栈、项目架构与业务流程见 [📖 项目说明](docs/项目说明.md)。

## 📦 打包说明

### 本地构建

```bash
# 安装依赖（Node.js 20.19.5 + pnpm）
pnpm install

# 构建生产版本（含 prisma generate）
pnpm build
```

### Docker 本地打包

```bash
# 构建镜像
docker build -t moelian .

# 运行容器（服务监听 3000 端口）
docker run -p 3000:3000 moelian
```

### GitHub Actions 自动打包推送 GHCR

推送 tag 即自动触发工作流（`.github/workflows/docker-push-ghcr.yml`），构建镜像并推送到 GitHub Packages：

```bash
# 推送 tag 触发自动构建（v* 格式）
git tag v1.2.0
git push origin v1.2.0
```

镜像地址：`ghcr.io/longlian-online/moelian`，每次发布生成三个镜像 tag：`X.Y.Z`（完整版本）、`X.Y`（minor 级）、`latest`。

拉取运行：

```bash
# 私有包需先登录 GHCR（token 需含 read:packages 权限）
docker login ghcr.io

docker pull ghcr.io/longlian-online/moelian:latest
docker run -p 3000:3000 ghcr.io/longlian-online/moelian:latest
```

## 📖 文档导航

- [📖 项目说明](docs/项目说明.md) — 核心功能、技术栈、项目架构、业务流程、开发环境
- [🛠 开发说明](docs/开发说明.md) — 开发规范、错误处理约定
- [🗄 存储](docs/存储.md) — COS 内容处理数据流
- [💬 全局确认对话框使用说明](docs/全局确认对话框使用说明.md) — showConfirm 组件使用指南
