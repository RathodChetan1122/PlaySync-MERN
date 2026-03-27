#!/bin/bash
# ============================================================ 
# PlaySync — GitHub Push Script 
# Repo: https://github.com/RathodChetan1122/PlaySync-MERN
# ============================================================  

set -e

REPO_URL="https://github.com/RathodChetan1122/PlaySync-MERN.git"
PROJECT_DIR="PlaySync-MERN"

echo ""
echo "🎮 PlaySync GitHub Setup Script"
echo "================================"
echo ""

# ── STEP 1: Clone or init ────────────────────────────────────
if [ -d "$PROJECT_DIR/.git" ]; then
  echo "✅ Git already initialized"
else
  echo "📦 Initializing Git repo..."
  cd "$PROJECT_DIR" || exit 1
  git init
  git remote add origin "$REPO_URL"
  cd ..
fi

cd "$PROJECT_DIR"

# ── STEP 2: Set up main branch ───────────────────────────────
echo ""
echo "🌿 Setting up branch: main"
git checkout -B main

git add .
git commit -m "🚀 Initial commit — Full PlaySync MERN stack

- Complete project structure (monorepo)
- React 18 frontend with routing, auth, socket context
- Node.js + Express REST API (auth, rooms, users)
- Socket.IO real-time events (chat, rooms, games)
- MongoDB schemas: User, Room with messages
- 4 games: Tic Tac Toe, RPS, Word Scramble, Chess
- JWT authentication with bcrypt
- Dark neon UI with Orbitron font
- Leaderboard, Lobby, Dashboard pages
- .gitignore, .env.example, README"

git push -u origin main --force
echo "✅ main branch pushed"

# ── STEP 3: develop branch ───────────────────────────────────
echo ""
echo "🌿 Creating branch: develop"
git checkout -b develop
git push -u origin develop
echo "✅ develop branch pushed"

# ── STEP 4: feature/auth ─────────────────────────────────────
echo ""
echo "🌿 Creating branch: feature/auth"
git checkout -b feature/auth
git push -u origin feature/auth
echo "✅ feature/auth branch pushed"

# ── STEP 5: feature/rooms ────────────────────────────────────
echo ""
echo "🌿 Creating branch: feature/rooms"
git checkout develop
git checkout -b feature/rooms
git push -u origin feature/rooms
echo "✅ feature/rooms branch pushed"

# ── STEP 6: feature/games ────────────────────────────────────
echo ""
echo "🌿 Creating branch: feature/games"
git checkout develop
git checkout -b feature/games
git push -u origin feature/games
echo "✅ feature/games branch pushed"

# ── STEP 7: feature/chat ─────────────────────────────────────
echo ""
echo "🌿 Creating branch: feature/chat"
git checkout develop
git checkout -b feature/chat
git push -u origin feature/chat
echo "✅ feature/chat branch pushed"

# ── Back to develop ──────────────────────────────────────────
git checkout develop

echo ""
echo "============================================"
echo "🎉 PlaySync successfully pushed to GitHub!"
echo "============================================"
echo ""
echo "📌 Repository: $REPO_URL"
echo ""
echo "🌿 Branches created:"
echo "   main          → Production-ready code"
echo "   develop       → Integration branch"
echo "   feature/auth  → Auth system"
echo "   feature/rooms → Room management"
echo "   feature/games → Game implementations"
echo "   feature/chat  → Chat system"
echo ""
echo "📋 Next steps:"
echo "   1. cd PlaySync-MERN"
echo "   2. npm run install:all"
echo "   3. cp server/.env.example server/.env  (add your MONGO_URI)"
echo "   4. npm run dev"
echo ""
