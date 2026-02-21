# FleetFlow – Enterprise Fleet & Logistics Management System

A full-stack, production-ready fleet management application with role-based access control, multi-language support (10 Indian languages), dark/light theme, and animated KPI dashboards.

---

## Tech Stack

| Layer      | Technology                                                        |
|------------|-------------------------------------------------------------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS 3, Framer Motion, i18next |
| **Backend**  | FastAPI, SQLAlchemy (async), PostgreSQL, Alembic, Pydantic v2       |
| **Auth**     | JWT (python-jose), bcrypt hashing, role-based guards (RBAC)         |

---

## Features

- **4 User Roles** – Fleet Manager, Dispatcher, Safety Officer, Financial Analyst
- **Dark/Light Mode** – System-aware, localStorage-persistent
- **Multi-Language** – English + 9 Indian languages (Hindi, Gujarati, Marathi, Tamil, Telugu, Kannada, Bengali, Malayalam, Punjabi)
- **Animated KPI Dashboard** – Counting animations, gradient accents, dark-mode glow
- **Collapsible Sidebar** – Responsive layout with mobile drawer
- **Glassmorphic UI** – Frosted glass cards, smooth transitions, hover animations
- **Full CRUD** – Vehicles, Drivers, Trips, Maintenance, Fuel logs
- **SEO Ready** – React Helmet, robots.txt, sitemap.xml, OpenGraph meta tags
- **API Proxy** – Vite dev server proxies `/api` calls to FastAPI

---

## Project Structure

```
FleetFlow/
├── backend/
│   ├── main.py             # FastAPI application
│   ├── config.py            # pydantic-settings config
│   ├── database.py          # Async SQLAlchemy engine
│   ├── seed.py              # Seed initial users
│   ├── models/models.py     # ORM models
│   ├── schemas/schemas.py   # Pydantic schemas
│   ├── auth/auth.py         # JWT + RBAC
│   ├── routers/             # API routers
│   └── alembic/             # DB migrations
└── frontend/
    ├── src/
    │   ├── App.tsx           # Router + providers
    │   ├── main.tsx          # Entry point
    │   ├── components/       # Theme, Auth, ProtectedRoute
    │   ├── layouts/          # DashboardLayout (sidebar + navbar)
    │   ├── pages/            # All page components
    │   ├── api/              # Axios client + typed endpoints
    │   ├── i18n/             # 10 translation JSON files + config
    │   └── types/            # TypeScript interfaces
    ├── index.html
    ├── tailwind.config.js
    └── package.json
```

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **PostgreSQL** running locally

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/fleetflow" > .env
echo "JWT_SECRET_KEY=your-secret-key" >> .env

# Run migrations and seed
alembic upgrade head
python seed.py

# Start server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

### Demo Credentials

| Role              | Email                   | Password     |
|-------------------|-------------------------|--------------|
| Fleet Manager     | fleet@fleetflow.com     | fleet123     |
| Dispatcher        | dispatch@fleetflow.com  | dispatch123  |
| Safety Officer    | safety@fleetflow.com    | safety123    |
| Financial Analyst | finance@fleetflow.com   | finance123   |

---

## API Endpoints

| Module       | Base URL          | Methods           |
|--------------|-------------------|--------------------|
| Auth         | `/api/auth`       | POST login, register, GET /me |
| Vehicles     | `/api/vehicles`   | GET list, POST, PUT, DELETE    |
| Drivers      | `/api/drivers`    | GET list, POST, PUT, DELETE    |
| Trips        | `/api/trips`      | GET list, POST, PATCH status   |
| Maintenance  | `/api/maintenance`| GET list, POST, PUT, DELETE    |
| Fuel         | `/api/fuel`       | GET list, POST, PUT, DELETE    |
| Analytics    | `/api/analytics`  | GET /dashboard                 |

---

## License

MIT
