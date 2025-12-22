#!/bin/bash

# Configuration
BACKUP_DIR="/Users/thomasleguendekergolan/Documents/1Granite DRC/nouvelle erp 2025/sauvegardes"
PROJECT_DIR="/Users/thomasleguendekergolan/Documents/1Granite DRC/nouvelle erp 2025/granite-erp"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
TARGET_DIR="$BACKUP_DIR/backup_$TIMESTAMP"

echo "🚀 Starting Full Backup..."
echo "📂 Backup Directory: $TARGET_DIR"

mkdir -p "$TARGET_DIR"

# 1. Database Backup (JSON)
echo "💾 Backing up Database..."
cd "$PROJECT_DIR/backend" || exit
npx ts-node backup_full_db.ts
# Move the JSON created by the script (it goes to ../../sauvegardes by default) to our specific folder
mv "$BACKUP_DIR"/backup_db_*.json "$TARGET_DIR/" 2>/dev/null

# 2. Agent Backup
echo "🤖 Backing up Agent v5.32..."
cp "$PROJECT_DIR/backend/agent_v5.32.js" "$TARGET_DIR/agent_v5.32_backup.js"

# 3. Environment & Config
echo "⚙️ Backing up Configuration..."
cp "$PROJECT_DIR/backend/.env" "$TARGET_DIR/.env.backup"
cp "$PROJECT_DIR/backend/config.yml" "$TARGET_DIR/config.yml.backup" 2>/dev/null

# 4. Codebase Backup (Zip)
# Only zip src, public, backend logic. skip node_modules
echo "📦 Zipping Codebase..."
cd "$PROJECT_DIR" || exit
zip -r -q "$TARGET_DIR/code_backup_$TIMESTAMP.zip" . -x "**/node_modules/*" "**/.git/*" "**/dist/*" "**/pdf_output/*" "**/uploads/*"

echo "✅ Backup Complete!"
echo "📍 Location: $TARGET_DIR"
