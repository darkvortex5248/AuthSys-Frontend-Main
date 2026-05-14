# RinoxAuth - Enterprise License Management & Auth Suite

## Super Admin Panel
The platform includes a powerful Super Admin Panel for system-wide management.

- **Access URL**: `/super-admin/login`
- **Default Credentials**: 
  - Username: `admin`
  - Password: `admin123`

### Essential Features:
- **Financial Ledger**: Track total revenue and transaction logs.
- **SDK Management**: Update global download links for C++, C#, and Python SDKs.
- **Developer Registry**: Manage and suspend developer accounts.
- **Subscription Architecture**: Configure pricing and limits for all plans.
- **System Core**: Toggle maintenance mode and global security flags.

RinoxAuth is a high-performance, enterprise-ready authentication and license management suite designed for developers who need to protect their applications with robust security, HWID locking, and advanced analytics.

## 🚀 Key Features

### 🛡️ For Developers (Dashboard)
- **Multi-App Management**: Create and manage multiple applications from a single dashboard.
- **License Generation**: Generate single or bulk license keys (Time-based, Uses-based, or Lifetime).
- **HWID Protection**: Lock licenses to specific hardware to prevent unauthorized sharing.
- **User Management**: Ban/Unban users, reset HWIDs, and monitor user activity.
- **Advanced Analytics**: Real-time monitoring of logins, registrations, and suspicious activities.
- **Variable System**: Remote configuration of your apps via secure variables.
- **Webhook Integration**: Get notified of events like new registrations or logins.

### 🔑 For End Users (Client API)
- **Secure Authentication**: Robust login and registration flow.
- **Session Management**: Secure, server-side session tracking.
- **Integrity Checks**: Verify app versions and integrity before allowing access.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React, TailwindCSS, Framer Motion, Lucide Icons.
- **Backend**: FastAPI (Python), SQLAlchemy (Async), PostgreSQL, Redis.
- **Security**: OAuth2, JWT, Bcrypt, Rate Limiting (SlowAPI).
- **Automation**: Docker, Nginx (Reverse Proxy).

## 📂 Project Structure

```text
RinoxAuth/
├── frontend/           # Next.js Application
├── backend/            # FastAPI Backend
├── nginx/              # Nginx Configuration for hosting
├── docker-compose.yml  # Container Orchestration
└── README.md           # This file
```

## ⚙️ Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL & Redis

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
# Update .env with your database credentials
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Update .env.local
npm run dev
```

## 🔒 Security Note
Ensure you change the `SECRET_KEY` in `backend/.env` and `NEXTAUTH_SECRET` in `frontend/.env.local` before deploying to production.

## 📄 License
Custom Proprietary License - Created by Rinox Deadmoor.
