#!/bin/bash

# =============================================================================
# 本地部署脚本：用于部署 longlian-sit 应用到测试服务器
# 对应 GitHub Actions 工作流：Deploy loc-sit site
# 使用方式：
#   1. 配置 .env.build.sit 文件（见下方示例）
#   2. chmod +x deploy-sit.sh
#   3. ./deploy-sit.sh
# =============================================================================

# -------------------------------
# 读取环境变量（推荐使用 .env.build.sit 文件）
# -------------------------------
cd "$(dirname "$0")/.."

ENV_FILE=".env.sit.build"
if [ -f "$ENV_FILE" ]; then
    echo "加载环境变量: $ENV_FILE"
    export $(cat "$ENV_FILE" | grep -v '^#' | grep -v '^$' | xargs)
else
    echo "警告: 未找到 $ENV_FILE，将使用环境变量或提示输入"
fi

# -------------------------------
# 检查必要环境变量
# -------------------------------

required_vars=(
    "TCR_DOCKER_URL"
    "TCR_IMAGE_URL"
    "TCR_DOCKER_USERNAME"
    "TCR_DOCKER_PASSWORD"
    "SERVER_USERNAME"
    "SERVER_HOST"
    "APP_NAME"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        read -p "请输入 $var: " input
        export "$var=$input"
    fi
done

# -------------------------------
# 获取 Git Commit SHA（作为镜像标签）
# -------------------------------

GIT_SHA=$(git rev-parse HEAD)
echo "当前 Commit SHA: $GIT_SHA"

# -------------------------------
# 构建 Docker 镜像
# -------------------------------

echo "正在构建 Docker 镜像..."
docker build \
  -t "${TCR_IMAGE_URL}:${GIT_SHA}" \
  -t "${TCR_IMAGE_URL}:latest" \
  .

if [ $? -ne 0 ]; then
  echo "❌ 构建失败"
  exit 1
fi

echo "✅ 构建完成"

# -------------------------------
# 登录腾讯云容器镜像服务（TCR）
# -------------------------------

echo "正在登录镜像仓库: $TCR_DOCKER_URL"
docker login -u "$TCR_DOCKER_USERNAME" -p "$TCR_DOCKER_PASSWORD" "$TCR_DOCKER_URL"

if [ $? -ne 0 ]; then
  echo "❌ 登录镜像仓库失败"
  exit 1
fi

echo "✅ 登录成功"

# -------------------------------
# 推送镜像
# -------------------------------

echo "正在推送镜像..."
docker push "${TCR_IMAGE_URL}:${GIT_SHA}"
docker push "${TCR_IMAGE_URL}:latest"

if [ $? -ne 0 ]; then
  echo "❌ 推送失败"
  exit 1
fi

echo "✅ 镜像推送完成"

# -------------------------------
# 部署到远程服务器
# -------------------------------

echo "正在部署到服务器: $SERVER_HOST"

# 使用 SSH 执行远程命令
ssh -i ~/.ssh/longlian "$SERVER_USERNAME@$SERVER_HOST" << EOF
echo "👋 登录成功，开始部署..."

# 切换到 root（如果需要 sudo）
sudo su

# 登录镜像仓库
docker login -u "$TCR_DOCKER_USERNAME" -p "$TCR_DOCKER_PASSWORD" "$TCR_DOCKER_URL"

# 拉取最新镜像
docker pull "${TCR_IMAGE_URL}:latest"

# 停止并删除旧容器
docker stop "$APP_NAME" || true
docker rm "$APP_NAME" || true

# 启动新容器
docker run \
  --network 1panel-network \
  --env-file /home/loc/.env.sit.deploy \
  -d \
  --name "$APP_NAME" \
  -p 25923:3000 \
  "${TCR_IMAGE_URL}:latest"

echo "✅ 部署完成！应用运行在 25923 端口"
EOF

if [ $? -ne 0 ]; then
  echo "❌ 部署失败"
  exit 1
fi

echo "🎉 部署成功！"
