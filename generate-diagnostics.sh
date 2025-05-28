#!/bin/bash

# README.mdファイルのパス
README_FILE="README.md"

# READMEファイルの作成/更新
cat > "$README_FILE" << EOF
# TypeScript Compilerの比較

## TypeScript Compiler (tsc) Extended Diagnostics

\`\`\`
EOF

# tsc
echo "TypeScript Compiler (tsc) の拡張診断を実行中..."
npx tsc -p . --extendedDiagnostics >> "$README_FILE" 2>&1

# tsgoセクションを追加
cat >> "$README_FILE" << EOF
\`\`\`

## TSGo Extended Diagnostics

\`\`\`
EOF

# tsgo
echo "TSGo の拡張診断を実行中..."
npx tsgo -p . --extendedDiagnostics >> "$README_FILE" 2>&1

# コードブロックを閉じる
cat >> "$README_FILE" << EOF
\`\`\`
EOF
