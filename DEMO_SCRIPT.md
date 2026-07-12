# 🎬 EcoSphere — Live Demo Script (3-4 minutes)

> **Setup**: Backend running on port 8000, frontend on port 5174.
> Run `python manage.py seed_demo_data` before the demo to ensure fresh data.

---

## Scene 1 — Admin Dashboard (30 sec)

**What to say:** "EcoSphere gives organizations a single pane of glass for their ESG performance. The dashboard breaks down emissions by scope, shows trending data, and tracks goal progress — all computed from real operational data, not manually entered KPIs."

**Click path:**
1. Open `http://localhost:5174` → login as `admin` / `EcoSphere2026!`
2. Land on **Dashboard** — point out the KPI summary cards
3. Click **Env Dashboard** in sidebar → show the emissions trend chart (8 weeks of data trending downward = improvement), scope breakdown pie chart, and department bar chart
4. Scroll down → point out **Goals Progress** (achieved/on-track/at-risk counts)

---

## Scene 2 — Versioned Emission Factors (30 sec)

**What to say:** "Carbon accounting needs audit-proof data. When DEFRA updates an emission factor, we don't overwrite the old one — we version it. Old transactions keep their original factor for accuracy. And if a factor has linked transactions, Django's PROTECT constraint prevents accidental deletion."

**Click path:**
1. Click **Emission Factors** in sidebar
2. Check the **"Show retired"** checkbox to reveal the superseded `Electricity - Grid (DEFRA 2024)` factor alongside the current `DEFRA 2025` version
3. Point out the scope badges (S1/S2/S3) and effective dates
4. Optionally click the delete icon on the active Electricity factor → show the PROTECT error toast

---

## Scene 3 — Carbon Transactions & Auto-Calc (30 sec)

**What to say:** "Transactions come in two ways: manual entries by staff, or auto-calculated records from our ERP integration signals. When a purchase order or fleet log hits the system, we automatically look up the right emission factor and compute the carbon impact — no human in the loop."

**Click path:**
1. Click **Carbon Transactions** in sidebar
2. Point out the **Auto-Calculated** stat card showing signal-driven entries
3. Show the `⚡ Auto` badges vs `Manual` badges in the Type column
4. Use the scope and source dropdown filters to narrow the view

---

## Scene 4 — Odoo Webhook Integration (30 sec)

**What to say:** "For the Odoo bonus, we built a webhook endpoint. I'll fire a real HTTP request right now that simulates Odoo sending us a purchase order — watch the transaction appear live."

**Click path:**
1. Open a terminal and run:
   ```
   curl -X POST http://localhost:8000/api/integrations/odoo/webhook/ \
     -H "Content-Type: application/json" \
     -d '{"source_type":"purchase","source_reference_id":"PO-LIVE-DEMO","department_code":"OPS","activity_type":"Natural Gas","quantity":250,"date":"2026-07-12"}'
   ```
   *(On Windows PowerShell, use `Invoke-RestMethod` — see README)*
2. Show the JSON response: `"Carbon transaction created: 505.00 kgCO2e"`
3. Refresh the **Carbon Transactions** page → new auto-calculated entry appears at the top

---

## Scene 5 — Environmental Goals (20 sec)

**What to say:** "Teams set measurable environmental goals with progress tracking. Each goal has a status — on track, at risk, or achieved — with visual progress bars."

**Click path:**
1. Click **Goals** in sidebar
2. Point out the **"Zero Waste to Landfill"** goal at 100% — Achieved badge
3. Point out **"Achieve 50% Renewable Energy"** — At Risk with amber accent
4. Show the deadline and department assignment on each card

---

## Scene 6 — Organization Dashboard Overview (30 sec)

**What to say:** "The main dashboard gives a high-level view across all departments — employee count, user roles, and quick access to every module."

**Click path:**
1. Click **Dashboard** in sidebar
2. Point out the summary cards (total departments, users by role, categories)
3. Show the quick-access cards linking to each module
4. Point out the sidebar navigation covering all ESG pillars

---

## Scene 7 — Key Architecture Highlights (30 sec)

**What to say:** "Three design decisions differentiate EcoSphere: First, versioned emission factors with PROTECT constraints for audit integrity. Second, a JSON-driven badge rule engine — adding a new badge type requires zero code changes, just a JSON rule. Third, snapshot-based ESG scoring — never computed live, always fast reads from pre-calculated snapshots."

**Click path:**
1. This is a verbal point — no clicks needed
2. Optionally show the `Badge` model's `unlock_rule` field in Django admin (`/admin/gamification/badge/`) to demonstrate the JSON rule structure

---

## Timing Guide

| Scene | Duration | Running Total |
|-------|----------|--------------|
| 1. Admin Dashboard | 30s | 0:30 |
| 2. Emission Factors | 30s | 1:00 |
| 3. Carbon Transactions | 30s | 1:30 |
| 4. Odoo Webhook | 30s | 2:00 |
| 5. Environmental Goals | 20s | 2:20 |
| 6. Organization Dashboard | 30s | 2:50 |
| 7. Architecture Highlights | 30s | 3:20 |

**Total: ~3:20** — leaves 40 seconds for Q&A buffer.

---

## Quick Troubleshooting

- **Blank dashboard?** → Run `python manage.py seed_demo_data`
- **Login fails?** → Password is `EcoSphere2026!` (with exclamation mark)
- **Webhook 404?** → Check backend is running on port 8000
- **Charts not loading?** → Check `recharts` is installed: `cd frontend && npm install`
