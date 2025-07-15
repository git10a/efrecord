#!/bin/bash

# 設定ファイルのパス
RULES_FILE="/Users/hirachan/1_Projects/evlibrary/.claude/hooks/rules/hook_pre_commands_rules.json"

# 入力を読み込む
INPUT=$(cat)

# コマンドを抽出（簡易的な方法）
COMMAND=$(echo "$INPUT" | jq -r '.command' 2>/dev/null || echo "$INPUT")

# ルールファイルが存在しない場合は終了
if [ ! -f "$RULES_FILE" ]; then
    echo "$INPUT"
    exit 0
fi

# 各ルールをチェック
while IFS= read -r rule; do
    # ルール名を取得
    rule_name=$(echo "$rule" | jq -r 'keys[0]')
    
    # コマンドとメッセージを取得
    commands=$(echo "$rule" | jq -r --arg name "$rule_name" '.[$name].commands[]')
    message=$(echo "$rule" | jq -r --arg name "$rule_name" '.[$name].message')
    
    # 各コマンドをチェック
    while IFS= read -r cmd; do
        if echo "$COMMAND" | grep -E "(^|[[:space:]])$cmd([[:space:]]|$)" > /dev/null; then
            echo "❌ コマンド使用禁止: $rule_name"
            echo "📝 メッセージ: $message"
            echo "🚫 検出されたコマンド: $cmd"
            exit 1
        fi
    done <<< "$commands"
done < <(jq -c 'to_entries[]' "$RULES_FILE")

# 問題がなければ入力をそのまま出力
echo "$INPUT"