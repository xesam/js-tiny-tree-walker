#!/bin/bash

set -e

PACKAGE_NAME=$(node -p "require('./package.json').name")
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo "📦 Package: $PACKAGE_NAME"
echo "📌 Current version: $CURRENT_VERSION"
echo ""

echo "Select version bump type:"
echo "  1) patch (bug fixes)    → $(node -p "require('semver').inc('$CURRENT_VERSION', 'patch')")"
echo "  2) minor (new features) → $(node -p "require('semver').inc('$CURRENT_VERSION', 'minor')")"
echo "  3) major (breaking)     → $(node -p "require('semver').inc('$CURRENT_VERSION', 'major')")"
echo "  4) custom version"
echo "  5) cancel"
echo ""

read -p "Enter choice [1-5]: " choice

case $choice in
    1) BUMP="patch" ;;
    2) BUMP="minor" ;;
    3) BUMP="major" ;;
    4)
        read -p "Enter version: " CUSTOM_VERSION
        if [[ "$CUSTOM_VERSION" == "$CURRENT_VERSION" ]]; then
            echo "❌ Error: Version '$CUSTOM_VERSION' is the same as current version."
            exit 1
        fi
        if ! node -e "require('semver').valid('$CUSTOM_VERSION')" 2>/dev/null; then
            echo "❌ Error: '$CUSTOM_VERSION' is not a valid semver version."
            exit 1
        fi
        BUMP="$CUSTOM_VERSION"
        ;;
    5)
        echo "Cancelled."
        exit 0
        ;;
    *)
        echo "Invalid choice."
        exit 1
        ;;
esac

echo ""
echo "🔍 Running tests..."
npm test

echo ""
echo "🔨 Building..."
npm run build

echo ""
echo "📝 Updating version..."
npm version "$BUMP" -m "chore: release v%s"

NEW_VERSION=$(node -p "require('./package.json').version")

echo ""
echo "🚀 Pushing to remote..."
git push origin main --tags

echo ""
echo "📤 Publishing to npm..."
npm publish --access public

echo ""
echo "✅ Successfully published $PACKAGE_NAME@$NEW_VERSION to npm!"
echo "🔗 https://www.npmjs.com/package/$PACKAGE_NAME"
