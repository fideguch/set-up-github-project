# Handoff: GitHub Project Manager v4.0 実装完了

## 現在の状態

- **リポジトリ**: https://github.com/fideguch/my_pm_tools
- **リモート**: `git@github.com:fideguch/my_pm_tools.git` (SSH)
- **ブランチ**: main
- **テスト**: 339+ passed
- **品質**: lint + typecheck + format:check 全パス
- **ビルド**: `npm run build` 成功

## 今回のセッション: v4.0 実装

### Phase 1: SKILL.md トリガー拡張

- triggers: 15 → 37（+22）
- `scenarios:` 5件、`theme:` フィールド追加
- `intent:` に英語ガイダンス、`best_for:` に編集機能反映
- カテゴリ別コメント付き（日本語/英語/移行/ヘルプ/システム）

### Phase 2: Issue 編集 + 既存ツール改善

#### 新規ファイル (8)

| ファイル                        | 内容                                     |
| ------------------------------- | ---------------------------------------- |
| `src/utils/gh-cli.ts`           | GhRunner 型 + createGhRunner()           |
| `src/utils/status-alias.ts`     | ステータス別名解決（完全→別名→部分一致） |
| `src/tools/get-issue.ts`        | GraphQL で Issue 詳細取得                |
| `src/tools/edit-issue.ts`       | gh CLI で Issue タイトル・本文編集       |
| `src/tools/manage-labels.ts`    | gh CLI でラベル追加・削除                |
| `src/tools/manage-assignees.ts` | gh CLI でアサイン追加・削除              |
| `src/tools/set-issue-state.ts`  | gh CLI で Issue クローズ・リオープン     |
| `tests/scenarios/fixtures/`     | mock-gql.ts, mock-gh-cli.ts              |

#### 変更ファイル (6)

| ファイル                   | 変更内容                                    |
| -------------------------- | ------------------------------------------- |
| `src/tools/index.ts`       | registerTools(server, gql, gh?) — 11 ツール |
| `src/server.ts`            | createServer(gql, gh?) — gh オプショナル    |
| `src/schemas/index.ts`     | repoParam 抽出 + 5 新規スキーマ             |
| `src/types/index.ts`       | IssueDetail インターフェース追加            |
| `src/graphql/queries.ts`   | GET_ISSUE_BY_NUMBER + ページネーション      |
| `src/tools/move-status.ts` | ステータス別名マッチ + summary レスポンス   |

### Phase 3: designs/ コンテキスト認識

- SKILL.md オンボーディングに designs/ 検出ステップ追加
- Issue 作成時に Req-ID 付与、ラベル/Priority 自動推定
- designs/ 不在時はスキップ（任意）

### Phase 4: シナリオテスト

5 シナリオ、25 テスト:

- `onboarding.spec.ts` — 新規/既存プロジェクトフロー (4)
- `daily-operations.spec.ts` — リスト/フィルタ/ステータス変更/別名 (6)
- `issue-editing.spec.ts` — get→edit→labels→assignees→close/reopen (6)
- `issue-identification.spec.ts` — キーワード検索→確認→編集 (5)
- `designs-awareness.spec.ts` — designs/ 検出・Req-ID・不在処理 (4)

### Phase 5: Five-File Sync & ドキュメント

- skill-structure.spec.ts: 6→11 ツール、utils 存在、新スキーマチェック
- README.md: MCP ツール表 6→11、ステータス別名説明
- ADR-008: gh CLI ハイブリッドアプローチ
- DECISION-LOG: P07-P11 を Implemented に更新

## メトリクス

| 指標           | v3.0.0  | v4.0        |
| -------------- | ------- | ----------- |
| テスト         | 293 件  | **339+ 件** |
| MCP ツール     | 6       | **11** (+5) |
| TypeScript src | ~800 行 | ~1,200 行   |
| ADR            | 7 件    | **8 件**    |
| triggers       | 15      | **37**      |

## 重要ファイル

| ファイル                    | 役割                                   |
| --------------------------- | -------------------------------------- |
| `src/tools/index.ts`        | ツール登録ハブ (11 ツール)             |
| `src/schemas/index.ts`      | Zod スキーマ (11 スキーマ + repoParam) |
| `src/types/index.ts`        | 型定義 (IssueDetail 追加)              |
| `src/utils/gh-cli.ts`       | gh CLI ラッパー (GhRunner)             |
| `src/utils/status-alias.ts` | ステータス別名解決                     |
| `src/graphql/queries.ts`    | GET_ISSUE_BY_NUMBER + ページネーション |
| `SKILL.md`                  | トリガー 37 + designs/ 連携            |

## 次のセッションでやること

- `npm run build` でビルド確認 → `git push`
- README.en.md のミラー更新
- docs/USAGE.md に Issue 編集操作ガイド追加
- CHANGELOG.md に v4.0 エントリ追加

## 将来検討（v4.0 スコープ外）

- Undo スタック → `gh issue reopen` で手動復元可能
- バッチ Import ツール → ユーザーが個別に Issue 化
- AI Issue 生成 → Claude 自体の責務
- 予測分析/バーンダウン → 個人チームに過剰
- Slack/Google 連携 → ADR-007 で v2 以降に延期済み
