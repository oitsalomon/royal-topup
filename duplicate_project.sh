#!/bin/bash

# Define source and destination
SOURCE_DIR=$(pwd)
DEST_DIR="../ASIXGAMES"

echo "🚀 Starting duplication from $SOURCE_DIR to $DEST_DIR"

# 1. Copy files using rsync
# Excluding heavy/system folders to keep it clean and fast
echo "📦 Copying files..."
rsync -av \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.vercel' \
  --exclude '.DS_Store' \
  . "$DEST_DIR"

if [ $? -ne 0 ]; then
    echo "❌ Copy failed!"
    exit 1
fi

echo "✅ Files copied successfully."

# 2. Update package.json in the new directory
echo "📝 Updating configuration in new project..."

# Change project name
sed -i '' 's/"name": "clover-store"/"name": "asixgames"/' "$DEST_DIR/package.json"

# Change dev port to 3001 to avoid conflict with port 3000
sed -i '' 's/"dev": "next dev"/"dev": "next dev -p 3001"/' "$DEST_DIR/package.json"

echo "✅ Configuration updated."
echo ""
echo "🎉 DUPLICATION COMPLETE!"
echo ""
echo "⚠️  CRITICAL NEXT STEPS ⚠️"
echo "1. Open the new folder: VS Code -> File -> Open Folder -> '$DEST_DIR'"
echo "2. EDIT THE .env FILE in the new folder!"
echo "   You MUST change DATABASE_URL to a new database, otherwise you will overwrite your existing data."
echo "3. Run 'npm install' in the new folder."
echo "4. Run 'npx prisma db push' to setup the new database."
