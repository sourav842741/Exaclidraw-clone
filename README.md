# VectorShare AI

An advanced real-time collaborative whiteboard — the power of Excalidraw + Miro + FigJam + Whimsical combined with AI-assisted diagram generation, project management, interview collaboration, and document creation.

## Features

- **Infinite Whiteboard** — infinite zoom/pan, Konva canvas, 20+ drawing tools, frames, layers, minimap, grid & snap, guidelines
- **Real-Time Collaboration** — Socket.IO + Yjs CRDT, live cursors, presence, chat, comments, reactions, unlimited rooms
- **CRDT Sync** — conflict-free synchronization, offline editing, auto-merge, version history, autosave, undo/redo
- **AI Features** — diagram generator, flowchart generator, mermaid import, mind maps, code→architecture, image→diagram, voice→diagram, meeting assistant, AI sticky notes, interview whiteboard
- **Document Builder** — flowcharts, architecture, ER, sequence, wireframes, UML, kanban, slides, docs and more
- **Export** — PNG, JPEG, SVG, PDF, JSON, Markdown, Mermaid
- **Project Management** — Kanban, tasks, subtasks, due dates, labels, priority, timeline, calendar
- **Auth** — email/password, Google OAuth, JWT + refresh tokens, email verification, forgot password, avatar upload, teams
- **Admin Dashboard** — users, boards, analytics, storage, AI usage, subscriptions, reports
- **Security** — Helmet, rate limiting, input validation, RBAC, XSS protection
- **Infra** — Docker Compose, Nginx, Redis, RabbitMQ, MongoDB, GitHub Actions CI/CD, deployable on Render

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind, Zustand, Socket.IO Client, Konva, Yjs, y-websocket, Framer Motion, React Query |
| Backend | Node, Express, MongoDB/Mongoose, Redis, RabbitMQ, Socket.IO, JWT, Cloudinary, Multer, Nodemailer, OpenAI/Gemini |
| Infra | Docker Compose, Nginx, GitHub Actions, Render, MongoDB Atlas |

## Quick Start (Docker)

```bash
cp .env.example .env
docker compose up --build
# API  -> http://localhost:5000
# App  -> http://localhost:3000
```

## Quick Start (Local Dev)

```bash
# Server
cd server && npm install
cp .env.example .env
npm run dev

# Client
cd client && npm install
cp .env.example .env
npm run dev
```

## Project Structure

```
├── server/                  # Express API (MVC)
│   └── src/
│       ├── config/          # db, redis, rabbitmq, socket, cloudinary
│       ├── controllers/     # route controllers
│       ├── services/        # business logic
│       ├── repositories/    # data access
│       ├── middlewares/     # auth, error, rate-limit, rbac, validate
│       ├── routes/          # REST routes
│       ├── validators/      # input validation (Joi)
│       ├── sockets/         # Socket.IO layers
│       ├── crdt/            # Yjs websocket persistence
│       ├── ai/              # OpenAI/Gemini providers + prompts
│       ├── redis/           # cache + pub/sub
│       ├── rabbitmq/        # queue + workers
│       ├── models/          # Mongoose schemas
│       └── utils/
├── client/                  # React SPA
│   └── src/
│       ├── api/             # axios layer
│       ├── stores/          # zustand stores
│       ├── components/      # reusable + canvas + ai + collaboration
│       ├── pages/           # routes
│       ├── hooks/           # yjs, socket, hotkeys
│       └── utils/
├── nginx/                   # reverse proxy
├── .github/workflows/       # CI/CD
└── docker-compose.yml
```

## Deployment

- Docker images pushed to a container registry via GitHub Actions
- API deployed to Render, MongoDB on Atlas, Redis/RabbitMQ via Docker or managed services
