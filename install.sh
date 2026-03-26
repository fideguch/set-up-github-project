#!/bin/bash
# install.sh — Install set-up-github-project skill to ~/.claude/skills/
set -euo pipefail

SKILL_NAME="set-up-github-project"
SKILL_DIR="${HOME}/.claude/skills/${SKILL_NAME}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Installing ${SKILL_NAME} ==="

# Check if already installed
if [ -d "$SKILL_DIR" ]; then
  echo "Skill directory already exists: $SKILL_DIR"
  echo "Updating with latest files..."
  rm -rf "$SKILL_DIR"
fi

# Create skill directory
mkdir -p "$SKILL_DIR"

# Copy skill files (exclude dev-only files)
echo "[1/4] Copying skill files..."
cp "$SCRIPT_DIR/SKILL.md" "$SKILL_DIR/"
cp "$SCRIPT_DIR/README.md" "$SKILL_DIR/"
cp -r "$SCRIPT_DIR/scripts" "$SKILL_DIR/"
cp -r "$SCRIPT_DIR/templates" "$SKILL_DIR/"
cp -r "$SCRIPT_DIR/skills" "$SKILL_DIR/"
cp -r "$SCRIPT_DIR/docs" "$SKILL_DIR/"

# Install dev dependencies (optional, for running tests)
echo "[2/4] Checking Node.js..."
if command -v node &>/dev/null; then
  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -ge 20 ]; then
    echo "  Node.js $(node -v) detected"
    echo "[3/4] Installing dependencies..."
    cd "$SCRIPT_DIR" && npm install --silent 2>/dev/null
    echo "[4/4] Running tests..."
    cd "$SCRIPT_DIR" && npx playwright test --reporter=line 2>&1 | tail -3
  else
    echo "  Node.js $(node -v) detected (v20+ recommended for tests)"
    echo "[3/4] Skipping npm install (Node.js < 20)"
    echo "[4/4] Skipping tests"
  fi
else
  echo "  Node.js not found (optional, needed for tests only)"
  echo "[3/4] Skipping npm install"
  echo "[4/4] Skipping tests"
fi

echo ""
echo "=== Installation complete ==="
echo "Skill installed to: $SKILL_DIR"
echo ""
echo "Usage:"
echo "  Tell Claude: \"GitHub Projectsの環境を構築したい\""
echo "  Or use macro: !setup_github_project"
