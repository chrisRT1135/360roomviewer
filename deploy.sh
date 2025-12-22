#!/bin/bash

# 360° Room Viewer - 一鍵部署腳本
# 使用方法: bash deploy.sh [your-github-username]

echo "🚀 360° Room Viewer 部署腳本"
echo "================================"

# 檢查參數
if [ -z "$1" ]; then
    echo "❌ 錯誤: 請提供你的 GitHub 用戶名"
    echo "使用方法: bash deploy.sh [your-github-username]"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="360-room-viewer"

echo ""
echo "📋 部署資訊:"
echo "   GitHub 用戶名: $GITHUB_USERNAME"
echo "   Repository: $REPO_NAME"
echo "   部署後網址: https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
echo ""

# 確認是否繼續
read -p "是否繼續部署? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消部署"
    exit 1
fi

echo ""
echo "📦 步驟 1: 檢查 Git 狀態..."
if [ -d ".git" ]; then
    echo "✅ Git repository 已存在"
else
    echo "⚠️  初始化 Git repository..."
    git init
    git add .
    git commit -m "Initial commit: 360° virtual room viewer"
fi

echo ""
echo "🔗 步驟 2: 設定遠端 repository..."
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo "✅ 遠端 repository 已設定"

echo ""
echo "📤 步驟 3: 推送到 GitHub..."
echo "⚠️  請確保你已經在 GitHub 上創建了 '$REPO_NAME' repository"
echo "   創建網址: https://github.com/new"
echo ""
read -p "已創建 repository? 按 Enter 繼續..."

git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 成功推送到 GitHub!"
    echo ""
    echo "🎯 步驟 4: 啟用 GitHub Pages"
    echo "   1. 前往: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/pages"
    echo "   2. Source: Deploy from a branch"
    echo "   3. Branch: main / (root)"
    echo "   4. 點擊 Save"
    echo ""
    echo "⏱️  等待 1-2 分鐘後訪問:"
    echo "   🌐 https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
    echo ""
    echo "✨ 部署完成!"
else
    echo ""
    echo "❌ 推送失敗!"
    echo ""
    echo "可能的原因:"
    echo "   1. Repository 尚未在 GitHub 上創建"
    echo "   2. 沒有設定 SSH 金鑰或 Personal Access Token"
    echo "   3. 網路連線問題"
    echo ""
    echo "💡 解決方案:"
    echo "   1. 確保已創建 repository: https://github.com/new"
    echo "   2. 如需使用 HTTPS，請設定 Personal Access Token"
    echo "   3. 或使用 SSH: git remote set-url origin git@github.com:$GITHUB_USERNAME/$REPO_NAME.git"
    exit 1
fi
