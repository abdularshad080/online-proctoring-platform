# 🎓 Distributed Online Examination Integrity and Proctoring Platform

A full-stack online examination monitoring platform built using **Node.js, Express.js, Docker, and Git**.

## Features

- Student examination interface
- Faculty live dashboard
- Face Missing detection (simulated)
- Multiple Faces detection (simulated)
- Tab Switch detection (simulated)
- Real-time alert updates
- Dockerized deployment

---

## Repository Structure

```text
opp/
├── backend/
│   ├── public/
│   │   ├── index.html
│   │   ├── dashboard.html
│   │   ├── script.js
│   │   └── style.css
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Tech Stack

- Node.js
- Express.js
- HTML
- CSS
- JavaScript
- Docker
- Docker Compose
- Git

---

# Quick Start (Docker)

## Prerequisites

- Docker Desktop installed
- Git installed

Clone the repository.

```bash
git clone https://github.com/abdularshad080/online-proctoring-platform.git
cd online-proctoring-platform
```

Build the project.

```bash
docker compose build
```

Run the project.

```bash
docker compose up
```

Open:

- Student: http://localhost:5050
- Faculty Dashboard: http://localhost:5050/dashboard.html

---

# Local Execution

Go to backend.

```bash
cd backend
```

Install dependencies.

```bash
npm install
```

Run.

```bash
node server.js
```

Open:

http://localhost:5050

---

# API Endpoints

| Method | Endpoint | Purpose |
|---------|----------|---------|
| GET | `/api/status` | Check server |
| POST | `/api/event` | Send proctoring event |
| GET | `/api/alerts` | Retrieve alerts |

---

# Docker Commands

Build.

```bash
docker compose build
```

Run.

```bash
docker compose up
```

Stop.

```bash
docker compose down
```

Check containers.

```bash
docker ps
```

---

# Git Workflow

Useful commands.

```bash
git status
git branch
git log --oneline --graph --all --decorate
git push origin main
```

---

# Future Enhancements

- MongoDB integration
- JWT Authentication
- AI face detection
- WebSocket real-time updates
- Automated testing
- CI/CD using GitHub Actions
