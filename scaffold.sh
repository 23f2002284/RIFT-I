#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Target directory: default to current directory or use first argument
PROJECT_ROOT="${1:-.}"

echo "🚀 Creating project folder structure in: $PROJECT_ROOT"

# 1. Create directories
mkdir -p "$PROJECT_ROOT/apps/api/app/core"
mkdir -p "$PROJECT_ROOT/apps/api/app/models"
mkdir -p "$PROJECT_ROOT/apps/api/app/providers"
mkdir -p "$PROJECT_ROOT/apps/api/app/services"
mkdir -p "$PROJECT_ROOT/apps/api/app/routes"

mkdir -p "$PROJECT_ROOT/apps/api/tests"
mkdir -p "$PROJECT_ROOT/apps/api/workers"
mkdir -p "$PROJECT_ROOT/apps/api/log"

mkdir -p "$PROJECT_ROOT/apps/web"

# 2. Add __init__.py so Python recognizes them as packages
touch "$PROJECT_ROOT/apps/api/app/__init__.py"
touch "$PROJECT_ROOT/apps/api/app/core/__init__.py"
touch "$PROJECT_ROOT/apps/api/app/models/__init__.py"
touch "$PROJECT_ROOT/apps/api/app/providers/__init__.py"
touch "$PROJECT_ROOT/apps/api/app/services/__init__.py"
touch "$PROJECT_ROOT/apps/api/app/routes/__init__.py"
touch "$PROJECT_ROOT/apps/api/tests/__init__.py"
touch "$PROJECT_ROOT/apps/api/workers/__init__.py"

# 3. Add .gitkeep to keep empty log folder tracked in git
touch "$PROJECT_ROOT/apps/api/log/.gitkeep"

echo "✅ Folder structure created successfully!"
echo ""
echo "Structure created:"
echo "$PROJECT_ROOT/"
echo "└── apps/"
echo "    ├── api/"
echo "    │   ├── app/"
echo "    │   │   ├── core/"
echo "    │   │   ├── models/"
echo "    │   │   ├── providers/"
echo "    │   │   ├── services/"
echo "    │   │   └── routes/"
echo "    │   ├── tests/"
echo "    │   ├── workers/"
echo "    │   └── log/"
echo "    └── web/"

