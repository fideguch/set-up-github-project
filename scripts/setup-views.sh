#!/bin/bash
# 5ビュー作成スクリプト
# Usage: ./scripts/setup-views.sh <OWNER> <PROJECT_NUMBER>

set -euo pipefail

OWNER="${1:?Usage: $0 <OWNER> <PROJECT_NUMBER>}"
NUMBER="${2:?Usage: $0 <OWNER> <PROJECT_NUMBER>}"

echo "=== 5ビュー作成: Project #$NUMBER ==="

# プロジェクトID取得
echo "プロジェクトID取得中..."
PROJECT_ID=$(gh api graphql -f query='
  query($login: String!, $number: Int!) {
    user(login: $login) {
      projectV2(number: $number) { id }
    }
  }' -f login="$OWNER" -F number="$NUMBER" --jq '.data.user.projectV2.id')

if [ -z "$PROJECT_ID" ]; then
  echo "エラー: プロジェクトIDを取得できませんでした"
  echo "OWNER=$OWNER, NUMBER=$NUMBER を確認してください"
  exit 1
fi
echo "Project ID: $PROJECT_ID"

echo ""
echo "[1/5] Product Backlog (Board)..."
gh api graphql -f query='
  mutation($pid: ID!) {
    createProjectV2View(input: { projectId: $pid, name: "Product Backlog", layout: BOARD_LAYOUT }) {
      projectV2View { id name }
    }
  }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

echo "[2/5] Sprint Board (Board)..."
gh api graphql -f query='
  mutation($pid: ID!) {
    createProjectV2View(input: { projectId: $pid, name: "Sprint Board", layout: BOARD_LAYOUT }) {
      projectV2View { id name }
    }
  }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

echo "[3/5] Sprint Table (Table)..."
gh api graphql -f query='
  mutation($pid: ID!) {
    createProjectV2View(input: { projectId: $pid, name: "Sprint Table", layout: TABLE_LAYOUT }) {
      projectV2View { id name }
    }
  }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

echo "[4/5] Roadmap (Timeline)..."
gh api graphql -f query='
  mutation($pid: ID!) {
    createProjectV2View(input: { projectId: $pid, name: "Roadmap", layout: ROADMAP_LAYOUT }) {
      projectV2View { id name }
    }
  }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

echo "[5/5] My Items (Table)..."
gh api graphql -f query='
  mutation($pid: ID!) {
    createProjectV2View(input: { projectId: $pid, name: "My Items", layout: TABLE_LAYOUT }) {
      projectV2View { id name }
    }
  }' -f pid="$PROJECT_ID" --jq '.data.createProjectV2View.projectV2View.name' 2>/dev/null || echo "  → 既に存在またはエラー"

echo ""
echo "=== 完了 ==="
echo ""
echo "【手動設定が必要な項目】各ビューのフィルタ・ソート:"
echo "  Product Backlog: フィルタ is:open no:parent-issue / ソート Priority昇順"
echo "  Sprint Board:    フィルタ sprint:@current"
echo "  Sprint Table:    フィルタ sprint:@current / グループ Assignee / ソート Priority昇順"
echo "  Roadmap:         フィルタ no:parent-issue"
echo "  My Items:        フィルタ assignee:@me is:open / グループ Status / ソート Priority昇順"
