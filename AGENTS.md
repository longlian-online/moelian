# Moelian 协作指南

本文件适用于整个仓库。修改子目录前，如存在更具体的 AGENTS.md，以距离目标文件最近的规则为准。

## 项目概况

Moelian 是基于 Nuxt 4、Vue 3 和 TypeScript 的漫画/小说在线阅读平台：

- Vuetify 3 构建界面，Pinia 管理跨页面状态。
- Nitro/H3 提供服务端 API。
- PostgreSQL 与 Prisma 持久化数据。
- 服务端接入腾讯云 COS、NATS JetStream 和 Winston。
- 包管理器固定为 pnpm，Node.js 版本以 package.json 配置为准。

项目沿用根目录的 pages/、components/、composables/ 等布局，不要为了符合 Nuxt 4 默认结构而搬迁文件。

## 常用命令

```bash
pnpm install
pnpm dev
pnpm static-check
pnpm test
pnpm build
```

日常改动至少运行 static-check 和相关测试；涉及构建、配置、依赖或服务端运行时的改动还要运行 build。不要混用 npm、Yarn 或 Bun，也不要生成其他锁文件。

## 目录职责

- pages/：路由页面、元信息、路由参数和数据装配。
- components/：可复用组件；阅读器位于 components/manga/ 和 components/novel/。
- composables/：可复用组合式状态与行为，命名使用 useXxx。
- stores/：跨页面 Pinia 状态；局部状态优先放在组件或 composable 中。
- server/api/：轻量 API handler。
- server/service/：业务规则和流程。
- server/repository/：Prisma 查询和持久化。
- server/lib/、server/utils/：服务端基础设施和通用能力。
- shared/dto/：共享请求/响应 DTO 与 Zod schema。
- shared/types/：不依赖 Vue 或服务端模块的共享类型。
- prisma/：数据库 schema 和迁移历史。
- tests/unit/：Vitest 单元测试。

页面和组件不得直接访问数据库；服务端 API 应通过 service 和 repository 分层完成业务与持久化。

## Nuxt 与 Vue 约定

- 新组件使用 `<script setup lang="ts">` 和 Composition API，并遵循相邻文件风格。
- 页面首屏或 SSR 数据使用 useFetch / useAsyncData；用户操作触发的一次性请求才使用 $fetch。
- 浏览器专属 API 放在 onMounted、.client 文件、import.meta.client 分支或 ClientOnly 中。
- SSR 渲染必须确定，避免模块顶层跨请求共享可变状态。
- 路由跳转使用 NuxtLink 或 navigateTo；动态参数必须先校验和转换。
- 优先复用 Vuetify 组件、主题和样式模式。
- 阅读器改动必须考虑桌面/移动端、单页/双页、RTL、缩放、键盘/触摸和阅读进度。

## 服务端与 API 约定

- 使用现有 defineWrappedResponseHandler 返回 { code, message, data }。
- 登录态端点使用 requireUserSession(event)，管理端遵循现有 auth middleware。
- handler 只负责读取请求、鉴权、校验输入和调用 service；业务校验与异常放在 service。
- 所有 body、query、route params 和回调载荷都必须运行时校验，优先使用共享 Zod schema。
- 列表和详情查询默认排除 deleted_at 非空数据。
- 必须原子完成的写操作使用 Prisma transaction，避免循环中的 N+1 查询。
- 使用已有 useDB() / server/lib/prisma 封装，不要自行创建 Prisma Client。
- 服务端不得导入页面、组件或客户端 composable；客户端不得导入 server/ 实现。

## 数据与安全

- 真实凭据只放在 .env 或部署环境中；.env 不得提交。
- .env.example 只能包含占位符。
- 不要在日志、错误信息、测试快照、Issue 或 PR 中泄露 token、密码、密钥或用户隐私数据。
- 未经明确授权，不运行清空、重建或覆盖数据库的命令，也不操作生产数据库。
- 修改数据库时同步更新 prisma/schema.prisma 并创建新迁移，不要改写历史迁移。
- 不要编辑 .nuxt/、.output/、node_modules/ 或生成的 Prisma Client。
- 公开项目时确认 public/、COS 资源和测试数据不含私人信息或未授权内容。

## Git、Commit 与 Pull Request

- Git commit message 和 Pull Request 标题、描述必须使用中文。
- commit 格式：`<type>(<scope>): <中文主题>`，主题不超过 50 个字符。
- 允许的 type：upd、feat、fix、docs、style、refactor、chore、revert。
- Merge commit 可使用 Git 默认生成的 Merge message。
- 首次使用前启用检查：`git config core.hooksPath .githooks`。
- AI 提交代码时必须使用中文 commit，并在 PR 描述中说明改动和验证结果。
- main 只能通过 PR 合并；sit 不需要 PR 验证，但只允许管理员直接 push。

示例：

```text
feat(阅读器): 增加双页阅读模式
fix(登录): 修复会话过期处理
docs: 补充本地开发说明
```

## 改动边界与交付

先阅读目标文件、相邻实现和相关测试，再开始修改。做最小且完整的改动，保留已有未提交修改，不回滚无关变更。修复缺陷时优先添加回归测试。交付说明必须列出实际修改、已执行的检查，以及未执行检查的原因。

