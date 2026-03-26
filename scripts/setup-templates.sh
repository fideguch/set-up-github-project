#!/bin/bash
# テンプレート＋ワークフロー自動配置スクリプト
# Usage: ./scripts/setup-templates.sh <OWNER/REPO> <PROJECT_NUMBER>
#
# ターゲットリポジトリを clone し、Issue/PR テンプレートと
# GitHub Actions ワークフローを自動配置して push する。

set -euo pipefail

REPO="${1:?Usage: $0 <OWNER/REPO> <PROJECT_NUMBER>}"
NUMBER="${2:?Usage: $0 <OWNER/REPO> <PROJECT_NUMBER>}"
OWNER="${REPO%%/*}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE_DIR="$(dirname "$SCRIPT_DIR")/templates"

echo "=== テンプレート＆ワークフロー自動配置: $REPO ==="

# プロジェクトID取得（ワークフロー内のプレースホルダー置換用）
echo "プロジェクトID取得中..."
PROJECT_ID=$(gh api graphql -f query='
  query($login: String!, $number: Int!) {
    user(login: $login) {
      projectV2(number: $number) { id }
    }
  }' -f login="$OWNER" -F number="$NUMBER" --jq '.data.user.projectV2.id' 2>/dev/null || echo "")

if [ -z "$PROJECT_ID" ]; then
  echo "警告: プロジェクトIDを取得できませんでした。ワークフロー内のプレースホルダーは手動置換が必要です。"
fi

# ターゲットリポジトリを一時ディレクトリに clone
TARGET_DIR=$(mktemp -d)
echo "リポジトリ clone 中... → $TARGET_DIR"
gh repo clone "$REPO" "$TARGET_DIR" -- --depth 1 2>/dev/null

# Issue テンプレート配置
echo ""
echo "[1/4] Issue テンプレート配置..."
mkdir -p "$TARGET_DIR/.github/ISSUE_TEMPLATE"
cp "$TEMPLATE_DIR/ISSUE_TEMPLATE/"*.yml "$TARGET_DIR/.github/ISSUE_TEMPLATE/"
echo "  bug_report.yml, feature_request.yml"

# PR テンプレート配置
echo "[2/4] PR テンプレート配置..."
cp "$TEMPLATE_DIR/pull_request_template.md" "$TARGET_DIR/.github/"
echo "  pull_request_template.md"

# ワークフロー配置（プレースホルダー置換）
echo "[3/4] GitHub Actions ワークフロー配置..."
mkdir -p "$TARGET_DIR/.github/workflows"
for wf in "$TEMPLATE_DIR/workflows/"*.yml; do
  WF_NAME=$(basename "$wf")
  if [ -n "$PROJECT_ID" ]; then
    sed \
      -e "s|'__PROJECT_ID__'|'$PROJECT_ID'|g" \
      -e "s|'__OWNER__'|'$OWNER'|g" \
      -e "s|'__PROJECT_NUMBER__'|$NUMBER|g" \
      "$wf" > "$TARGET_DIR/.github/workflows/$WF_NAME"
  else
    cp "$wf" "$TARGET_DIR/.github/workflows/$WF_NAME"
  fi
  echo "  $WF_NAME"
done

# labeler.yml 配置
echo "[4/4] labeler.yml 配置..."
LABELER_SRC="$(dirname "$SCRIPT_DIR")/.github/labeler.yml"
if [ -f "$LABELER_SRC" ]; then
  cp "$LABELER_SRC" "$TARGET_DIR/.github/labeler.yml"
  echo "  labeler.yml"
else
  echo "  labeler.yml が見つかりません（スキップ）"
fi

# コミット＆プッシュ
echo ""
echo "変更をコミット＆プッシュ中..."
cd "$TARGET_DIR"
git add .github/
if git diff --cached --quiet; then
  echo "変更なし（既にテンプレートが配置済み）"
else
  git commit -m "feat: add GitHub Projects V2 templates and workflows

- Issue templates (bug report, feature request)
- PR template
- GitHub Actions workflows (CI, project automation, PR labeler, stale detection, roadmap date sync)
- Labeler configuration"
  git push
  echo "プッシュ完了"
fi

# クリーンアップ
rm -rf "$TARGET_DIR"

echo ""
echo "=== テンプレート配置完了 ==="
if [ -z "$PROJECT_ID" ]; then
  echo ""
  echo "【手動作業】ワークフロー内の以下のプレースホルダーを置換してください:"
  echo "  __PROJECT_ID__  → プロジェクトの Node ID"
  echo "  __OWNER__       → リポジトリオーナー"
  echo "  __PROJECT_NUMBER__ → プロジェクト番号"
fi
