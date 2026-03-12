# 🎬 WatchParty — Watch YouTube Together in Real Time

A full-stack YouTube Watch Party app built with **Next.js** (frontend) and **Python FastAPI** (backend), using **WebSockets** for real-time synchronization.

---

## 🚀 Live Demo

> **Frontend:** `https://your-app.vercel.app`  
> **Backend:** `https://your-app.onrender.com`

---

## 🛠 Tech Stack

| Layer       | Technology         | Purpose                              |
|-------------|--------------------|--------------------------------------|
| Frontend    | Next.js + TypeScript | UI, room creation, video player     |
| Backend     | Python FastAPI     | REST API, WebSocket server, room logic |
| Real-time   | WebSockets (native) | Bidirectional sync                  |
| Video       | YouTube IFrame API | Embedded controllable player        |

---

## ⚙️ Local Setup

### 1. Backend (Python FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

### 3. Environment Variables

Create `frontend/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## 🌐 Deployment

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Set **Root Directory** to `backend`
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Copy the service URL (e.g. `https://watchparty-api.onrender.com`)

### Frontend → Vercel

1. Push code to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_BACKEND_URL` → your Render URL
   - `NEXT_PUBLIC_WS_URL` → `wss://your-render-url.onrender.com`
5. Deploy!

---

## 🏗 Architecture Overview

### WebSocket Flow

```
User A (Host)           FastAPI WS Server           User B (Participant)
     |                        |                            |
     |--join_room(roomId)---->|                            |
     |<--sync_state-----------| <---join_room(roomId)------|
     |                        |---user_joined------------>|
     |                        |                            |
     |--play(currentTime)---->|                            |
     |                        |---play(currentTime)------->|
     |--seek(time)----------->|                            |
     |                        |---seek(time)-------------->|
     |--assign_role(userId)-->|                            |
     |                        |---role_assigned---------->|
```

### Room Lifecycle

1. **Create**: POST `/api/rooms` → returns `roomId`, `userId`, `role=host`
2. **Join**: POST `/api/rooms/{roomId}/join` → returns `userId`, `role=participant`
3. **Connect WS**: `ws://server/ws/{roomId}/{userId}`
4. **Server syncs** new joiner with current video state
5. **Events flow** through server → broadcast to room

### Role-Based Access Control

- **Host**: Full control — play/pause/seek/change video/assign roles/remove users
- **Moderator**: Playback control — play/pause/seek/change video  
- **Participant**: Watch only — all controls disabled

Permission validation happens **server-side** — clients cannot bypass restrictions.

### OOP Design (Backend)

```
RoomManager         Room              Participant
    │                │                    │
    ├─ create_room() ├─ add_participant() ├─ send()
    ├─ get_room()    ├─ broadcast()      ├─ to_dict()
    └─ delete_room() ├─ get_participants_list()
                     └─ remove_participant()
```

---

## 📡 WebSocket Events

| Event               | Direction          | Description                              |
|---------------------|--------------------|------------------------------------------|
| `join_room`         | Client → Server    | Connect to room                          |
| `play`              | Client → Server    | Request play (Host/Mod only)            |
| `pause`             | Client → Server    | Request pause (Host/Mod only)           |
| `seek`              | Client → Server    | Seek to time (Host/Mod only)            |
| `change_video`      | Client → Server    | Change video (Host/Mod only)            |
| `assign_role`       | Client → Server    | Assign role (Host only)                 |
| `remove_participant`| Client → Server    | Remove user (Host only)                 |
| `transfer_host`     | Client → Server    | Transfer host role (Host only)          |
| `chat`              | Client → Server    | Send chat message                       |
| `sync_state`        | Server → Client    | Full state sync for new joiners         |
| `user_joined`       | Server → Clients   | Broadcast new participant               |
| `user_left`         | Server → Clients   | Broadcast departure                     |
| `role_assigned`     | Server → Clients   | Broadcast role change                   |

---

## ✨ Features

- ✅ Create/join rooms with unique 8-char codes
- ✅ YouTube IFrame API integration
- ✅ Real-time play/pause/seek synchronization
- ✅ Change video for all participants
- ✅ Role-based access (Host / Moderator / Participant)
- ✅ Host can assign/revoke roles
- ✅ Host can remove participants
- ✅ Transfer host to another user
- ✅ Live participant list with roles
- ✅ Real-time chat
- ✅ Connection status indicator
- ✅ Mobile responsive layout

---

## 💡 Trade-offs & Notes

- **No database**: Rooms live in memory — rooms reset on server restart. For persistence, add SQLite/PostgreSQL.
- **Single server**: For horizontal scaling, add Redis Pub/Sub (Socket.IO Redis Adapter pattern).
- **No auth**: Users identify by session. For production, add JWT auth.
- **Seek precision**: Minor drift possible on high-latency connections; could add periodic resync.
