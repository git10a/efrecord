#!/bin/bash

# 設定ファイルのパス
RULES_FILE="/Users/hirachan/1_Projects/evlibrary/.claude/hooks/rules/hook_stop_words_rules.json"

# 入力を読み込む
INPUT=$(cat)

# ルールファイルが存在しない場合は終了
if [ ! -f "$RULES_FILE" ]; then
    echo "$INPUT"
    exit 0
fi

# 各ルールをチェック
while IFS= read -r rule; do
    # ルール名を取得
    rule_name=$(echo "$rule" | jq -r 'keys[0]')
    
    # キーワードとメッセージを取得
    keywords=$(echo "$rule" | jq -r --arg name "$rule_name" '.[$name].keywords[]')
    message=$(echo "$rule" | jq -r --arg name "$rule_name" '.[$name].message')
    
    # 各キーワードをチェック
    while IFS= read -r keyword; do
        if echo "$INPUT" | grep -qi "$keyword"; then
            echo "❌ ルール違反: $rule_name"
            echo "📝 メッセージ: $message"
            echo "🚫 検出されたキーワード: $keyword"
            exit 1
        fi
    done <<< "$keywords"
done < <(jq -c 'to_entries[]' "$RULES_FILE")

# 問題がなければ入力をそのまま出力
echo "$INPUT"