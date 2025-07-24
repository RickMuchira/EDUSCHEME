# PROJECT_MAP.md

---

## 👷‍♂️ Admin View

**Project Type:**  
- Next.js (React) frontend + FastAPI backend (Python)  
- AI-powered curriculum scheme generator for Kenyan education

### 📁 Top-Level Directories
- 📁 `backend/` — FastAPI backend, API, DB, AI, and business logic
- 📁 `frontend/` — Next.js frontend app, UI, and routes
- 📄 `README.md` — Project overview and setup
- 📄 `debug_timetable.html`, `test_api.html` — Debug/test HTML files

### ⚙️ Key Configuration Files
- 📄 `backend/requirements.txt` — Python backend dependencies
- 📄 `frontend/package.json` — Frontend dependencies and scripts
- 📄 `frontend/tsconfig.json` — TypeScript config for frontend
- 📄 `.gitignore` — VCS ignore rules

### 🗄️ Data Layer
- 📄 `backend/models.py` — SQLAlchemy ORM models
- 📄 `backend/schemas.py` — Pydantic schemas for API
- 📄 `backend/seed_data.py` — DB seed scripts
- 📄 `backend/add_ai_columns.py`, `backend/add_timetable_tables.py` — Migration scripts
- 📄 `backend/database.py` — DB connection setup

### 🚀 Deployment / Infra
- No Dockerfile or docker-compose found (add if deploying with containers)
- Run backend: `uvicorn main:app`
- Run frontend: `npm run dev` (Next.js)
- Environment: Set `GROQ_API_KEY` for AI features

---

## 🧑‍💻 User View

### 🚪 Entry Points
- Backend: 📄 `backend/main.py` (`uvicorn main:app`)
- Frontend: 📄 `frontend/src/app/page.tsx` (root page), `frontend/src/app/admin/page.tsx` (admin)

### 🔗 Pages / Routes (Frontend)
- 🔗 `/` — Home page (`frontend/src/app/page.tsx`)
- 🔗 `/admin` — Admin dashboard (`frontend/src/app/admin/page.tsx`)
- 🔗 `/admin/subjects` — Manage subjects (`frontend/src/app/admin/subjects/page.tsx`)
- 🔗 `/dashboard` — User dashboard (`frontend/src/app/dashboard/page.tsx`)
- 🔗 `/dashboard/timetable` — Timetable view (`frontend/src/app/dashboard/timetable/page.tsx`)
- 🔗 `/dashboard/scheme-of-work` — Scheme of work (`frontend/src/app/dashboard/scheme-of-work/page.tsx`)
- 🔗 `/login` — Login page (`frontend/src/app/login/page.tsx`)

### 🛠️ Key API Endpoints (Backend)
- `GET /health` — Health check
- `POST /api/schemes/generate` — Generate scheme (Biology Form 2 Term 1)
- `GET /api/schemes/{id}` — Get scheme by ID
- `PUT /api/schemes/{id}/content` — Save scheme content
- `GET /api/timetables/by-scheme/{scheme_id}` — Get timetable for a scheme

### 🧩 Shared Components / Utilities (Frontend)
- 📁 `frontend/src/components/ui/` — UI primitives (button, dialog, alert, etc.)
- 📁 `frontend/src/components/admin/` — Admin-specific components (subject-card, subject-form)
- 📁 `frontend/src/app/dashboard/timetable/components/` — Timetable UI (TimetableGrid, LessonSlot, AITipsPanel)
- 📁 `frontend/src/lib/` — Shared utilities (api.ts, auth.ts, utils.ts)

---

**Note:**  
- Build artifacts, lock files, and virtual environments are omitted for clarity.
- For deployment, consider adding Docker or CI/CD configs if needed. 