# GitHub Projects 環境一括構築 プレイブック

## メタデータ

- **マクロ**: `!setup_github_project`
- **トリガー**: 「GitHub Projectsの環境を構築したい」「プロジェクト環境をセットアップ」「!setup_github_project」
- **前提条件**: gh CLI認証済み、Classic PAT（`ghp_`）、スコープ `project,repo,read:org`

## 実行フロー

6フェーズで段階的に環境を構築します。各フェーズ完了後に確認を取ってから次へ進みます。

---

## Phase 1: カスタムフィールド作成

### 1.1 認証確認
```bash
gh auth status
```
`project` スコープがない場合:
```bash
gh auth refresh --scopes "project,repo,read:org"
```

### 1.2 プロジェクト情報取得
```bash
# ユーザーにリポジトリ（OWNER/REPO）とプロジェクト番号を確認
gh project list --owner "<OWNER>"
gh project view <NUMBER> --owner "<OWNER>"
```

### 1.3 Priority フィールド作成
```bash
gh project field-create <NUMBER> --owner "<OWNER>" --name "Priority" --data-type "SINGLE_SELECT" --single-select-options "P0 - 即日着手,P1 - 高 (1〜3営業日),P2 - 中 (スプリント内),P3 - 低 (時間あれば),P4 - 未定 (保留中)"
```

### 1.4 Estimate フィールド作成
```bash
gh project field-create <NUMBER> --owner "<OWNER>" --name "Estimate" --data-type "NUMBER"
```

### 1.5 Target フィールド作成
```bash
gh project field-create <NUMBER> --owner "<OWNER>" --name "Target" --data-type "TEXT"
```

### 1.6 Status オプション追加
GraphQL API でステータスフィールドのオプションを設定:

14ステータス（順序通り）:
1. Icebox
2. 進行待ち
3. 要件作成中
4. デザイン待ち
5. デザイン作成中
6. アサイン待ち
7. 開発待ち
8. 開発中
9. コードレビュー
10. テスト中
11. テスト落ち
12. リリース待ち
13. リリース済み
14. Done

**注意**: Status フィールドのオプション追加は GitHub UI または GraphQL mutation `updateProjectV2Field` で行う。gh CLI の `field-create` では既存の Status フィールドのオプション変更不可。

```bash
# プロジェクトIDとStatusフィールドIDを取得
gh api graphql -f query='
  query($number: Int!) {
    viewer {
      projectV2(number: $number) {
        id
        fields(first: 50) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options { id name }
            }
          }
        }
      }
    }
  }' -F number=<NUMBER>
```

### 1.7 Sprint（Iteration）フィールド
Sprint フィールドは gh CLI では直接作成不可。以下の方法で作成:
- **推奨**: GitHub UI → Project Settings → Custom fields → New field → Iteration → 1週間サイクル
- **代替**: GraphQL API の `createProjectV2IterationField` mutation

### 完了確認
- [ ] Priority (P0-P4) フィールドが存在する
- [ ] Estimate (Number) フィールドが存在する
- [ ] Target (Text) フィールドが存在する
- [ ] Status に14ステータスが設定されている
- [ ] Sprint (Iteration) フィールドが存在する

---

## Phase 2: ラベル一括作成

```bash
# スクリプトを使用（推奨）
./scripts/setup-labels.sh <OWNER/REPO>

# または手動で13ラベル作成
# Type ラベル
gh label create "feature" --repo <OWNER/REPO> --color "0E8A16" --description "新機能追加" --force
gh label create "bug" --repo <OWNER/REPO> --color "D73A4A" --description "バグ修正" --force
gh label create "refine" --repo <OWNER/REPO> --color "FBCA04" --description "改善・リファクタリング" --force
gh label create "infra" --repo <OWNER/REPO> --color "6F42C1" --description "インフラ・DevOps" --force
gh label create "docs" --repo <OWNER/REPO> --color "0075CA" --description "ドキュメント" --force
gh label create "research" --repo <OWNER/REPO> --color "C5DEF5" --description "調査・技術検証" --force

# Area ラベル
gh label create "frontend" --repo <OWNER/REPO> --color "F9A825" --description "フロントエンド関連" --force
gh label create "backend" --repo <OWNER/REPO> --color "795548" --description "バックエンド関連" --force
gh label create "design" --repo <OWNER/REPO> --color "E91E8F" --description "デザイン関連" --force
gh label create "growth" --repo <OWNER/REPO> --color "2EA44F" --description "グロース施策" --force

# Ops ラベル
gh label create "blocked" --repo <OWNER/REPO> --color "000000" --description "ブロッカーあり" --force
gh label create "needs-review" --repo <OWNER/REPO> --color "FEF2C0" --description "レビュー必要" --force
gh label create "good-first-issue" --repo <OWNER/REPO> --color "7057FF" --description "初心者向け" --force
```

### 完了確認
- [ ] 13ラベルすべてが作成されている
- [ ] 色コードとdescriptionが正しい

---

## Phase 3: ビュー作成

### 3.1 プロジェクトIDの取得
```bash
PROJECT_ID=$(gh api graphql -f query='query($number: Int!) { viewer { projectV2(number: $number) { id } } }' -F number=<NUMBER> --jq '.data.viewer.projectV2.id')
echo $PROJECT_ID
```

### 3.2 5ビュー作成
```bash
# Product Backlog (Board)
gh api graphql -f query='mutation($pid: ID!) { createProjectV2View(input: { projectId: $pid, name: "Product Backlog", layout: BOARD_LAYOUT }) { projectV2View { id name } } }' -f pid="$PROJECT_ID"

# Sprint Board (Board)
gh api graphql -f query='mutation($pid: ID!) { createProjectV2View(input: { projectId: $pid, name: "Sprint Board", layout: BOARD_LAYOUT }) { projectV2View { id name } } }' -f pid="$PROJECT_ID"

# Sprint Table (Table)
gh api graphql -f query='mutation($pid: ID!) { createProjectV2View(input: { projectId: $pid, name: "Sprint Table", layout: TABLE_LAYOUT }) { projectV2View { id name } } }' -f pid="$PROJECT_ID"

# Roadmap (Timeline)
gh api graphql -f query='mutation($pid: ID!) { createProjectV2View(input: { projectId: $pid, name: "Roadmap", layout: ROADMAP_LAYOUT }) { projectV2View { id name } } }' -f pid="$PROJECT_ID"

# My Items (Table)
gh api graphql -f query='mutation($pid: ID!) { createProjectV2View(input: { projectId: $pid, name: "My Items", layout: TABLE_LAYOUT }) { projectV2View { id name } } }' -f pid="$PROJECT_ID"
```

### 3.3 ビューのフィルタ・ソート設定
ビュー作成後、GitHub UI で以下を手動設定（GraphQL API では一部フィルタ設定が制限あり）:

| ビュー | フィルタ | ソート/グループ |
|--------|---------|----------------|
| Product Backlog | `is:open no:parent-issue` | Priority昇順 |
| Sprint Board | `sprint:@current` | — |
| Sprint Table | `sprint:@current` | Assigneeグループ, Priority昇順 |
| Roadmap | `no:parent-issue` | — |
| My Items | `assignee:@me is:open` | Statusグループ, Priority昇順 |

### 完了確認
- [ ] 5ビューが作成されている
- [ ] 各ビューのレイアウトが正しい（Board/Table/Roadmap）
- [ ] フィルタが設定されている

---

## Phase 4: テンプレート作成

ターゲットリポジトリに Issue テンプレートと PR テンプレートをコミットします。

### 4.1 Issue テンプレート（機能要望）
`templates/ISSUE_TEMPLATE/feature_request.yml` の内容をリポジトリの `.github/ISSUE_TEMPLATE/feature_request.yml` にコピー。

### 4.2 Issue テンプレート（バグ報告）
`templates/ISSUE_TEMPLATE/bug_report.yml` の内容をリポジトリの `.github/ISSUE_TEMPLATE/bug_report.yml` にコピー。

### 4.3 PR テンプレート
`templates/pull_request_template.md` の内容をリポジトリの `.github/pull_request_template.md` にコピー。

### 完了確認
- [ ] `.github/ISSUE_TEMPLATE/feature_request.yml` が存在する
- [ ] `.github/ISSUE_TEMPLATE/bug_report.yml` が存在する
- [ ] `.github/pull_request_template.md` が存在する

---

## Phase 5: 自動化設定

### 5.1 Built-in Workflows（GitHub UI で設定）
Project Settings → Workflows で以下を有効化:

1. **Auto-add to project** — リポジトリの Issue/PR を自動追加
2. **Item closed** — クローズ時に Status を「Done」に変更
3. **PR merged** — マージ時に Status を「Done」に変更
4. **Item reopened** — 再オープン時に Status を「進行待ち」に変更
5. **Auto-archive** — 14日以上前にクローズされたアイテムを自動アーカイブ

### 5.2 GitHub Actions ワークフロー
`templates/workflows/` の各ファイルをリポジトリの `.github/workflows/` にコピー:

- `ci.yml` — PR の品質チェック（lint → typecheck → test → build）
- `project-automation.yml` — PR↔Issue ステータス連動
- `pr-labeler.yml` — PR 自動ラベル付与
- `stale-detection.yml` — 滞留タスク検知（週次）

### 完了確認
- [ ] Built-in Workflows 5つが有効
- [ ] `.github/workflows/` に4ファイルが存在する

---

## Phase 6: ドキュメント・最終確認

### 6.1 プロジェクト README 更新
リポジトリの README にプロジェクト運用ルールを追記（オプション）。

### 6.2 最終チェックリスト

| # | 確認項目 | 状態 |
|---|---------|------|
| 1 | Status に14ステータスが設定されている | |
| 2 | Priority (P0-P4) フィールドが存在する | |
| 3 | Estimate (Number) フィールドが存在する | |
| 4 | Target (Text) フィールドが存在する | |
| 5 | Sprint (Iteration) フィールドが存在する | |
| 6 | 13ラベルが作成されている | |
| 7 | Product Backlog ビューが存在する | |
| 8 | Sprint Board ビューが存在する | |
| 9 | Sprint Table ビューが存在する | |
| 10 | Roadmap ビューが存在する | |
| 11 | My Items ビューが存在する | |
| 12 | Issue テンプレートが存在する | |
| 13 | PR テンプレートが存在する | |
| 14 | Built-in Workflows が有効 | |
