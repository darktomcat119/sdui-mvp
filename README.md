# SDUI MVP - Sistema Digital Urbano Inteligente

Multi-tenant municipal government platform for managing business licenses.

## Tech Stack

- **Frontend:** React 19 + TypeScript, Vite, CSS Modules
- **Backend:** NestJS, TypeORM, PostgreSQL 16
- **Auth:** JWT (access + refresh tokens), bcrypt, account lockout
- **Infrastructure:** Docker Compose, Nginx

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

### Using Docker (recommended)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start all services
docker compose up --build

# 3. Run database migrations (in another terminal)
docker exec sdui-backend npm run migration:run

# 4. Seed the database
docker exec sdui-backend npm run seed
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api/v1
- **Health check:** http://localhost:3000/api/v1/health

### Local Development (without Docker)

```bash
# 1. Start PostgreSQL (ensure it's running on port 5432)

# 2. Backend
cd backend
cp .env.example .env    # Edit with your DB credentials
npm install
npm run migration:run
npm run seed
npm run start:dev

# 3. Frontend (in another terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Test Accounts

All passwords: `Admin123!`

| Email | Role | Municipality |
|-------|------|--------------|
| admin@sdui.gob.mx | System Admin | Global |
| admin@ejemplo.gob.mx | Municipal Admin | Ejemplo |
| tesoreria@ejemplo.gob.mx | Treasury Operator | Ejemplo |
| legal@ejemplo.gob.mx | Legal Analyst | Ejemplo |
| contralor@ejemplo.gob.mx | Comptroller Auditor | Ejemplo |
| admin@prueba.gob.mx | Municipal Admin | Prueba |
| tesoreria@prueba.gob.mx | Treasury Operator | Prueba |
| legal@prueba.gob.mx | Legal Analyst | Prueba |
| contralor@prueba.gob.mx | Comptroller Auditor | Prueba |

## Roles & Permissions

| Role | Municipalities | Users | Audit Logs |
|------|---------------|-------|------------|
| System Admin | Full CRUD | Full CRUD (all) | Read all |
| Municipal Admin | Read own | CRUD (own municipality) | Read own |
| Treasury Operator | - | - | - |
| Legal Analyst | - | - | - |
| Comptroller Auditor | - | - | Read all |

## Project Structure

```
sdui-mvp/
├── backend/           # NestJS API
│   └── src/
│       ├── common/    # Guards, interceptors, decorators, base entities
│       ├── config/    # Database, JWT, app configuration
│       ├── database/  # Migrations and seed scripts
│       └── modules/   # auth, users, municipalities, audit, health
├── frontend/          # React + Vite
│   └── src/
│       ├── components/  # ui/, layout/, auth/
│       ├── contexts/    # AuthContext
│       ├── pages/       # Login, Dashboard, Users, AuditLog
│       ├── services/    # API service layer
│       └── styles/      # Design tokens, global styles
└── docker/            # Dockerfiles, nginx config, postgres init
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/login | Public | Login |
| POST | /auth/refresh | Public | Refresh token |
| POST | /auth/logout | Any | Revoke session |
| GET | /auth/me | Any | Current user |
| GET | /municipalities | Admin | List municipalities |
| POST | /municipalities | System Admin | Create municipality |
| GET | /municipalities/:id | Admin | Get municipality |
| PATCH | /municipalities/:id | System Admin | Update municipality |
| GET | /users | Admin | List users |
| POST | /users | Admin | Create user |
| GET | /users/:id | Admin | Get user |
| PATCH | /users/:id | Admin | Update user |
| PATCH | /users/:id/status | Admin | Change user status |
| GET | /audit-logs | Admin/Auditor | List audit logs |
| GET | /audit-logs/:id | Admin/Auditor | Audit log detail |
| GET | /health | Public | Health check |

## Security Features

- JWT access tokens (15min) + refresh tokens (7 days)
- Account lockout after 3 failed login attempts (15min duration)
- Row-Level Security (RLS) for multi-tenant data isolation
- Immutable audit log (INSERT only, no UPDATE/DELETE)
- bcrypt password hashing (12 rounds)
- CORS configuration
- Input validation with class-validator
