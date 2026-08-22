# AGENTS.md

本文件适用于整个仓库，供在本项目中工作的编码代理阅读和遵守。若子目录中存在更具体的 `AGENTS.md`，则以距离目标文件最近的规范为准。

## 项目概况

- 这是一个基于 Nuxt 4、Vue 3 和 TypeScript 的漫画/小说在线阅读平台。
- 使用 Vuetify 3 构建界面，Pinia 管理客户端状态，Nitro/H3 提供服务端 API。
- 数据层使用 PostgreSQL 与 Prisma；服务端还接入腾讯云 COS、NATS JetStream 和 Winston。
- 包管理器固定为 pnpm，Node.js 版本以 `package.json` 中的 `engines` 和 `volta` 配置为准。
- 当前仓库沿用根目录 `pages/`、`components/`、`composables/` 等兼容布局。不要仅为了符合 Nuxt 4 的默认 `app/` 布局而搬迁目录；目录迁移必须是单独、明确授权的任务。

## 常用命令

```bash
pnpm install
pnpm dev
pnpm static-check
pnpm test
pnpm build
```

- 优先使用已有脚本，不要混用 npm、Yarn 或 Bun，也不要生成其他包管理器的锁文件。
- `pnpm dev` 会执行 Prisma Client 生成、Nuxt prepare 和 TypeScript 检查，然后启动开发服务器。
- 日常改动至少运行 `pnpm static-check` 和相关测试；影响构建、配置、依赖或服务端运行时的改动还应运行 `pnpm build`。
- `pnpm test` 会执行全部 Vitest 测试。开发时可以用 `pnpm vitest run <测试文件>` 缩小范围，但交付前应按改动风险补跑完整测试。

## 目录与职责

- `pages/`：文件路由页面。页面负责路由参数、页面元信息、数据装配和布局，不承载可复用的复杂业务逻辑。
- `components/`：可复用 Vue 组件。阅读器相关组件集中在 `components/manga/`、`components/novel/` 等现有业务目录。
- `composables/`：可复用的组合式状态与行为；命名使用 `useXxx`。
- `stores/`：跨页面的 Pinia 状态。局部状态优先留在组件或 composable 中。
- `layouts/`、`middleware/`、`plugins/`、`utils/`：分别保存布局、路由中间件、Nuxt 插件和客户端/通用辅助函数。
- `server/api/`：Nitro API 入口；文件名中的 `.get`、`.post`、`.put`、`.patch`、`.delete` 决定 HTTP 方法。
- `server/service/`：业务规则和业务流程。
- `server/repository/`：Prisma 查询及持久化操作。不要从页面或组件直接访问数据库。
- `server/utils/`、`server/lib/`：服务端通用能力和外部基础设施封装。
- `shared/dto/`：前后端共享的请求/响应 DTO 与 Zod 校验 schema。
- `shared/types/`：前后端都需要的纯类型；不得依赖 Vue 或服务端专属模块。
- `prisma/schema.prisma` 与 `prisma/migrations/`：数据库模型与迁移历史。
- `tests/unit/`：Vitest 单元测试，目录尽量与被测代码的业务边界对应。

## Nuxt 与 Vue 约定

- 新组件使用 Vue Composition API 和 `<script setup lang="ts">`；遵循相邻文件已有风格。
- Nuxt/Vue 自动导入可直接使用；普通第三方模块、类型、仓库内显式分层依赖仍应清楚导入。不要为了“统一”而批量改写无关 import。
- 本项目在 `nuxt.config.ts` 中设置了 `components.pathPrefix: false`。新增组件名必须避免跨目录重名，并优先让文件名与组件名一致。
- 页面首屏或 SSR 数据使用 `useFetch` / `useAsyncData`，避免在 setup 顶层用 `$fetch` 造成服务端与客户端重复请求。用户操作触发的一次性请求可使用 `$fetch`。
- SSR 渲染必须具有确定性。浏览器专属 API（如 `window`、`document`、`localStorage`、Canvas）应放在 `onMounted`、`.client` 文件、`import.meta.client` 分支或 `<ClientOnly>` 中，并为服务端渲染保留稳定占位。
- 共享响应式状态优先使用 `useState` 或 Pinia，不要在模块顶层创建会跨 SSR 请求共享的可变单例状态。
- 路由跳转使用 `<NuxtLink>` 或 `navigateTo`；动态路由参数要先校验和转换，不能直接假设其类型或内容合法。
- 保持现有渲染策略：`/admin/**` 与 `/login` 当前为客户端渲染。修改 `routeRules` 前检查 SEO、鉴权和水合影响。
- 样式和交互优先复用 Vuetify 组件、主题和现有设计模式；避免为单一页面引入新的 UI 框架。
- 阅读器属于高交互区域。修改翻页、滚动、缩放、RTL、键盘/触摸事件或进度持久化时，必须同时考虑桌面端、移动端、漫画单/双页及小说阅读模式中受影响的分支。

## 服务端与 API 约定

- API handler 保持轻量：读取事件数据、鉴权、用共享 Zod schema 校验、调用 service、返回 DTO。
- 统一使用现有的 `defineWrappedResponseHandler` 返回 `{ code, message, data }` 结构，除非目标端点明确需要流、文件或第三方回调协议。
- 需要登录态的端点使用 `requireUserSession(event)`；管理端端点还要遵循 `server/middleware/auth.ts` 与 `runtimeConfig.privateRoute` 的现有保护方式。
- 业务校验和业务异常放在 service 层；数据库查询、事务和软删除过滤放在 repository 层。
- 列表和详情查询默认排除 `deleted_at` 非空的数据，除非业务明确要求包含已删除记录。
- 多个必须原子完成的写操作使用 Prisma transaction。避免在循环中产生不必要的 N+1 查询。
- 所有外部输入都要在边界处校验，包括 body、query、route params 和回调载荷；不要用 TypeScript 类型断言代替运行时校验。
- 服务端不得导入页面、组件、客户端 composable 或其他仅浏览器可用代码；客户端也不得导入 `server/` 实现。
- 密钥只放在私有 `runtimeConfig`/环境变量中。只有可公开值才能放在 `runtimeConfig.public`；日志、错误信息和测试快照不得泄露 token、密码、COS 密钥或用户敏感数据。
- Prisma Client 使用项目现有的 `useDB()` / `server/lib/prisma` 封装和 `_db` 类型别名，不要另建无生命周期管理的 Client 实例。

## DTO、类型与命名

- 请求和响应类型优先复用 `shared/dto/`；跨端业务类型放在 `shared/types/`，服务端专属类型放在 `server/types/`。
- API 外部字段遵循现有 DTO 的 camelCase；数据库字段保持 Prisma 模型中的 snake_case。映射应在 API/service 边界清楚完成，不要让数据库模型无意成为公开响应契约。
- 新增请求 DTO 时同时提供 Zod schema 和推导类型，handler 必须调用 `.parse()` 或等价的安全校验流程。
- 延续当前命名：Vue 组件使用 PascalCase，composable 使用 `useXxx`，路由文件遵循 Nuxt 文件路由规则，测试使用 `.test.ts` 或 `.spec.ts` 并跟随所在目录惯例。
- 避免新增 `any` 和无依据的 `as`。项目当前未开启 TypeScript strict；新代码仍应显式处理 `null`、`undefined` 和 `unknown`，不要扩大类型宽松范围。

## 数据库变更

- 修改数据库结构时同步更新 `prisma/schema.prisma`，并创建新的迁移；不得编辑已经应用或提交的历史迁移来伪造新状态。
- 不要手工修改生成的 Prisma Client、`.nuxt/` 或 `.output/` 内容。
- 数据迁移要考虑现有生产数据、nullable/default、唯一约束、索引和回滚/失败恢复策略。
- 未经明确授权，不运行会清空、重建或覆盖数据库的命令，也不操作生产数据库。

## 测试与交付

- 修复缺陷时优先添加能复现问题的回归测试；新增 service、repository 分支、DTO 校验或复杂 composable 时添加对应单元测试。
- service 测试应 mock repository 或外部基础设施，覆盖成功路径和业务异常；纯数据访问行为则在适合的集成环境中验证，不用脆弱的实现细节断言代替行为验证。
- Vue/阅读器改动至少检查加载、空数据、错误、刷新、客户端导航和不同屏幕尺寸；涉及 SSR 的页面还要留意控制台 hydration warning。
- 交付说明列出实际修改、执行过的检查及未执行检查的原因。不要声称未运行的命令已经通过。

## 改动边界

- 先阅读目标文件、相邻实现和相关测试，再开始修改；优先做最小且完整的改动。
- 保留用户已有的未提交修改，不回滚、不覆盖，也不要顺手格式化或重构任务范围外的文件。
- 不编辑生成目录 `.nuxt/`、`.output/`、`node_modules/`，也不提交运行日志、临时文件或真实 `.env`。
- 新增依赖前先确认现有依赖与 Nuxt 内建能力无法满足需求，并说明引入理由及客户端体积/服务端兼容影响。
- 注释应解释业务原因、边界条件或非显然取舍，不复述代码本身。
