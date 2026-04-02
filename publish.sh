#!/bin/bash

# ================================
# Scientific Color Lab 发布脚本
# ================================

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ 请提供版本号，例如: ./publish.sh v40.0"
  exit 1
fi

echo "================================"
echo " Publishing Scientific Color Lab"
echo " Version: $VERSION"
echo "================================"

# 确保在 main 分支
git checkout main || exit 1

# 检查状态
git status

# 提交代码（如果有改动）
git add .
git commit -m "Release $VERSION" || echo "⚠️ No changes to commit"

# 推送主分支（失败就退出）
git push origin main || exit 1

# 删除本地同名标签（如果存在）
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "⚠️ 本地标签 $VERSION 已存在，删除..."
  git tag -d "$VERSION"
fi

# 删除远端同名标签（如果存在）
git push origin ":refs/tags/$VERSION" 2>/dev/null || true

# 创建新标签
git tag -a "$VERSION" -m "Scientific Color Lab $VERSION release" || exit 1

# 推送标签
git push origin "$VERSION" || exit 1

echo "================================"
echo "✅ $VERSION 发布成功"
echo "================================"