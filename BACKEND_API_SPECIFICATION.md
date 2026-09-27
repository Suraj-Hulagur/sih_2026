# Backend Architecture & API Specification
**Project:** SIH 2026 — SIF Precursor Detection (Oil India Limited)  
**Document Version:** 1.0  
**Target Backend Framework:** FastAPI (Python 3.10+) with Uvicorn  

---

## 1. Executive Architecture

The backend serves as the bridge between the **AI/NLP Safety Chain Logic Engine** (Ollama LLM, Rule Engine, Out-of-Fold Triangulation) and the **Frontend HSSE Insight Dashboard**.

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Dashboard (React / Vercel)       │
│           https://oil-india-hsse-insight.vercel.app         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON & Multipart
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 FastAPI Server (src/api_server.py)          │
│   • CORS Enabled for Vercel & localhost:5173                │
│   • Pydantic Request/Response Validation                    │
│   • Multi-Format Ingestion (CSV, XLSX, PDF)                 │
└──────┬───────────────────────┼───────────────────────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  LLM Reader  │       │  Rule Engine │       │ Consensus    │
│  llm_client  │──────▶│ rule_engine  │──────▶│ final_voter  │
│(qwen2.5/Groq)│       │(High Energy  │       │(3-Method     │
│              │       │× Fail Barrier)       │ Triangulation│
└──────────────┘       └──────────────┘       └──────────────┘
```

---

## 2. Recommended Server Setup

Add these dependencies to your root `requirements.txt`:
```txt
fastapi>=0.110.0
uvicorn[standard]>=0.28.0
python-multipart>=0.0.9
openpyxl>=3.1.2
```

Run the API server locally:
```bash
uvicorn src.api_server:app --host 0.0.0.0 --port 8000 --reload
```

---

## 3. Required Endpoints Specification

### 3.1 Single Narrative Live Analysis
*For the "Test Single Narrative" modal on the dashboard.*

- **Endpoint:** `POST /api/analyze/single`
- **Content-Type:** `application/json`

#### Request Payload
```json
{
  "narrative": "scaffolding par kaam kar raha tha bina safety belt ke. height almost 10 meter tha, fall arrestor nahi lagaya.",
  "site": "Duliajan",
  "activity": "Erection / Painting"
}
```

#### Response Payload (`200 OK`)
```json
{
  "report_id": "live_9201",
  "narrative": "scaffolding par kaam kar raha tha bina safety belt ke. height almost 10 meter tha, fall arrestor nahi lagaya.",
  "site": "Duliajan",
  "activity": "Working at Height",
  "extracted_features": {
    "energy_type": "gravity",
    "energy_magnitude": "high",
    "barrier_expected": "safety belt / fall arrestor",
    "barrier_state": "missing",
    "evidence_phrases": [
      "bina safety belt ke",
      "fall arrestor nahi lagaya",
      "height almost 10 meter tha"
    ]
  },
  "triage": {
    "sif_potential": true,
    "classification": "SIF-Potential",
    "primary_iogp_rule": "Working at Height",
    "iogp_rules": ["Working at Height"],
    "rule_icon": "height",
    "consensus_status": "SIF_CONFIRMED",
    "consensus_label": "3/3 Models Agree (SIF Precursor)"
  }
}
```

---

### 3.2 Batch File Upload & Ingestion
*Supports CSV spreadsheets, Excel workbooks, and OISD PDF case studies.*

- **Endpoint:** `POST /api/ingest/upload`
- **Content-Type:** `multipart/form-data`

#### Form Parameters
- `file`: Binary file (`.csv`, `.xlsx`, `.xls`, `.pdf`)
- `site_override`: (Optional) String specifying the facility if not included in the file columns.

#### Processing Steps
1. **Detect Type:**
   - If `.csv` or `.xlsx`: Read tabular rows via `pandas` (looks for columns matching `narrative`, `observation`, `description`, `site`, `activity`).
   - If `.pdf`: Parse using `src/data_pipeline/process_oisd.py` (extracts *Brief of Incident* and *Observations/Lapses* sections).
2. **Execute Safety Chain Logic:**
   - Run `extract_features()` from `src/llm_client.py`.
   - Run `determine_sif()` and `tag_iogp_rule()` from `src/rule_engine.py`.
3. **Persist to Database / Memory:**
   - Append to `data/processed/classified_reports.json`.

#### Response Payload (`200 OK`)
```json
{
  "status": "success",
  "file_name": "duliajan_weekly_observations.xlsx",
  "file_type": "xlsx",
  "records_processed": 64,
  "sif_precursors_flagged": 14,
  "non_sif_count": 50,
  "sample_records": [
    {
      "id": "upl_001",
      "date": "24 Jun 2024",
      "excerpt": "Worker opened high-pressure line without isolation...",
      "site": "Duliajan",
      "activity": "Maintenance",
      "rule": "Energy Isolation",
      "classification": "SIF-Potential"
    }
  ]
}
```

---

### 3.3 Dashboard Overview KPIs
*Powers the 4 top metric cards on the main dashboard.*

- **Endpoint:** `GET /api/dashboard/stats`
- **Query Params (Optional):** `?site=All%20Sites&date_from=2024-01-01&date_to=2024-06-30`

#### Response Payload (`200 OK`)
```json
{
  "date_range": {
    "from": "01 Jan 2024",
    "to": "30 Jun 2024"
  },
  "total_reports": {
    "count": 12482,
    "change_pct": 18,
    "change_trend": "up",
    "change_label": "vs previous period"
  },
  "sif_potential": {
    "count": 2781,
    "pct": 22.3,
    "change_pct": 12,
    "change_trend": "up",
    "change_label": "vs previous period"
  },
  "non_sif": {
    "count": 9701,
    "pct": 77.7,
    "change_pct": 8,
    "change_trend": "down",
    "change_label": "vs previous period"
  },
  "recurring_precursor_patterns": {
    "count": 47,
    "change_pct": 27,
    "change_trend": "up",
    "change_label": "vs previous period"
  }
}
```

---

### 3.4 Dashboard Charts & Distributions
*Powers the 3 middle charts and the monthly timeline trend.*

- **Endpoint:** `GET /api/dashboard/charts`

#### Response Payload (`200 OK`)
```json
{
  "classification": [
    { "name": "SIF-Potential", "value": 2781, "pct": 22, "color": "#ea384c" },
    { "name": "Non-SIF", "value": 9701, "pct": 78, "color": "#7cb5f9" }
  ],
  "by_iogp_rule": [
    { "rule": "Energy Isolation", "count": 460, "icon": "lock", "color": "#ea384c" },
    { "rule": "Line of Fire", "count": 390, "icon": "lineoffire", "color": "#f97316" },
    { "rule": "Confined Space", "count": 340, "icon": "confined", "color": "#eab308" },
    { "rule": "Hot Work", "count": 310, "icon": "hotwork", "color": "#0284c7" },
    { "rule": "Work at Height", "count": 280, "icon": "height", "color": "#0d9488" },
    { "rule": "Driving", "count": 210, "icon": "driving", "color": "#0891b2" },
    { "rule": "Other", "count": 190, "icon": "other", "color": "#94a3b8" }
  ],
  "by_report_type": [
    { "name": "UA Observations", "count": 5620, "pct": 45, "color": "#1e3a8a" },
    { "name": "UC Observations", "count": 3140, "pct": 25, "color": "#2563eb" },
    { "name": "Near Miss", "count": 2480, "pct": 20, "color": "#60a5fa" },
    { "name": "Incident", "count": 1242, "pct": 10, "color": "#bfdbfe" }
  ],
  "monthly_trend": [
    { "month": "Jan", "sif": 310, "nonSif": 680 },
    { "month": "Feb", "sif": 330, "nonSif": 710 },
    { "month": "Mar", "sif": 350, "nonSif": 790 },
    { "month": "Apr", "sif": 420, "nonSif": 720 },
    { "month": "May", "sif": 460, "nonSif": 820 },
    { "month": "Jun", "sif": 510, "nonSif": 880 }
  ]
}
```

---

### 3.5 Operational Rankings
*Powers the Top 5 Sites, Top Activities, and Recurring Precursors.*

- **Endpoint:** `GET /api/dashboard/rankings`

#### Response Payload (`200 OK`)
```json
{
  "top_sites": [
    { "rank": 1, "site": "Duliajan", "totalReports": 2180, "sifReports": 612, "density": 28.1 },
    { "rank": 2, "site": "Naharkatiya", "totalReports": 1540, "sifReports": 420, "density": 27.3 },
    { "rank": 3, "site": "Moran", "totalReports": 1230, "sifReports": 310, "density": 25.2 },
    { "rank": 4, "site": "Digboi", "totalReports": 980, "sifReports": 210, "density": 21.4 },
    { "rank": 5, "site": "Baghjan", "totalReports": 860, "sifReports": 160, "density": 18.6 }
  ],
  "top_activities": [
    { "rank": 1, "activity": "Maintenance", "sifReports": 620, "maxSif": 650 },
    { "rank": 2, "activity": "Operation", "sifReports": 480, "maxSif": 650 },
    { "rank": 3, "activity": "Construction", "sifReports": 320, "maxSif": 650 },
    { "rank": 4, "activity": "Inspection", "sifReports": 210, "maxSif": 650 },
    { "rank": 5, "activity": "Material Handling", "sifReports": 180, "maxSif": 650 }
  ],
  "recurring_patterns": [
    { "rank": 1, "pattern": "Bypassing isolation / LOTO", "count": 182, "trend": "up" },
    { "rank": 2, "pattern": "Working in Line of Fire", "count": 160, "trend": "up" },
    { "rank": 3, "pattern": "Inadequate gas testing (Confined Space)", "count": 142, "trend": "up" },
    { "rank": 4, "pattern": "Working at height without fall protection", "count": 118, "trend": "up" },
    { "rank": 5, "pattern": "Permit to Work violations", "count": 104, "trend": "up" }
  ]
}
```

---

### 3.6 Reports Ledger
*Powers the search and filterable table on the "Reports" page.*

- **Endpoint:** `GET /api/reports`
- **Query Params:**
  - `search`: string keyword
  - `status`: `ALL` | `SIF` | `NON_SIF` | `REVIEW`
  - `site`: string or `ALL`
  - `rule`: string or `ALL`
  - `page`: integer (default `1`)
  - `limit`: integer (default `20`)

#### Response Payload (`200 OK`)
```json
{
  "total": 12482,
  "page": 1,
  "limit": 20,
  "reports": [
    {
      "id": "HIN-0001",
      "date": "12 Jun 2024",
      "excerpt": "Worker opened a high-pressure line for maintenance without isolation and without LOTO lock.",
      "site": "Duliajan",
      "activity": "Pipeline Maintenance",
      "language": "Hinglish / EN",
      "rule": "Energy Isolation",
      "rule_icon": "lock",
      "classification": "SIF-Potential",
      "energy_type": "Pressure / Mechanical",
      "energy_magnitude": "High",
      "barrier_expected": "LOTO Lock & Energy Isolation Valve",
      "barrier_state": "Missing",
      "evidence_phrases": [
        "without isolation",
        "without LOTO lock"
      ],
      "m1_rule_engine": true,
      "m2_random_forest": true,
      "m3_raw_text": true,
      "consensus": "SIF_CONFIRMED"
    }
  ]
}
```

---

### 3.7 Data Export Endpoint
*Powers the "Export" page downloads.*

- **Endpoint:** `POST /api/export`
- **Payload:**
```json
{
  "format": "xlsx", // "xlsx" | "csv" | "pdf" | "json"
  "only_sif": true,
  "include_evidence": true,
  "site": "All Sites"
}
```
- **Response:** File attachment with `Content-Disposition: attachment; filename="oil_india_hsse_sif_report.xlsx"`

---

## 4. Ready-to-Run Starter Boilerplate (`src/api_server.py`)

Create `src/api_server.py` in your repository:

```python
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import sys

# Ensure local imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rule_engine import determine_sif, tag_iogp_rule
from llm_client import extract_features

app = FastAPI(
    title="Oil India HSSE Insight — SIF Precursor Detection API",
    version="1.0.0"
)

# ─── CORS: Allow Frontend Access ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://oil-india-hsse-insight.vercel.app",
        "https://oil-hsse-insight.vercel.app",
        "https://oil-india-sif.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    narrative: str
    site: Optional[str] = "Duliajan"
    activity: Optional[str] = "General Operation"

@app.get("/")
def health_check():
    return {"status": "online", "service": "Oil India HSSE SIF Engine"}

@app.post("/api/analyze/single")
def analyze_single(req: AnalyzeRequest):
    if not req.narrative.strip():
        raise HTTPException(status_code=400, detail="Narrative cannot be empty")
        
    try:
        # Step 1: LLM Extraction
        features = extract_features(req.narrative)
        
        # Step 2: Deterministic Rule Engine
        is_sif = determine_sif(features)
        iogp_tags = tag_iogp_rule(features)
        primary_rule = iogp_tags[0] if iogp_tags else "No specific LSR match"
        
        return {
            "report_id": f"live_{abs(hash(req.narrative)) % 10000}",
            "narrative": req.narrative,
            "site": req.site,
            "activity": req.activity,
            "extracted_features": features,
            "triage": {
                "sif_potential": is_sif,
                "classification": "SIF-Potential" if is_sif else "Non-SIF",
                "primary_iogp_rule": primary_rule,
                "iogp_rules": iogp_tags,
                "consensus_status": "SIF_CONFIRMED" if is_sif else "SAFE"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 5. Summary Checklist for Backend Developers
- [x] Run `pip install fastapi uvicorn python-multipart openpyxl`
- [x] Implement the 7 endpoints documented above.
- [x] Configure CORS to accept `https://oil-india-hsse-insight.vercel.app`.
- [x] Test endpoints visually using the automatic Swagger UI docs at `http://localhost:8000/docs`.
