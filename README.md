# SupaCare — AI-Powered Hospital Nutrition Platform

> Smart nutrition, safer patients.

SupaCare is a full-stack clinical nutrition management system that uses AI to generate per-patient dietary analyses, EHR-aware meal plans, and inventory demand forecasts for hospital food administrators and doctors.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
  - [Running with Docker](#running-with-docker)
- [Database](#database)
- [AI Engine](#ai-engine)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Configuration](#configuration)

---

## Overview

SupaCare bridges the gap between clinical records and hospital food operations. Doctors get per-patient AI dietary summaries with drug-food interaction detection; food administrators get demand-driven inventory forecasting and AI-generated weekly meal plans. Everything is backed by real-time data from a PostgreSQL database hosted on Supabase.

---

## Features

### Doctor Portal
- **Patient EHR Directory** — browse patients grouped by floor, filter by priority, allergy, or medication
- **AI Dietary Analysis** — per-patient analysis covering drug-food interactions (e.g. Warfarin + Vitamin K, MAOIs + Tyramine), disease-specific restrictions, and allergy cross-reactivity
- **BMI & Biometrics** — live BMI calculator with Mifflin-St Jeor calorie estimation; inline editor syncs directly to the database and re-triggers AI analysis
- **AI Meal Plans** — breakfast/lunch/dinner generated from safe inventory only, calibrated to BMI category and clinical constraints, with a plain-English reasoning explanation for nursing staff
- **Nutrition Facts** — per-meal modal showing macros, micros, GI index, allergen warnings, and clinical notes

### Food Admin Portal
- **Inventory Forecasting** — AI-scored 7-day demand forecasts for every inventory item, with ORDER NOW / SUFFICIENT status
- **Purchase Order Generation** — one-click PO dialog summarising restock quantities
- **AI Bulk Food Planner** — swipe-to-approve ingredient suggestions from an AI procurement agent, followed by an auto-generated 7-day cafeteria meal plan; approved items can be added to inventory in bulk
- **Priority Triage** — four-level patient priority system (Routine / Low / High / Critical) with live dot controls

### System
- **Session-based Auth** — cookie-backed sessions with role separation (doctor vs food admin)
- **In-memory TTL Cache** — 5-minute cache on expensive AI calls; cache busted on data mutations
- **Configurable Units** — weight (g/kg/oz/lb) and energy (kcal/kJ) preferences persisted per facility via the database

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, standalone output) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + inline CSS-in-JS |
| HTTP Client | Axios |
| Icons | [Lucide React](https://lucide.dev/) |
| Fonts | Google Fonts — Fraunces (serif), DM Sans |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Language | TypeScript |
| AI / LLM | [Groq SDK](https://groq.com/) — `llama-3.1-8b-instant` (default) |
| Database Client | `pg` (node-postgres) |
| Auth | Custom cookie sessions (`crypto.randomBytes`) |
| Middleware | CORS, `cookie-parser`, `express.json` |

### Database
| Layer | Technology |
|---|---|
| Host | [Supabase](https://supabase.com/) (PostgreSQL) |
| Connection | Supabase connection pooler (port 5432) |
| ORM | None — raw SQL via `pg.Pool` |
| SSL | `rejectUnauthorized: false` (Supabase-compatible) |

### Infrastructure
| Layer | Technology |
|---|---|
| Containerisation | Docker (multi-stage builds) |
| Registry | GitHub Container Registry (GHCR) |
| CI/CD | GitHub Actions |
| Deployment | SSH + Docker Compose on a self-hosted VPS |
| Reverse Proxy | nginx (config deployed alongside `docker-compose.yml`) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│              Next.js Frontend  (port 3001)              │
│         /patients  /meal-plans  /inventory  /manage     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP + cookies (axios)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Express Backend  (port 5000)               │
│                                                         │
│  Auth Controller   Patient Controller   AI Controller   │
│  Inventory Ctrl    Food Plan Ctrl       Settings Ctrl   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │            AI Engine (ai-engine.ts)              │   │
│  │  • Groq LLM (llama-3.1-8b-instant)              │   │
│  │  • Batch diet analysis                           │   │
│  │  • BMI / calorie calculation (Mifflin-St Jeor)  │   │
│  │  • Drug-food interaction detection               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────┐                               │
│  │  TTL Cache (5 min)  │  in-memory, prefix-busted     │
│  └─────────────────────┘                               │
└────────────────────────┬────────────────────────────────┘
                         │ pg.Pool (SSL)
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Supabase (PostgreSQL)                         │
│   patients · inventory · medications · allergies        │
│   settings · ai_logs                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
nutricare/
├── docker-compose.yml          # Production compose file
├── nginx.conf                  # Reverse proxy config
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: build → push GHCR → SSH deploy
│
├── backend/
│   ├── Dockerfile
│   ├── .env                    # Local dev only (never commit)
│   └── src/
│       ├── server.ts           # Express app entry point
│       ├── db/
│       │   └── index.ts        # pg.Pool setup
│       ├── routes/
│       │   └── index.ts        # All route definitions
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── patient.controller.ts
│       │   ├── inventory.controller.ts
│       │   ├── ai.controller.ts
│       │   ├── clinical.controller.ts
│       │   ├── foodplan.controller.ts
│       │   ├── meal-nutrition.controller.ts
│       │   └── settings.controller.ts
│       └── utils/
│           ├── ai-engine.ts    # Core LLM batch analysis
│           ├── cache.ts        # TTL cache class
│           └── units.ts        # SI unit normalisation & conversion
│
└── frontend/
    ├── Dockerfile              # Multi-stage Next.js build
    ├── next.config.ts          # standalone output
    ├── tailwind.config.ts
    └── app/
        ├── layout.tsx          # Root layout — sidebar, auth, settings providers
        ├── page.tsx            # Dashboard
        ├── SidebarShell.tsx    # Collapsible nav sidebar
        ├── patients/
        │   ├── page.tsx        # Patient directory + floor tabs
        │   └── [id]/page.tsx   # Patient detail + AI analysis
        ├── meal-plans/page.tsx # AI meal plans + nutrition facts modal
        ├── inventory/
        │   ├── page.tsx        # Inventory forecasting
        │   └── BulkPlanButton.tsx  # AI bulk food planner flow
        ├── manage/
        │   ├── page.tsx        # Admit patients, update stock
        │   └── actions.ts      # Form action helpers
        ├── settings/page.tsx   # Unit preferences
        └── signin/page.tsx     # Login page
    └── lib/
        ├── api.ts              # Typed API client (axios)
        ├── authContext.tsx     # Auth provider + useAuth hook
        ├── settingsContext.tsx # Settings provider + useSettings hook
        └── units.ts            # Frontend unit conversion helpers
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com/) project with the schema below
- A [Groq](https://console.groq.com/) API key

### Environment Variables

**`backend/.env`**
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/postgres"
GROQ_API_KEY="gsk_..."
GROQ_API_MODEL="llama-3.1-8b-instant"
FRONTEND_URL="http://localhost:3000"
PORT=5000
```

**`frontend/.env`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Running Locally

**Backend**
```bash
cd backend
npm install
npm start          # ts-node / compiled start
```

**Frontend**
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### Running with Docker

```bash
# From the project root
docker compose up --build
```

The frontend will be available on `http://localhost:3001` and the backend on `http://localhost:5000`.

---

## Database

SupaCare uses **Supabase** as its PostgreSQL host. All queries are raw SQL via `pg.Pool` — no ORM.

### Required Tables

```sql
-- Patients
CREATE TABLE patients (
  id          TEXT PRIMARY KEY,         -- e.g. 'P001'
  name        TEXT NOT NULL,
  age         INTEGER,
  room        TEXT,
  conditions  TEXT[],
  medications TEXT[],
  allergies   TEXT[],
  priority    INTEGER DEFAULT 0,        -- 0=routine, 1=low, 2=high, 3=critical
  height_cm   NUMERIC,
  weight_kg   NUMERIC
);

-- Inventory
CREATE TABLE inventory (
  id    TEXT PRIMARY KEY,               -- e.g. 'I001'
  name  TEXT NOT NULL,
  unit  TEXT NOT NULL,                  -- 'g' | 'ml' | 'pcs'
  stock INTEGER DEFAULT 0,
  tags  TEXT[] DEFAULT '{}'
);

-- Clinical options
CREATE TABLE medications (name TEXT PRIMARY KEY);
CREATE TABLE allergies   (name TEXT PRIMARY KEY);

-- AI audit log
CREATE TABLE ai_logs (
  id         SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  severity   TEXT,
  text       TEXT
);

-- Facility settings
CREATE TABLE settings (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  weight_unit TEXT DEFAULT 'g',
  energy_unit TEXT DEFAULT 'kcal',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

> **Note:** All inventory quantities are stored in SI base units — weight in **grams**, volume in **millilitres**, countables in **pieces**. Display conversion happens on the frontend.

---

## AI Engine

The AI engine (`backend/src/utils/ai-engine.ts`) uses the **Groq API** to run batch dietary analyses. Key behaviours:

- **Batch processing** — all patients are sent in a single prompt to minimise API calls
- **BMI-calibrated meals** — uses Mifflin-St Jeor to estimate daily calorie needs; meals are split ~25/35/40% across breakfast/lunch/dinner
- **Drug-food interactions** — the system prompt encodes clinical knowledge of Warfarin, MAOIs, ACE inhibitors, and more
- **Safe-food partitioning** — the LLM returns flagged food IDs; the backend splits inventory into `safeFoods` and `flaggedFoods` arrays
- **5-minute TTL cache** — results are cached in memory; writing to patients or inventory busts the relevant cache keys

### Supported Groq Models

Set `GROQ_API_MODEL` to any Groq-hosted model. Recommended:
- `llama-3.1-8b-instant` — fast, cost-effective (default)
- `llama-3.3-70b-versatile` — higher quality for food plan generation

---

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login with email + password |
| POST | `/auth/logout` | Clear session cookie |
| GET | `/auth/me` | Return current session user |

### Patients
| Method | Path | Description |
|--------|------|-------------|
| GET | `/patients` | List all patients (sorted by priority) |
| GET | `/patients/:id` | Get single patient |
| POST | `/patients` | Admit new patient |
| DELETE | `/patients/:id` | Discharge patient |
| PATCH | `/patients/:id/priority` | Update triage priority (0–3) |
| PATCH | `/patients/:id/bmi` | Update height/weight |

### Inventory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/inventory` | List all inventory items |
| POST | `/inventory` | Add new item |
| PATCH | `/inventory/:id` | Update stock level |

### AI Analysis
| Method | Path | Description |
|--------|------|-------------|
| GET | `/analysis/patient/:id` | Per-patient dietary analysis |
| GET | `/analysis/inventory-needs` | Bulk 7-day demand forecast for all items |
| GET | `/analysis/meal-plans` | AI meal plans for all patients |
| GET | `/analysis/logs` | Last 10 AI audit log entries |
| POST | `/analysis/meal-nutrition` | Nutrition breakdown for a named meal |

### Food Planning
| Method | Path | Description |
|--------|------|-------------|
| POST | `/food-plan/suggestions` | AI bulk ingredient suggestions |
| POST | `/food-plan/week-plan` | 7-day meal plan from approved ingredients |

### Clinical & Settings
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/medications` | List or add medication options |
| GET/POST | `/allergies` | List or add allergy options |
| GET | `/settings` | Get facility unit preferences |
| PATCH | `/settings` | Update unit preferences |

---

## Authentication

Authentication uses **server-side cookie sessions** — no JWTs, no third-party auth provider.

- Login generates a 32-byte random token via `crypto.randomBytes`
- Sessions are stored in an in-memory `Map` with an 8-hour TTL
- A `HttpOnly` cookie named `supacare_session` is set on the response
- Expired sessions are pruned every 60 seconds
- In production, the cookie is scoped to `.supacare.xcirno.dev` with `Secure: true`

**Demo credentials:**

| Role | Email | Password |
|------|-------|----------|
| Doctor | `doctor@supacare.health` | `unihack2026` |
| Food Admin | `food@supacare.health` | `unihack2026` |

---

## Deployment

Deployment is fully automated via **GitHub Actions** on push to `master` or `deploy`.

**Pipeline steps:**
1. Build backend Docker image and push to GHCR
2. Build frontend Docker image (injecting `NEXT_PUBLIC_API_URL` as a build arg) and push to GHCR
3. SSH into the VPS, copy `docker-compose.yml` and `nginx.conf`, pull latest images, and run `docker compose up -d`

**Required GitHub secrets:**

| Secret | Purpose |
|--------|---------|
| `SSH_HOST` | VPS IP or hostname |
| `SSH_USER` | SSH username |
| `SSH_PRIVATE_KEY` | SSH private key |
| `GH_TOKEN` | GHCR pull token |
| `DATABASE_URL` | Supabase connection string |
| `GROQ_API_KEY` | Groq API key |
| `GROQ_API_MODEL` | Model name |
| `FRONTEND_URL` | Public frontend origin (for CORS) |
| `NEXT_PUBLIC_API_URL` | Public backend URL |
| `NODE_ENV` | `production` |

---

## Configuration

### Unit Preferences

Weight and energy display units can be changed in **Settings** (`/settings`). Preferences are stored in the `settings` table in Supabase and applied globally across inventory, meal plans, and patient reports. A localStorage fallback is used if the backend is unreachable.

| Setting | Options | Default |
|---------|---------|---------|
| Weight unit | g, kg, oz, lb | g |
| Energy unit | kcal, kJ | kcal |

> All values are stored in SI units (g / ml / pcs) in the database. Conversion is display-only.

---

*Built for UniHack 2026.*