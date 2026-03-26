#!/bin/bash
# 全環境一括構築スクリプト
# Usage: ./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER>
#
# 6フェーズで GitHub Projects V2 の開発環境を一括構築する。
# Phase 1-3 は gh CLI + GraphQL API で自動実行。
# Phase 4-5 はテンプレート自動配置。
# Phase 6 は手動設定が必要な項目のチェックリスト。

set -euo pipefail

REPO="${1:?Usage: $0 <OWNER/REPO> <PROJECT_NUMBER>}"
NUMBER="${2:?Usage: $0 <OWNER/REPO> <PROJECT_NUMBER>}"
OWNER="${REPO%%/*}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  GitHub Projects V2 環境一括構築"
echo "============================================"
echo "リポジトリ: $REPO"
echo "プロジェクト: #$NUMBER"
echo "オーナー: $OWNER"
echo ""

# Phase 0: 認証確認
echo "=== Phase 0: 認証確認 ==="
gh auth status
echo ""

# Phase 1: カスタムフィールド
echo "=== Phase 1: カスタムフィールド作成 ==="
"$SCRIPT_DIR/setup-fields.sh" "$OWNER" "$NUMBER"
echo ""

# Phase 1.5: Status 14オプション
echo "=== Phase 1.5: Status 14オプション設定 ==="
"$SCRIPT_DIR/setup-status.sh" "$OWNER" "$NUMBER"
echo ""

# Phase 2: ラベル
echo "=== Phase 2: ラベル一括作成 ==="
"$SCRIPT_DIR/setup-labels.sh" "$REPO"
echo ""

# Phase 3: ビュー
echo "=== Phase 3: ビュー作成 ==="
"$SCRIPT_DIR/setup-views.sh" "$OWNER" "$NUMBER"
echo ""

# Phase 4-5: テンプレート＆ワークフロー自動配置
echo "=== Phase 4-5: テンプレート＆ワークフロー自動配置 ==="
"$SCRIPT_DIR/setup-templates.sh" "$REPO" "$NUMBER"
echo ""

echo "============================================"
echo "  構築完了！"
echo "============================================"
echo ""
echo "【自動設定済み】"
echo "  [x] カスタムフィールド (Priority, Estimate, Target)"
echo "  [x] Status 14オプション設定を試行"
echo "  [x] 13ラベル作成"
echo "  [x] 5ビュー作成"
echo "  [x] テンプレート配置 (Issue/PR)"
echo "  [x] GitHub Actions ワークフロー配置"
echo ""
echo "【手動設定チェックリスト】"
echo "  □ Sprint (Iteration) フィールドを作成（GitHub UI → Project Settings → 1週間サイクル）"
echo "  □ 各ビューの表示フィールド・フィルタ・ソート・グループを設定（setup-views.sh の出力参照）"
echo "  □ Built-in Workflows を有効化（Auto-add, Item closed, PR merged, Item reopened, Auto-archive）"
echo "  □ PROJECT_TOKEN シークレットを設定（Repository Settings → Secrets → Actions）"
echo ""
echo "【運用コマンド】"
echo "  ./scripts/project-ops.sh $OWNER $NUMBER add-issue <NUMBER>   # Issue をプロジェクトに追加"
echo "  ./scripts/project-ops.sh $OWNER $NUMBER add-pr <NUMBER>      # PR をプロジェクトに追加"
echo "  ./scripts/project-ops.sh $OWNER $NUMBER move <ITEM> <STATUS> # ステータス変更"
echo "  ./scripts/project-ops.sh $OWNER $NUMBER list-items           # アイテム一覧"
