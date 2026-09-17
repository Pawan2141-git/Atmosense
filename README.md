# Atmosense 🌩️

**AI-Powered Hyperlocal Severe Weather Nowcasting & Early Warning System**

Atmosense provides 2–6 hour probabilistic predictions for thunderstorms, cloudbursts, and flash floods with explainable meteorological diagnosis — focused on India's high-risk regions like Uttarakhand, Western Ghats, and urban centers.

---

## Features

- ⚡ **Thunderstorm Prediction** — CAPE, convergence, wind shear based scoring
- 🌧️ **Cloudburst Detection** — IWV, QPE, CTT drop rate analysis
- 🌊 **Flash Flood Risk** — Terrain-aware risk engine (slope, drainage, flow accumulation)
- 🗺️ **Spatial Grid Predictions** — Up to 7×7 grid at 0.25° resolution
- 🔍 **Explainable AI (XAI)** — Meteorological diagnosis for every prediction
- 📡 **Live Data** — Open-Meteo API integration with DEMO fallback
- 🚨 **Alert Engine** — Severity-based alerts (Watch → Warning → Severe → Extreme)

---

## Project Structure

```
Atmosense/
├── backend/          # FastAPI Python backend
│   ├── api/          # REST API endpoints
│   ├── core/         # Settings & enums
│   ├── data/         # Data adapters (Open-Meteo, Demo)
│   ├── features/     # Feature engineering
│   ├── ml/           # Prediction model
│   ├── risk/         # Risk engine & flash flood
│   ├── alerts/       # Alert engine
│   ├── xai/          # Explainable AI
│   └── main.py       # App entry point
└── frontend/         # Next.js frontend
```

---

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs available at: `http://localhost:8000/docs`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `ATMOSENSE_DATA_MODE` | `LIVE`, `DEMO`, or `BACKTEST` | `DEMO` |
| `ATMOSENSE_CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `CARTO_API_TOKEN` | CARTO basemap API token (optional) | `` |

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/predictions` | Hazard prediction grid |
| `GET /api/risk` | Risk map zones |
| `GET /api/risk/flash-flood` | Flash flood risk |
| `GET /api/alerts` | Active weather alerts |
| `GET /api/xai` | Explainable AI diagnosis |
| `GET /api/atmospheric/features` | Atmospheric features |

---

## Disclaimer

> **PROTOTYPE**: This is a demonstration system. Predictions are NOT official meteorological warnings from IMD or any operational forecasting agency. Do not use for real emergency decisions.

---

## Tech Stack

- **Backend**: FastAPI, Python, NumPy, Pydantic
- **Frontend**: Next.js, TypeScript, Tailwind CSS, Leaflet
- **Data**: Open-Meteo API, Demo synthetic data
- **Deployment**: Render (backend), Vercel (frontend)
