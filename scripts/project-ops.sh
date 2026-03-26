#!/bin/bash
# プロジェクト運用操作スクリプト
# Usage: ./scripts/project-ops.sh <OWNER> <PROJECT_NUMBER> <COMMAND> [OPTIONS]
#
# Commands:
#   add-issue <REPO> <ISSUE_NUMBER>       — Issue をプロジェクトに追加
#   add-pr <REPO> <PR_NUMBER>             — PR をプロジェクトに追加
#   move <ITEM_ID> <STATUS_NAME>          — アイテムのステータスを変更
#   set-priority <ITEM_ID> <P0-P4>        — Priority を設定
#   list-items                            — プロジェクトアイテム一覧
#   list-fields                           — フィールド一覧（ID確認用）

set -euo pipefail

OWNER="${1:?Usage: $0 <OWNER> <PROJECT_NUMBER> <COMMAND> [OPTIONS]}"
NUMBER="${2:?Usage: $0 <OWNER> <PROJECT_NUMBER> <COMMAND> [OPTIONS]}"
COMMAND="${3:?Usage: $0 <OWNER> <PROJECT_NUMBER> <COMMAND> [OPTIONS]}"
shift 3

# プロジェクトID取得
get_project_id() {
  gh api graphql -f query='
    query($login: String!, $number: Int!) {
      user(login: $login) {
        projectV2(number: $number) { id }
      }
    }' -f login="$OWNER" -F number="$NUMBER" --jq '.data.user.projectV2.id'
}

# フィールド情報取得
get_fields() {
  local project_id="$1"
  gh api graphql -f query='
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 50) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id name options { id name }
              }
              ... on ProjectV2Field {
                id name dataType
              }
              ... on ProjectV2IterationField {
                id name
              }
            }
          }
        }
      }
    }' -f projectId="$project_id"
}

# Issue/PR をプロジェクトに追加
cmd_add_item() {
  local repo="$1"
  local item_number="$2"
  local item_type="${3:-issue}" # issue or pr

  local project_id
  project_id=$(get_project_id)

  # ノードIDを取得
  local node_id
  if [ "$item_type" = "pr" ]; then
    node_id=$(gh api "repos/$repo/pulls/$item_number" --jq '.node_id')
  else
    node_id=$(gh api "repos/$repo/issues/$item_number" --jq '.node_id')
  fi

  if [ -z "$node_id" ]; then
    echo "エラー: #$item_number が見つかりません"
    exit 1
  fi

  # プロジェクトに追加
  local result
  result=$(gh api graphql -f query='
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }' -f projectId="$project_id" -f contentId="$node_id" --jq '.data.addProjectV2ItemById.item.id')

  echo "追加完了: $repo#$item_number → Project #$NUMBER"
  echo "Item ID: $result"
}

# ステータス変更
cmd_move() {
  local item_id="$1"
  local status_name="$2"

  local project_id
  project_id=$(get_project_id)

  # Status フィールドとオプションを取得
  local field_data
  field_data=$(get_fields "$project_id")

  local status_field_id
  status_field_id=$(echo "$field_data" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for f in data['data']['node']['fields']['nodes']:
    if f and f.get('name') == 'Status' and f.get('options'):
        print(f['id'])
        break
" 2>/dev/null)

  local option_id
  option_id=$(echo "$field_data" | python3 -c "
import json, sys
target = '$status_name'
data = json.load(sys.stdin)
for f in data['data']['node']['fields']['nodes']:
    if f and f.get('name') == 'Status' and f.get('options'):
        for o in f['options']:
            if o['name'] == target:
                print(o['id'])
                break
        break
" 2>/dev/null)

  if [ -z "$option_id" ]; then
    echo "エラー: ステータス '$status_name' が見つかりません"
    echo "利用可能なステータス:"
    echo "$field_data" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for f in data['data']['node']['fields']['nodes']:
    if f and f.get('name') == 'Status' and f.get('options'):
        for o in f['options']:
            print(f'  - {o[\"name\"]}')
        break
" 2>/dev/null
    exit 1
  fi

  gh api graphql -f query='
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }' -f projectId="$project_id" -f itemId="$item_id" -f fieldId="$status_field_id" -f optionId="$option_id" >/dev/null

  echo "ステータス変更完了: $item_id → $status_name"
}

# Priority 設定
cmd_set_priority() {
  local item_id="$1"
  local priority="$2"

  local project_id
  project_id=$(get_project_id)

  local field_data
  field_data=$(get_fields "$project_id")

  local priority_field_id
  priority_field_id=$(echo "$field_data" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for f in data['data']['node']['fields']['nodes']:
    if f and f.get('name') == 'Priority' and f.get('options'):
        print(f['id'])
        break
" 2>/dev/null)

  local option_id
  option_id=$(echo "$field_data" | python3 -c "
import json, sys
target = '$priority'
data = json.load(sys.stdin)
for f in data['data']['node']['fields']['nodes']:
    if f and f.get('name') == 'Priority' and f.get('options'):
        for o in f['options']:
            if target in o['name']:
                print(o['id'])
                break
        break
" 2>/dev/null)

  if [ -z "$option_id" ]; then
    echo "エラー: Priority '$priority' が見つかりません"
    exit 1
  fi

  gh api graphql -f query='
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }' -f projectId="$project_id" -f itemId="$item_id" -f fieldId="$priority_field_id" -f optionId="$option_id" >/dev/null

  echo "Priority 設定完了: $item_id → $priority"
}

# アイテム一覧
cmd_list_items() {
  local project_id
  project_id=$(get_project_id)

  gh api graphql -f query='
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 100) {
            nodes {
              id
              content {
                ... on Issue { number title state }
                ... on PullRequest { number title state }
              }
              fieldValues(first: 10) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    field { ... on ProjectV2SingleSelectField { name } }
                    name
                  }
                }
              }
            }
          }
        }
      }
    }' -f projectId="$project_id" | python3 -c "
import json, sys
data = json.load(sys.stdin)
items = data['data']['node']['items']['nodes']
print(f'Project #$NUMBER — {len(items)} items')
print(f'{\"ID\":<50} {\"#\":>5}  {\"Status\":<15} {\"Title\"}')
print('-' * 100)
for item in items:
    content = item.get('content') or {}
    number = content.get('number', '-')
    title = content.get('title', '(Draft)')
    status = ''
    for fv in item.get('fieldValues', {}).get('nodes', []):
        if fv and fv.get('field', {}).get('name') == 'Status':
            status = fv.get('name', '')
    print(f'{item[\"id\"]:<50} {str(number):>5}  {status:<15} {title[:40]}')
" 2>/dev/null
}

# フィールド一覧
cmd_list_fields() {
  local project_id
  project_id=$(get_project_id)

  get_fields "$project_id" | python3 -c "
import json, sys
data = json.load(sys.stdin)
fields = data['data']['node']['fields']['nodes']
print(f'Project Fields:')
for f in fields:
    if not f: continue
    name = f.get('name', '?')
    fid = f.get('id', '?')
    options = f.get('options', [])
    dtype = f.get('dataType', 'SELECT' if options else '?')
    print(f'  {name:<20} {dtype:<15} {fid}')
    for o in options[:5]:
        print(f'    - {o[\"name\"]:<30} {o[\"id\"]}')
    if len(options) > 5:
        print(f'    ... and {len(options) - 5} more')
" 2>/dev/null
}

# コマンドディスパッチ
case "$COMMAND" in
  add-issue)
    ITEM_REPO="${1:?Usage: $0 <OWNER> <NUMBER> add-issue <REPO> <ISSUE_NUMBER>}"
    ITEM_NUMBER="${2:?Usage: $0 <OWNER> <NUMBER> add-issue <REPO> <ISSUE_NUMBER>}"
    cmd_add_item "$ITEM_REPO" "$ITEM_NUMBER" "issue"
    ;;
  add-pr)
    ITEM_REPO="${1:?Usage: $0 <OWNER> <NUMBER> add-pr <REPO> <PR_NUMBER>}"
    ITEM_NUMBER="${2:?Usage: $0 <OWNER> <NUMBER> add-pr <REPO> <PR_NUMBER>}"
    cmd_add_item "$ITEM_REPO" "$ITEM_NUMBER" "pr"
    ;;
  move)
    ITEM_ID="${1:?Usage: $0 <OWNER> <NUMBER> move <ITEM_ID> <STATUS_NAME>}"
    STATUS_NAME="${2:?Usage: $0 <OWNER> <NUMBER> move <ITEM_ID> <STATUS_NAME>}"
    cmd_move "$ITEM_ID" "$STATUS_NAME"
    ;;
  set-priority)
    ITEM_ID="${1:?Usage: $0 <OWNER> <NUMBER> set-priority <ITEM_ID> <P0-P4>}"
    PRIORITY="${2:?Usage: $0 <OWNER> <NUMBER> set-priority <ITEM_ID> <P0-P4>}"
    cmd_set_priority "$ITEM_ID" "$PRIORITY"
    ;;
  list-items)
    cmd_list_items
    ;;
  list-fields)
    cmd_list_fields
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo ""
    echo "Usage: $0 <OWNER> <PROJECT_NUMBER> <COMMAND> [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  add-issue <REPO> <ISSUE_NUMBER>    Add an issue to the project"
    echo "  add-pr <REPO> <PR_NUMBER>          Add a PR to the project"
    echo "  move <ITEM_ID> <STATUS_NAME>       Change item status"
    echo "  set-priority <ITEM_ID> <P0-P4>     Set item priority"
    echo "  list-items                         List all project items"
    echo "  list-fields                        List all fields and option IDs"
    exit 1
    ;;
esac
