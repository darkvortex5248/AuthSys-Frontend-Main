# AuthSys

SaaS-based Software Authentication & License Management System

## Overview
AuthSys allows developers to securely manage software licenses, hardware locking (HWID), variable sharing, blacklisting, and detailed usage analytics. It features an AI-driven dashboard.

## Quick Start (Docker)
Ensure you have Docker and Docker Compose installed.

1. Setup environment variables:
`cp backend/.env.example backend/.env`
(Or just create an `.env` file at the project root with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `SECRET_KEY`, and `ANTHROPIC_API_KEY`).
2. Run the stack:
`docker-compose up -d --build`
3. Access the dashboard at `http://localhost`. 

## Manual Setup

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection for Celery & caching
- `SECRET_KEY`: Random string for JWT signing
- `ANTHROPIC_API_KEY`: Key for the Claude AI Agent (claude-3-5-sonnet-20240620)
