---
name: moelian-release
description: 当用户要求在 PR 合并到 main 后发布 Moelian、打版本 tag、检查发布结果或重试镜像构建时使用。仅提交代码、推送功能分支或同步 sit 时不触发发布。
---

# Moelian 发布

用户在 PR 合并后说“发布”即授权为本次目标 main 提交创建并推送版本 tag、跟进构建结果，无需重复请求发布许可。编写此 Skill、讨论发布流程或合并 PR 不代表立即发布授权。版本或发布目标无法确定时，先完成只读检查，再询问缺少的信息。

## 仓库的实际发布方式

每次执行先重读目标提交中的 `.github/workflows/docker-push-ghcr.yml`、`Dockerfile`、`package.json` 和相关发布说明；以下是当前机制，若配置改变，以核验后的配置为准。

- 工作流 `Docker Build and Push` 在推送 `v*` tag 或手动触发时执行；单纯合并 main 不会触发它。
- Dockerfile 使用 Node 20.19.5、pnpm 10.33.0，执行 `pnpm build`，运行 `.output/server/index.mjs`。
- 同一镜像推送到 `ghcr.io/longlian-online/moelian` 和 `docker.cnb.cool/longlian.online/moelian`。
- `vX.Y.Z` 产生镜像标签 `X.Y.Z`、`X.Y`、`latest`（镜像版本不带 v）。发布会更新 latest。
- CI 依赖 `GITHUB_TOKEN` 和 `CNB_TOKEN`。只检查错误或配置是否存在，不读取、打印或复制密钥。
- 此工作流只构建和推送镜像，没有生产服务器部署步骤。`script/deploy-sit.sh` 是旧测试环境的 TCR/SSH 部署脚本，不能当作生产发布脚本运行。

## 确认提交与版本

1. 查看当前分支、工作区和远端。保留未提交修改；不为发布强制切换分支、重置或 stash。通过 fetch 更新远端 main 和 tag 信息；优先用 `git ls-remote --tags origin` 对照远端标签，发现本地同名 tag 指向不同时停止，不覆盖。
2. 以最新 `origin/main` 的 SHA 作为候选。读取目标 PR 状态、base、merge commit，并确认本次需要发布的改动确实包含于候选提交。main 只能通过 PR 更新，不能为了版本号直接 push main。若合并后又有其他改动，说明候选包含的范围；不能确定用户目标时询问。
3. 从候选提交读取 `package.json` 的 version，对照远端正式 `vX.Y.Z` tag：
   - 用户指定了版本，使用该版本；应是未占用且高于现有正式版本的有效 SemVer。
   - 未指定且候选 version 已高于最新正式版，采用候选 version。
   - 候选版本未递增或与用户版本不一致，说明冲突并提出版本更新 PR。未获具体版本时建议下一 patch；明显的大功能版本说明可选 minor，不自行假定 breaking major。
   - 版本文件修改必须先经 PR 合并；不能在功能分支打 tag 代替 main 发布，也不能忽略版本不一致。版本准备 PR 创建后应附加到当前聊天。
4. tag 已存在时读取其 peeled commit：若是同一目标且此前已发布，报告现状，按需查看既有构建，避免重复发布；若指向不同提交，停止，不能移动或删除已发布 tag。

## 验证与发布

- 检查目标 PR 的验证结果，确保对应发布内容的 static-check、测试、构建已通过。不能把功能分支旧 SHA 的结果直接当作不同 main SHA 已验证；确需本地验证时用临时隔离 checkout 并遵守项目 worktree 规范，不影响当前工作区。准备 Nuxt 后运行 `pnpm static-check`、`pnpm test`、`pnpm build`。失败先处理，不带失败结果发布。
- 推送前在进度消息明确版本、完整目标 SHA、目标 PR 和本次将更新镜像 latest；已有明确“发布”授权且目标无歧义时继续执行。
- 使用目标 SHA 创建中文说明的 annotated tag，只推送这个 tag。以下变量应替换为核验后的具体值，不能照抄占位符：

  ```bash
  git tag -a "$release_tag" "$release_sha" -m "发布 $release_tag"
  git push origin "refs/tags/$release_tag"
  ```

- 创建 tag 前再核对远端 main，若发生变化，不悄悄更换已验证的 SHA；重新确定发布范围。推送失败先检查远端 tag 是否已创建，避免重复操作。
- 不顺手创建 GitHub Release、合并 PR、同步 sit、操作生产数据库或部署服务器；这些不是当前 tag 发布机制的必要步骤。用户另有明确要求时执行相应工作。

## 跟进结果与失败处理

1. 通过 GitHub 工具或已登录的 `gh` 查找该 tag 和 SHA 对应的 `docker-push-ghcr.yml` run，不能把其他版本或手动运行的结果当作本次结果。间隔检查，持续给出有意义的进度，避免高频轮询。
2. 确认构建和双仓库推送步骤成功，记录 run 链接及可取得的镜像 digest。若工具条件允许，对两个仓库的 `X.Y.Z` 标签读取 manifest/digest 验证；无权限时明确未做独立仓库验证。
3. 构建失败时读取失败日志，说明失败阶段。临时网络/runner 故障可重跑原 run 一次；重复失败、代码问题或缺少 secret 时停止并报告。不能删除或移动 tag，也不能用手动 workflow_dispatch 盲目重发，因为当前手动分支运行仍会更新 latest。
4. 生产服务器若需拉取镜像、重启容器或另有自动更新机制，先查找已有明确配置；缺少实际入口时报告“镜像已发布，服务器更新尚未验证”，询问部署入口。不得凭文档中的云服务器描述猜测 SSH 主机、容器名或运行参数。
5. 交付说明版本、目标 SHA、镜像地址与版本标签、工作流链接和实际状态。只有验证了生产部署和站点后，才可声称“已上线”。
