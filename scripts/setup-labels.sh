#!/bin/bash
# ラベル13種一括作成スクリプト
# Usage: ./scripts/setup-labels.sh <OWNER/REPO>

set -euo pipefail

REPO="${1:?Usage: $0 <OWNER/REPO>}"

echo "=== ラベル一括作成: $REPO ==="

# Type ラベル
echo "[1/13] feature..."
gh label create "feature" --repo "$REPO" --color "0E8A16" --description "新機能追加" --force
echo "[2/13] bug..."
gh label create "bug" --repo "$REPO" --color "D73A4A" --description "バグ修正" --force
echo "[3/13] refine..."
gh label create "refine" --repo "$REPO" --color "FBCA04" --description "改善・リファクタリング" --force
echo "[4/13] infra..."
gh label create "infra" --repo "$REPO" --color "6F42C1" --description "インフラ・DevOps" --force
echo "[5/13] docs..."
gh label create "docs" --repo "$REPO" --color "0075CA" --description "ドキュメント" --force
echo "[6/13] research..."
gh label create "research" --repo "$REPO" --color "C5DEF5" --description "調査・技術検証" --force

# Area ラベル
echo "[7/13] frontend..."
gh label create "frontend" --repo "$REPO" --color "F9A825" --description "フロントエンド関連" --force
echo "[8/13] backend..."
gh label create "backend" --repo "$REPO" --color "795548" --description "バックエンド関連" --force
echo "[9/13] design..."
gh label create "design" --repo "$REPO" --color "E91E8F" --description "デザイン関連" --force
echo "[10/13] growth..."
gh label create "growth" --repo "$REPO" --color "2EA44F" --description "グロース施策" --force

# Ops ラベル
echo "[11/13] blocked..."
gh label create "blocked" --repo "$REPO" --color "000000" --description "ブロッカーあり" --force
echo "[12/13] needs-review..."
gh label create "needs-review" --repo "$REPO" --color "FEF2C0" --description "レビュー必要" --force
echo "[13/13] good-first-issue..."
gh label create "good-first-issue" --repo "$REPO" --color "7057FF" --description "初心者向け" --force

echo ""
echo "=== 完了: 13ラベルを作成しました ==="
gh label list --repo "$REPO"
