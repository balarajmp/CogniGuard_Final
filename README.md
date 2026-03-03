<div align="center">

# 🧠 CogniGuard
### A Privacy-First Platform for Cognitive Load & Burnout Detection

[![Next.js](https://img.shields.io/badge/Next.js_16-000?logo=nextdotjs&logoColor=fff)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=fff)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python_3.11+-3776AB?logo=python&logoColor=fff)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **CogniGuard** detects burnout before it happens — using on-device biometric signals, cognitive load patterns, and privacy-preserving AI. No raw data ever leaves your device.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧬 **Neural Vision** | Real-time facial fatigue tracking via on-device CV |
| 💓 **Bio-Sync** | Live heart rate + HRV monitoring with animated ECG |
| 🧠 **BrainCanvas** | Animated neural core that responds to scroll velocity via Lenis |
| 📊 **Burnout Dashboard** | Cognitive load score, stress trends, intervention cards |
| 🗺️ **Monthly Dot Matrix** | 12-week → single-month heatmap with smooth gradient (teal→cyan→red) |
| 🔐 **Vault Auth** | 3D glassmorphism login/register with biometric scanner UI |
| 🎯 **Calibration Wizard** | First-login BPM + keystroke baseline capture |
| 🛡️ **Protected Dashboard** | JWT-gated `/dashboard` Command Center |
| 🏢 **Enterprise Insights** | Team-level aggregated burnout analytics |
| 🧘 **Zen Interventions** | Rotating mindfulness micro-interventions |

---

## 🏗️ Architecture

```
CogniGuard_Final/
├── src/                          # Next.js 16 Frontend (TypeScript)
│   ├── app/
│   │   ├── page.tsx              # Landing page (hero + sections)
│   │   ├── login/page.tsx        # 3D vault login
│   │   ├── register/page.tsx     # Profile initialization
│   │   └── dashboard/page.tsx   # Protected Command Center
│   ├── components/
│   │   ├── BrainCanvas.tsx       # Lenis-synced neural animation
│   │   ├── CognitiveHistory.tsx  # Monthly dot matrix heatmap
│   │   ├── CalibrationScreen.tsx # First-login baseline wizard
│   │   ├── NeuralVisionCard.tsx  # Facial fatigue widget
│   │   ├── BioSyncWidget.tsx     # Heart rate + HRV widget
│   │   └── ...25+ more components
│   └── context/
│       └── AuthContext.tsx        # JWT auth + guest mode state
│
└── backend/                      # FastAPI Backend (Python)
    └── app/
        ├── main.py               # FastAPI app + CORS
        ├── api/v1/
        │   ├── auth.py           # POST /api/auth/register|login|guest
        │   ├── biometrics.py     # POST /api/biometrics/ingest
        │   ├── interventions.py  # GET  /api/interventions/
        │   └── enterprise.py    # GET  /api/enterprise/
        ├── services/
        │   ├── auth_service.py   # bcrypt hashing + JWT creation
        │   └── burnout_engine.py # Stress scoring algorithm
        ├── models/               # SQLAlchemy ORM models
        ├── schemas/              # Pydantic request/response schemas
        └── core/
            ├── security.py       # JWT signing + bcrypt
            └── config.py         # Pydantic settings (reads .env)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+

### 1. Clone & Install Frontend
```bash
git clone https://github.com/yourusername/CogniGuard.git
cd CogniGuard_Final
npm install
```

### 2. Setup Backend
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env           # Edit SECRET_KEY before production!
```

### 3. Start Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🔐 Authentication Flow

```
Landing (/)  →  Register (/register)  →  Calibration Wizard  →  Dashboard (/dashboard)
                Login    (/login)    ↗
                Guest Mode          ↗  (limited, no persistence)
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account (returns JWT) |
| `POST` | `/api/auth/login` | Login (OAuth2 form, returns JWT) |
| `POST` | `/api/auth/guest` | Guest token (1-hour expiry) |
| `GET`  | `/api/auth/me` | Get current user profile |
| `POST` | `/api/biometrics/ingest` | Submit biometric reading |
| `GET`  | `/api/biometrics/history` | Fetch stress history |

Interactive API docs: **http://127.0.0.1:8000/docs**

---

## 🧘 How Zen Interventions Work

CogniGuard's burnout engine runs a scoring algorithm on every biometric reading:

```
Stress Score = 0.40×(HR_deviation) + 0.35×(HRV_drop) + 0.25×(Typing_slowdown)
```

When the score crosses a threshold:
- **40–65%** → *Elevated* — Breathing reminder card appears
- **65–85%** → *High* — Guided focus break suggestion
- **85%+** → *Critical* — Zen Intervention modal with rotating mindfulness prompts

All computation happens **on-device**. Zero biometric data is sent to any cloud server.

---

## 🛡️ Privacy Architecture

- ✅ On-device signal processing — raw biometrics never transmitted
- ✅ bcrypt password hashing (cost factor 12)
- ✅ JWT tokens with configurable expiry
- ✅ Explicit CORS allowlist — no wildcard origins with credentials
- ✅ SQLite for local dev; PostgreSQL-ready for production
- ✅ `.env` excluded from git; `.env.example` provided as template

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, Framer Motion, Lenis |
| **State** | React Context API + localStorage JWT persistence |
| **Backend** | FastAPI, SQLAlchemy 2.0, Pydantic v2, aiosqlite |
| **Auth** | python-jose (JWT), passlib + bcrypt |
| **Realtime** | WebSocket telemetry endpoint |
| **Icons** | lucide-react |

---

## 👨‍💻 Architect

<div align="center">

**Balaraj M P**
*Systems Architect · CogniGuard*

[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=fff)](https://github.com/balarajmp)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=fff)](https://linkedin.com/in/balarajmp)

</div>

---

<div align="center">
<sub>Built with 🧠 · Privacy first · Zero raw biometric transmission</sub>
</div>
