# AI 协作与提交规范

本文件适用于整个仓库。

## Git 提交与 Pull Request

- Git commit message 和 Pull Request 标题、描述必须使用中文。
- commit message 使用 `<type>(<scope>): <中文主题>` 格式，主题不超过 50 个字符。
- 允许的 `type`：`upd`、`feat`、`fix`、`docs`、`style`、`refactor`、`chore`、`revert`。
- Merge commit 可使用 Git 默认生成的 `Merge ...` message。
- 提交前启用仓库提供的 hook：`git config core.hooksPath .githooks`。
- AI 提交代码时，必须使用中文 commit message，并在 PR 描述中用中文说明改动和验证结果。

示例：

```text
feat(阅读器): 增加双页阅读模式
fix(登录): 修复会话过期处理
docs: 补充本地开发说明
```

