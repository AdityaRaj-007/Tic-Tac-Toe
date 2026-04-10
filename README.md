# 🎮 Multiplayer Tic-Tac-Toe with Nakama

A production-ready, multiplayer Tic-Tac-Toe game with **server-authoritative architecture** using [Nakama](https://heroiclabs.com/nakama/) as the backend infrastructure.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Nakama](https://img.shields.io/badge/Nakama-3.22.0-blueviolet?style=flat)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)
![TypeScript](https://img.shields.io/badge/TypeScript-Server-3178C6?style=flat&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Setup & Installation](#-setup--installation)
- [Running Locally](#-running-locally)
- [How to Test Multiplayer](#-how-to-test-multiplayer)
- [Project Structure](#-project-structure)
- [API/Server Configuration](#-apiserver-configuration)
- [Design Decisions](#-design-decisions)
- [Production Deployment](#-production-deployment)

---

## ✨ Features

### Core
- **Server-Authoritative Game Logic** — All game state is managed server-side; every move is validated before being applied.
- **Anti-Cheat** — Clients cannot manipulate game state; the server rejects invalid moves.
- **Real-time Multiplayer** — WebSocket-based game state synchronization via Nakama.
- **Global Matchmaking** — Find random opponents instantly using Nakama's Matchmaker engine.
- **Private Lobbies** — Host specific matches and invite friends directly via a Match ID.
- **Server Browser** — A public lobby that lists active game rooms, allowing users to discover and join hosted games.

### Advanced Features
- **🏆 Global Leaderboard System** — Ranks top players based on a dynamic scoring system (Wins = 2pts, Draws = 1pt). Automatically handles tie-breakers based on total games played.
- **⏱️ Timed Mode** — Optional 30-second turn timers enforced strictly by the server tick rate, resulting in an automatic forfeit upon timeout.
- **🔄 Dynamic Mode Selection** — Users can choose between "Classic" and "Timed" modes, and the matchmaker guarantees they only pair with opponents who selected the same mode.
- **👻 Graceful Disconnects** — If an opponent disconnects or closes their browser mid-game, the server instantly detects the presence drop and awards the remaining player a victory.

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────┐
│              React Frontend               │
│ (Vite + @heroiclabs/nakama-js + Tailwind) │
│                Port 5173                  │
└──────────┬────────────────────────────────┘
           │ WebSocket / HTTP
           ▼
┌───────────────────────────────────────────┐
│               Nakama Server               │
│       (TypeScript Runtime Modules)        │
│    gRPC: 7349 | HTTP: 7350 | UI: 7351     │
└──────────┬────────────────────────────────┘
           │
           ▼
┌───────────────────────────────────────────┐
│               PostgreSQL 16               │
│                 Port 5432                 │
└───────────────────────────────────────────┘
```

### Server-Authoritative Flow

1. Client sends a `MAKE_MOVE` opcode with the desired cell index.
2. Server validates the payload: it must be the correct player's turn, the cell must be empty, and the game must not be over.
3. Server applies the move and checks win/draw conditions.
4. Server broadcasts a `GAME_STATE` update to all connected clients.
5. On game end (win, draw, or timeout), the server updates both players' W/L/D metadata and recalculates their final score on the PostgreSQL Leaderboard.

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 18, Vite, React Router DOM, Tailwind CSS |
| **Backend Runtime**| Nakama 3.22.0 (TypeScript) |
| **Database** | PostgreSQL 16 |
| **Real-time** | Nakama WebSocket API |
| **Client SDK** | `@heroiclabs/nakama-js` |
| **Infrastructure** | Docker Compose |

---

## 🚀 Setup & Installation

### Prerequisites

- **Docker Desktop** (v20+) with Docker Compose
- **Node.js** (v18+) and npm

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd tic-tac-toe
```

### 2. Start the Backend (Nakama + PostgreSQL)

```bash
docker compose up --build -d
```

This will:
- Start PostgreSQL on port 5432.
- Build the TypeScript server modules from your `nakama` folder.
- Start Nakama on ports 7349 (gRPC), 7350 (HTTP), 7351 (Console).
- Run database migrations automatically.

**Verify Nakama is running:**
- Nakama Console: [http://localhost:7351](http://localhost:7351) (default credentials: `admin`/`password`)

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173).

---

## 🎮 How to Test Multiplayer

### Option 1: Local Browser Testing
1. Open `http://localhost:5173` in **Tab 1**.
2. Open `http://localhost:5173` in **Tab 2** (or use an Incognito window).
3. Log in with different usernames in each tab.
4. Click "Find Random Match" in both tabs (ensure both select the same mode).
5. Play the game!

### Option 2: Server Browser Testing
1. In **Tab 1**, click "Host New Match".
2. In **Tab 2**, navigate to the Server Browser.
3. Click "Join Game" on the newly created room in the lobby list.

### Option 3: Timed Mode Testing
1. Select "Timed" mode in both clients before matching.
2. Once matched, observe the 30-second countdown in the UI.
3. Let the timer expire to trigger the server-authoritative timeout forfeit.

---

## 📁 Project Structure

```
tic-tac-toe/
├── docker-compose.yml          # Docker services config
├── Dockerfile                  # Multi-stage build: compiles TS → bakes into Nakama image
├── local.yml                   # Nakama runtime configuration
├── README.md
│
├── src/                        # Backend TypeScript Code
│   ├── main.ts                 # InitModule, RPCs, & Hooks
│   └── tic-tac-toe.ts          # Authoritative Match Loop Logic
│
└── frontend/                   # React Client Code
    ├── src/
    │   ├── App.tsx             # Routing setup
    │   ├── context/
    │   │   └── NakamaContext.tsx # Global WebSocket/Session State
    │   └── pages/
    │       ├── LoginPage.tsx   # Device Authentication
    │       ├── Match.tsx       # Matchmaker UI
    │       ├── RoomBrowser.tsx # Public Lobby Listing
    │       ├── GamePage.tsx    # Board & Timer UI
    │       └── Leaderboard.tsx # Global Rankings UI
```

---

## ⚙️ API/Server Configuration

### Leaderboard Specifications

| Field | Configuration |
|---------|-------|
| **Name** | `match_stats_v4` |
| **Sort Order** | `DESCENDING` (Highest score wins) |
| **Operator** | `SET` (Forces updates even if score ties) |
| **Score Calculation** | `(Wins * 2) + Draws` |
| **Subscore (Tiebreaker)** | Total Games Played |
| **Metadata** | `{ win: number, draw: number, loss: number }` |

### Match OpCodes

| Code | Name | Direction | Description |
|------|------|-----------|-------------|
| 1 | `GAME_STATE` | Server → Client | Current board, turn, mode, and time remaining |
| 2 | `MAKE_MOVE` | Client → Server | Player attempts a move (cellIndex 0-8) |
| 3 | `GAME_OVER` | Server → Client | Match finished (win, draw, or timeout) |
| 4 | `GET_STATE` | Client → Server | Client requests sync on initial load |

---

## 🎨 Design Decisions

1. **Server-Authoritative Match Loop**: All game logic is contained inside Nakama's `matchLoop` function. The client never calculates wins or draws; it only renders the `GAME_STATE` provided by the server.
2. **Metadata Safe-Guarding**: Leaderboard database updates utilize `.ownerRecords` and strict `ownerId` checks to ensure zero "variable bleed" when concurrently updating W/L/D metadata for two players.
3. **Database Short-Circuit Evasion**: To prevent PostgreSQL from dropping metadata updates when a player's core score doesn't change (e.g., taking a Loss), the `subscore` dynamically increments on every completed match, forcing a database write.
4. **JSON Match Labels**: When a room is created, the backend stringifies the `mode` into the Match Label. The `RoomBrowser` queries this JSON string, allowing it to list open matches and display badges indicating whether a room is "Timed" or "Classic".
5. **Context-Driven React Architecture**: The `useNakama` context wraps the entire application, ensuring the WebSocket connection stays persistent across page navigation.

---

## 🌐 Production Deployment

The production setup hosts the **Nakama backend on AWS EC2** and the **React frontend on Render**, connected via HTTPS/WSS.

```
GitHub Push (main)
  ├── deploy-backend.yml → SSH into EC2 → docker compose build & up
  └── deploy-frontend.yml → Trigger Render deploy hook
```

### Infrastructure Overview

| Service | Platform | URL |
|---------|----------|-----|
| Nakama + PostgreSQL | AWS EC2 (Ubuntu) | `https://tictactoe27.ddns.net` via nginx |
| React Frontend | Render (Static Site) | `https://tic-tac-toe-xkfw.onrender.com` |

---

### Part 1 — EC2 Backend

#### One-Time EC2 Setup

SSH into your EC2 instance and run:

```bash
# Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx

# Allow ubuntu user to run Docker without sudo
sudo usermod -aG docker $USER && newgrp docker

# Clone the repo
git clone https://github.com/<your-username>/<your-repo>.git ~/tic-tac-toe
cd ~/tic-tac-toe
docker compose up -d
```

Open the following ports in your EC2 **Security Group**:

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (redirected to HTTPS by nginx) |
| 443 | TCP | HTTPS / WSS |

> Ports 7349–7351 do **not** need to be public — nginx proxies all traffic to them internally.

---

#### nginx + SSL Setup

Nakama runs on `localhost:7350` inside EC2. nginx sits in front, terminates SSL, and proxies all traffic — including WebSocket upgrades — to Nakama.

**1. Point a domain at your EC2 IP.**
Add an A record in your DNS provider:
```
nakama.yourdomain.com  →  <your-ec2-public-ip>
```

**2. Create the nginx config:**

```bash
sudo nano /etc/nginx/sites-available/nakama
```

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        # Handle CORS preflight
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin 'https://<your-app>.onrender.com';
            add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
            add_header Access-Control-Allow-Headers 'Authorization, Content-Type, Accept';
            add_header Access-Control-Allow-Credentials 'true';
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        # Suppress Nakama's own CORS headers to avoid duplicates
        proxy_hide_header Access-Control-Allow-Origin;
        proxy_hide_header Access-Control-Allow-Methods;
        proxy_hide_header Access-Control-Allow-Headers;

        add_header Access-Control-Allow-Origin 'https://<your-app>.onrender.com' always;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type, Accept' always;
        add_header Access-Control-Allow-Credentials 'true' always;

        proxy_pass http://localhost:7350;
        proxy_http_version 1.1;

        # Required for Nakama WebSocket (wss://) support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

**3. Enable config and get SSL certificate:**

```bash
sudo ln -s /etc/nginx/sites-available/nakama /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Free SSL cert via Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

Certbot auto-renews every 90 days. Verify the renewal timer is active:
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

#### GitHub Actions — Backend Workflow

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend on EC2

on:
  push:
    branches: [main]
    paths:
      - "src/**"
      - "Dockerfile"
      - "docker-compose.yml"
      - "local.yml"
      - "package*.json"
      - "tsconfig.json"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to EC2 via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/tic-tac-toe
            git pull origin main
            docker compose down
            docker compose build --no-cache
            docker compose up -d
            sleep 15
            docker compose ps
```

> The Dockerfile compiles TypeScript inside Docker using a multi-stage build, so no `npm install` or `npx tsc` is needed on the host.

---

### Part 2 — Render Frontend

#### One-Time Render Setup

1. Go to [render.com](https://render.com) → **New → Static Site**
2. Connect your GitHub repo and configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. Add the following **Environment Variables** (Settings → Environment):

| Variable | Value |
|----------|-------|
| `VITE_NAKAMA_SERVERKEY` | `defaultkey` (or your custom key) |
| `VITE_BACKEND_IP` | `your-domain.com` |
| `VITE_BACKEND_PORT` | `443` |
| `VITE_NAKAMA_USE_SSL` | `true` |

> ⚠️ Vite bakes environment variables into the bundle **at build time**. Changing a `VITE_` variable requires a redeploy to take effect.

4. Go to **Settings → Deploy Hook** and copy the URL.

#### GitHub Actions — Frontend Workflow

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Render

on:
  push:
    branches: [main]
    paths:
      - "frontend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Render Deploy Hook
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

---

### GitHub Secrets

Go to **GitHub → Repo → Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | Your EC2 public IP or domain |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Contents of your `.pem` private key (`cat your-key.pem`) |
| `RENDER_DEPLOY_HOOK_URL` | Deploy hook URL from Render dashboard |

---

### How the Dockerfile Works

The backend uses a **multi-stage Docker build** to compile TypeScript and bake the output directly into the Nakama image:

```dockerfile
# Stage 1 — Compile TypeScript
FROM node:alpine AS node-builder
WORKDIR /backend
COPY package*.json .
RUN npm install
COPY tsconfig.json .
COPY src/*.ts src/
RUN npx tsc                          # outputs to /backend/build/

# Stage 2 — Nakama image with compiled JS baked in
FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0
COPY --from=node-builder /backend/build/*.js /nakama/data/modules/build/
COPY local.yml /nakama/data/
```

> The `build/` directory is **not** volume-mounted in production. The compiled `main.js` lives inside the image itself. Nakama reads it from `/nakama/data/modules/build/main.js` as specified in `local.yml`.

---

### SSL & WebSocket Note

Because the frontend is served over HTTPS, **all** connections to Nakama must also be secure:

- HTTP API calls use `https://` — handled by the `Client` constructor's `useSSL` flag.
- Real-time connections use `wss://` — handled by `client.createSocket(useSSL)`.

Both must receive `useSSL = true`. The SSL flag in the `Client` constructor and in `createSocket` are **independent** — setting one does not affect the other.

```ts
const useSSL = import.meta.env.VITE_NAKAMA_USE_SSL === "true";

// HTTP calls
const client = new Client(serverKey, host, port, useSSL);

// WebSocket connection
const socket = client.createSocket(useSSL);
await socket.connect(session, true);
```