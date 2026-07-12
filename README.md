# 🌍 EcoSphere — ESG Management Platform

**EcoSphere** is a full-stack ESG (Environmental, Social, Governance) management platform that enables organizations to track carbon emissions, manage CSR activities, enforce governance policies, and gamify employee sustainability engagement — all within a unified dashboard with role-based access, versioned emission factors, and snapshot-based ESG scoring.

---

## Tech Stack

| Layer        | Technology                                      |
|-------------|------------------------------------------------|
| **Backend**  | Python 3.8+, Django 4.2, Django REST Framework   |
| **Auth**     | SimpleJWT (access + refresh tokens)              |
| **Frontend** | React 18 (Vite), Recharts, Lucide Icons          |
| **Database** | SQLite (dev) — swap to PostgreSQL for production  |
| **Styling**  | Custom CSS design system (Google Material-inspired) |

---

## Quick Start

### 1. Clone & Backend Setup

```bash
git clone https://github.com/Vraj-Ramavat/Odoo-review-repo.git
cd Odoo-review-repo

# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data   # ← seeds everything, idempotent
```

### 2. Frontend Setup

```bash
cd ../frontend
npm install
```

### 3. Run the App

Open **3 terminals**:

```bash
# Terminal 1 — Django API
cd backend
python manage.py runserver 8000

# Terminal 2 — React Frontend
cd frontend
npm run dev

# Terminal 3 (optional) — Odoo Webhook test
# See "Odoo Integration" section below
```

Frontend runs at **http://localhost:5174** and proxies API requests to **http://localhost:8000**.

---

## Demo Login Credentials

| Role              | Username          | Password          |
|-------------------|-------------------|--------------------|
| **Admin**         | `admin`           | `EcoSphere2026!`   |
| **Department Head** | `sarah.chen`    | `EcoSphere2026!`   |
| **Employee**      | `james.wilson`    | `EcoSphere2026!`   |

All 18 demo users share the same password: `EcoSphere2026!`

---

## Odoo Integration (Bonus)

A webhook endpoint allows external ERP systems (e.g., Odoo) to push transaction data that auto-creates carbon records:

```
POST /api/integrations/odoo/webhook/
```

**Example curl command** (run while the backend server is running):

```bash
curl -X POST http://localhost:8000/api/integrations/odoo/webhook/ \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "purchase",
    "source_reference_id": "PO-2026-0042",
    "department_code": "ENG",
    "activity_type": "Electricity - Grid",
    "quantity": 5000,
    "date": "2026-07-12"
  }'
```

This looks up the Department by `code`, finds the active EmissionFactor for `Electricity - Grid`, and auto-creates a `CarbonTransaction` with computed emissions — the same logic the internal ERP signal uses.

---

## Key Design Decisions

### 1. Versioned EmissionFactor with `on_delete=PROTECT`

Emission factors change over time (DEFRA publishes updates yearly). Instead of mutating existing factors in-place (which would corrupt historical data), EcoSphere uses a **versioning strategy**:

- Creating a new factor for an existing `activity_type` automatically sets `effective_to` and `is_active=False` on the old version.
- `CarbonTransaction.emission_factor` uses `on_delete=PROTECT` — you cannot delete a factor that has linked transactions, preserving audit integrity.
- The UI shows both active and retired factors with a "Show retired" toggle.

### 2. JSON-Driven Badge Unlock Rule Engine

Instead of hard-coding badge logic, each `Badge` model stores an `unlock_rule` as a JSON field:

```json
{"type": "xp_threshold", "value": 500}
{"type": "challenges_completed", "value": 3}
{"type": "csr_participations", "value": 2}
```

The `Badge.check_eligibility(user)` method is a generic evaluator that interprets any rule type — adding a new badge type requires zero code changes, just a new JSON rule in the admin panel.

### 3. Snapshot-Based ESG Score Rollup

ESG scores are **never computed live** — they're snapshot records (`DepartmentScore`) created periodically. This means:

- Dashboard and leaderboard reads are always fast (no N+1 aggregation queries).
- Historical scores are preserved for trend analysis.
- The calculation service weighs Environmental (40%), Social (30%), and Governance (30%) based on `ESGConfiguration`.

---

## Project Structure

```
├── backend/
│   ├── accounts/        # User model, JWT auth, role-based permissions
│   ├── core/            # Department, Category, ESGConfiguration, seed command
│   ├── carbon/          # EmissionFactor, CarbonTransaction, EnvironmentalGoal
│   ├── social/          # CSRActivity, EmployeeParticipation
│   ├── governance/      # ESGPolicy, Audit, ComplianceIssue
│   ├── gamification/    # Challenge, Badge, Reward, DepartmentScore
│   ├── notifications/   # Notification inbox
│   └── ecosphere/       # Django settings, root URLs
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios client with JWT interceptor
│   │   ├── components/  # Layout, Sidebar
│   │   ├── context/     # AuthContext (React Context + JWT)
│   │   └── pages/       # All page components
│   └── vite.config.js   # Dev proxy to Django
└── README.md
```

---

## License

Built for the Odoo x Charusat Hackathon 2026.
