# 🛡️ AuthSys Enterprise Deployment Guide

This guide provides a professional, step-by-step roadmap for deploying the **AuthSys** infrastructure to production. We cover both **Platform-as-a-Service (Railway)** and **Native VPS (Ubuntu)** configurations.

---

## 🏗️ Architecture Overview
*   **Frontend**: Next.js 15+ (Tailwind CSS, NextAuth.js)
*   **Backend**: FastAPI (Python 3.11+, SQLAlchemy, PostgreSQL)
*   **Real-time**: Redis (Rate Limiting, Session Caching)
*   **Bots**: Multi-tenant Discord & Telegram Bot Manager (Background Tasks)
*   **Security**: Cloudflare Turnstile, JWT Orchestration

---

## 🚂 Option 1: Managed Deployment (Railway.app)

### 1. Database & Cache
1.  **PostgreSQL**: Create a new PostgreSQL service. Copy the `DATABASE_URL`.
    *   *Note*: Use `postgresql+asyncpg://` as the prefix for the backend.
2.  **Redis**: Create a Redis service and copy the `REDIS_URL`.

### 2. Backend (FastAPI)
1.  Connect your GitHub repo and set `backend` as the **Root Directory**.
2.  Configure Variables:
    *   `DATABASE_URL`: Your asyncpg URL
    *   `REDIS_URL`: Your Redis URL
    *   `SECRET_KEY`: A secure random string
    *   `EMAILS_FROM_NAME`: "AuthSys Security"

### 3. Frontend (Next.js)
1.  Connect your GitHub repo and set `frontend` as the **Root Directory**.
2.  Configure Variables:
    *   `NEXT_PUBLIC_API_URL`: Your backend URL (e.g., `https://api.authsys.com`)
    *   `NEXTAUTH_SECRET`: A secure random string
    *   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: From Google Cloud Console

---

## 🤖 Bot Manager Configuration (Critical)

Our backend now manages multiple customer bots automatically. For bots to function in production:

### 1. Discord Developer Portal
*   **Privileged Gateway Intents**: You MUST enable **PRESENCE INTENT**, **SERVER MEMBERS INTENT**, and **MESSAGE CONTENT INTENT** in the bot settings.
*   **Bot Token**: Customers will enter their tokens in the dashboard.
*   **Permissions**: Ensure the bot has `Administrator` or necessary slash command permissions.

### 2. Telegram Bot
*   Ensure your server can access `api.telegram.org`.
*   Bot commands like `/genkey` and `/stats` are pre-configured in the `BotManager` service.

---

## 🖥️ Option 2: Native VPS Deployment (Ubuntu 24.04+)

### 1. Initial Server Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose nginx certbot python3-certbot-nginx -y
```

### 2. Clone and Prepare
```bash
git clone https://github.com/youruser/RinoxAuth.git /var/www/authsys
cd /var/www/authsys/backend
pip install -r requirements.txt
```

### 3. Initialize New Features
Run this script to ensure Chatrooms, Seller API, and Bot tables are initialized:
```bash
python init_new_features.py
```

### 4. Docker Orchestration
Create a `docker-compose.yml` in the root:
```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: authsys
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine

  backend:
    build: ./backend
    command: uvicorn main:app --host 0.0.0.0 --port 8000
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:your_secure_password@db:5432/authsys
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    depends_on:
      - backend
```

---

## 🔒 Security Hardening

### 1. SSL Encryption
Always use SSL for production traffic:
```bash
sudo certbot --nginx -d dashboard.yourdomain.com -d api.yourdomain.com
```

### 2. Rate Limiting
AuthSys has built-in rate limiting via **SlowAPI**. Ensure your `REDIS_URL` is active to prevent brute-force attacks on the `/login` and `/license` endpoints.

### 3. HWID Enforcement
Ensure that `HWID_ENABLED` is set to `True` in your Application settings to prevent credential sharing.

---

## 🛠️ Post-Deployment Checklist
*   [ ] Verify PostgreSQL connection.
*   [ ] Run `python init_new_features.py` for new modules.
*   [ ] Enable all **Discord Gateway Intents** in the Developer Portal.
*   [ ] Verify the `BotManager` starts on server boot (check logs).
*   [ ] Test `/genkey` command in both Discord and Telegram.
*   [ ] Confirm Seller API endpoints are reachable.

---
*AuthSys Infrastructure - Enterprise Grade Security Orchestration*
