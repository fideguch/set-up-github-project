#!/bin/bash
# カスタムフィールド作成スクリプト
# Usage: ./scripts/setup-fields.sh <OWNER> <PROJECT_NUMBER>

set -euo pipefail

OWNER="${1:?Usage: $0 <OWNER> <PROJECT_NUMBER>}"
NUMBER="${2:?Usage: $0 <OWNER> <PROJECT_NUMBER>}"

echo "=== カスタムフィールド作成: Project #$NUMBER ==="

echo "[1/3] Priority (Single Select)..."
gh project field-create "$NUMBER" --owner "$OWNER" --name "Priority" --data-type "SINGLE_SELECT" --single-select-options "P0 - 即日着手,P1 - 高 (1〜3営業日),P2 - 中 (スプリント内),P3 - 低 (時間あれば),P4 - 未定 (保留中)" 2>/dev/null || echo "  → Priority フィールドは既に存在します（スキップ）"

echo "[2/3] Estimate (Number)..."
gh project field-create "$NUMBER" --owner "$OWNER" --name "Estimate" --data-type "NUMBER" 2>/dev/null || echo "  → Estimate フィールドは既に存在します（スキップ）"

echo "[3/3] Target (Text)..."
gh project field-create "$NUMBER" --owner "$OWNER" --name "Target" --data-type "TEXT" 2>/dev/null || echo "  → Target フィールドは既に存在します（スキップ）"

echo ""
echo "=== 完了 ==="
echo ""
echo "【手動設定が必要な項目】"
echo "1. Sprint (Iteration) フィールド: GitHub UI → Project Settings → Custom fields → New field → Iteration → 1週間サイクル"
echo "2. Status オプション: GitHub UI または GraphQL API で14ステータスを設定"
echo ""
echo "14ステータス（順序通りに設定）:"
echo "  Icebox, 進行待ち, 要件作成中, デザイン待ち, デザイン作成中,"
echo "  アサイン待ち, 開発待ち, 開発中, コードレビュー, テスト中,"
echo "  テスト落ち, リリース待ち, リリース済み, Done"
