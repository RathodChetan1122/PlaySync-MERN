# ⚙️ PlaySync — Local Setup Guide

Follow these steps to get PlaySync running on your machine in under 5 minutes.

---

## ✅ Prerequisites

| Tool | Minimum Version | Check with |
|------|----------------|------------|
| Node.js | v18+ | `node -v` |
| npm | v9+ | `npm -v` |
| MongoDB | v6+ (local) OR Atlas URI | `mongod --version` |
| Git | any | `git --version` |

---

## 🚀 Quick Start

### Step 1 — Clone

```bash
git clone https://github.com/RathodChetan1122/PlaySync-MERN.git
cd PlaySync-MERN
```

### Step 2 — Install all dependencies

```bash
npm run install:all
```

This installs root, server, and client packages in one command.

### Step 3 — Configure environment

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/playsync
JWT_SECRET=any_long_random_string_here
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

> **Using MongoDB Atlas?** Replace `MONGO_URI` with your Atlas connection string.

### Step 4 — Start MongoDB (if running locally)

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

### Step 5 — Run the app

```bash
npm run dev
```

This starts both the React frontend and Node backend concurrently.

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:5000 |
| 🏥 Health Check | http://localhost:5000/health |

---

## 🛠️ Individual Commands

```bash
# Run only the backend
npm run server

# Run only the frontend
npm run client

# Build frontend for production
npm run build
```

---

## 🧪 Test the App

1. Open http://localhost:3000
2. Register two accounts (open two browser tabs / incognito)
3. Create a room on Account 1
4. Join the room on Account 2 (use the room code)
5. Chat and start a game!

---

## 🐛 Common Issues

### Port already in use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### MongoDB connection refused
- Make sure MongoDB is running: `sudo systemctl status mongod`
- Check your `MONGO_URI` in `server/.env`

### Socket not connecting
- Make sure backend is running on port 5000
- Check `CLIENT_URL` in server `.env` matches your React dev URL

### `npm run install:all` fails
Run installs manually:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

---

## 📦 Production Build

```bash
npm run build          # Builds React to client/build/
cd server && node index.js  # Serve API (configure to serve static too)
```

For full production deployment, consider:
- **Frontend**: Vercel, Netlify, or serve from Express
- **Backend**: Railway, Render, Heroku, or VPS
- **Database**: MongoDB Atlas (free tier available)
