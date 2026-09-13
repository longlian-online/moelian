# 贡献指南

感谢你对 Moelian 的贡献。

## 开始开发

1. 安装项目要求的 Node.js 和 pnpm 版本。
2. 安装依赖：`pnpm install`
3. 复制 `.env.example` 为 `.env`，填写本地 PostgreSQL、腾讯云 COS 和 NATS 配置。
4. 启动开发服务器：`pnpm dev`

请勿提交 `.env`、真实凭据、数据库导出文件、用户数据或运行日志。

## 提交前检查

根据改动范围运行：

```bash
pnpm static-check
pnpm test
```

涉及构建、配置、依赖或服务端运行时的改动，还应运行：

```bash
pnpm build
```

## 提交与 Pull Request

- Git commit message 和 Pull Request 标题、描述必须使用中文。
- 提交格式为 `<type>(<scope>): <中文主题>`，主题不超过 50 个字符；详细规则见根目录 `AGENTS.md`。
- 首次使用前启用提交检查：`git config core.hooksPath .githooks`。
- 保持改动聚焦，避免夹带无关格式化或重构。
- 新增或修复业务逻辑时，尽量补充对应测试。
- Pull Request 请说明改动内容、验证方式，以及尚未执行的检查。
- 不要在 Issue、Pull Request 或日志中粘贴密码、token、密钥或用户隐私数据。

## 分支权限

- `main` 只能通过 Pull Request 合并，不能直接 push；合并前必须通过 `Pull Request Validation / validate`。
- `sit` 不要求 Pull Request 验证，但仅仓库管理员可以直接 push。

这些限制需要由仓库管理员在 GitHub 的 Branch protection rules 中配置。

## 安全问题

请不要在公开 Issue 中披露可利用的安全问题或真实凭据。发现安全问题时，请先通过仓库维护者提供的私下渠道联系处理。
