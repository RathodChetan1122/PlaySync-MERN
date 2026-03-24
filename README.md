# 🎮 PlaySync — Real-Time Multiplayer Gaming & Chat Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=flat-square)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO-010101?style=flat-square)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

PlaySync is a full-stack real-time multiplayer gaming and chat platform built with the MERN stack and Socket.IO. Players can create rooms, invite friends, chat live, and play 4 interactive games together.
 
---

## ✨ Features

- 🔐 **JWT Auth** — Register & login with secure token-based auth
- 🏠 **Game Rooms**  — Create public/private rooms with codes & passwords
- 💬 **Real-Time Chat** — Live messaging with typing indicators
- 🎮 **4 Games** — Tic Tac Toe, Rock Paper Scissors, Word Scramble, Chess
- 🏆 **Leaderboard** — Track wins and player rankings
- 🌐 **Live Lobby** — Browse and join public rooms
- ⚡ **Socket.IO** — All updates pushed in real time

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router v6, CSS3     |
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB, Mongoose                   |
| Real-Time | Socket.IO v4                        |
| Auth      | JWT, bcryptjs                       |
| Tooling   | concurrently, nodemon               |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- Git

### 1. Clone & Install

```bash
git clone https://github.com/RathodChetan1122/PlaySync-MERN.git
cd PlaySync-MERN
npm run install:all
```

### 2. Configure Server

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/playsync
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:3000
```

### 3. Run Development

```bash
# From root — runs both server & client
npm run dev
```

- **Frontend**: http://localhost:3000  
- **Backend API**: http://localhost:5000  
- **Health check**: http://localhost:5000/health

---

## 📁 Project Structure

```
PlaySync-MERN/
├── client/                  # React frontend
│   └── src/
│       ├── components/
│       │   ├── Chat/        # ChatPanel
│       │   ├── Games/       # TicTacToe, RPS, WordScramble, Chess
│       │   ├── Layout/      # Navbar
│       │   └── Rooms/       # MembersList
│       ├── context/         # AuthContext, SocketContext
│       ├── pages/           # Dashboard, Room, Lobby, Leaderboard
│       └── App.js
├── server/                  # Node.js backend
│   ├── controllers/         # Auth, Room logic
│   ├── middleware/          # JWT protect
│   ├── models/              # User, Room schemas
│   ├── routes/              # REST API routes
│   ├── socket/
│   │   ├── games/           # TicTacToe, RPS, WordScramble, Chess
│   │   └── index.js         # Socket.IO event handlers
│   └── index.js
└── package.json             # Root with concurrently
```

---

## 🎮 Games

| Game | Players | Rules |
|------|---------|-------|
| Tic Tac Toe | 2 | Classic X/O — first to 3 in a row wins |
| Rock Paper Scissors | 2 | Best of 3 rounds |
| Word Scramble | 2+ | Unscramble the word — 5 rounds, 10 pts per correct guess |
| Chess | 2 | Full board — play until resign |

---

## 🌿 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch for features |
| `feature/auth` | Auth system |
| `feature/rooms` | Room management |
| `feature/games` | Game implementations |
| `feature/chat` | Chat system |

### Workflow
```bash
git checkout develop
git checkout -b feature/your-feature
# ... work ...
git push origin feature/your-feature
# Open PR → develop → main
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | List public rooms |
| POST | `/api/rooms` | Create room |
| POST | `/api/rooms/join` | Join by code |
| DELETE | `/api/rooms/:id/leave` | Leave room |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/leaderboard` | Get top players |
| GET | `/api/users/search?q=` | Search users |

---

## 🔌 Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `room:join` | Client→Server | Join a room |
| `room:userJoined` | Server→Client | Someone joined |
| `chat:send` | Client→Server | Send message |
| `chat:message` | Server→Client | Receive message |
| `chat:typing` | Bidirectional | Typing indicator |
| `game:start` | Client→Server | Host starts game |
| `game:move` | Client→Server | Make a game move |
| `game:started` | Server→Client | Game has begun |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request to `develop`

---

## 📄 License

MIT © [Chetan Rathod](https://github.com/RathodChetan1122)
