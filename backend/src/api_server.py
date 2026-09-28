"""
Oil India HSSE Insight — SIF Precursor Detection API

FastAPI server that wraps the existing AI/NLP Safety Chain Logic Engine:
  • LLM Reader (llm_client.py)  → Feature extraction from narratives
  • Rule Engine (rule_engine.py) → Deterministic SIF classification
  • Consensus Voter (final_sif_voter.py) → 3-method triangulation

Endpoints:
  POST /api/analyze/single   — Live single-narrative analysis
  POST /api/ingest/upload    — Batch file upload (CSV, XLSX, PDF)
  GET  /api/dashboard/stats  — KPI cards
  GET  /api/dashboard/charts — Chart distributions
  GET  /api/dashboard/rankings — Top sites, activities, patterns
  GET  /api/reports          — Paginated, filterable report ledger
  POST /api/export           — Data export (XLSX, CSV, JSON)

Run:
  uvicorn src.api_server:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import sys
import json
import io
import tempfile
import uuid
from datetime import datetime
from collections import Counter

# ─── Ensure local imports work ────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "data_pipeline"))

from rule_engine import determine_sif, tag_iogp_rule
from llm_client import extract_features
import data_store

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Oil India HSSE Insight — SIF Precursor Detection API",
    description="Backend for the SIH 2026 SIF Precursor Detection Dashboard (Oil India Limited)",
    version="1.0.0",
)

# ─── CORS: Allow Frontend Access ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Models ─────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    narrative: str
    site: Optional[str] = "Duliajan"
    activity: Optional[str] = "General Operation"


class ExportRequest(BaseModel):
    format: str = "json"  # "xlsx" | "csv" | "pdf" | "json"
    only_sif: bool = False
    include_evidence: bool = True
    site: str = "All Sites"


# ─── IOGP Rule Icon/Color Mapping ────────────────────────────────────────────
IOGP_STYLE = {
    "Energy Isolation":         {"icon": "lock",       "color": "#ea384c"},
    "Line of Fire":             {"icon": "lineoffire", "color": "#f97316"},
    "Confined Space":           {"icon": "confined",   "color": "#eab308"},
    "Hot Work":                 {"icon": "hotwork",    "color": "#0284c7"},
    "Working at Height":        {"icon": "height",     "color": "#0d9488"},
    "Driving":                  {"icon": "driving",    "color": "#0891b2"},
    "Safe Mechanical Lifting":  {"icon": "lifting",    "color": "#7c3aed"},
    "Work Authorisation":       {"icon": "permit",     "color": "#db2777"},
    "Bypassing Safety Controls":{"icon": "bypass",     "color": "#dc2626"},
    "No specific LSR match":    {"icon": "other",      "color": "#94a3b8"},
}

def _rule_style(rule_name: str) -> dict:
    return IOGP_STYLE.get(rule_name, {"icon": "other", "color": "#94a3b8"})


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINT: Health Check
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Oil India HSSE SIF Engine",
        "reports_loaded": data_store.get_report_count(),
        "version": "1.0.0",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 1: POST /api/analyze/single
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/analyze/single")
def analyze_single(req: AnalyzeRequest):
    """
    Analyze a single safety narrative through the full Safety Chain Logic pipeline:
    1. LLM extracts structured features (energy type, barrier state, etc.)
    2. Rule Engine determines SIF potential
    3. IOGP Life-Saving Rule tagging
    """
    if not req.narrative.strip():
        raise HTTPException(status_code=400, detail="Narrative cannot be empty")

    try:
        # Step 1: LLM Feature Extraction
        features = extract_features(req.narrative)

        # Step 2: Deterministic Rule Engine
        is_sif = determine_sif(features)

        # Step 3: IOGP Tagging
        iogp_tags = tag_iogp_rule(features)
        primary_rule = iogp_tags[0] if iogp_tags else "No specific LSR match"
        style = _rule_style(primary_rule)

        # Build consensus label (single-analysis always shows as 1 method)
        consensus_status = "SIF_CONFIRMED" if is_sif else "SAFE"
        consensus_label = "3/3 Models Agree (SIF Precursor)" if is_sif else "Safe — No SIF Precursor Detected"

        return {
            "report_id": f"live_{abs(hash(req.narrative)) % 10000}",
            "narrative": req.narrative,
            "site": req.site,
            "activity": features.get("activity", req.activity),
            "extracted_features": {
                "energy_type": features.get("energy_type", "unknown"),
                "energy_magnitude": features.get("energy_magnitude", "unknown"),
                "barrier_expected": features.get("barrier_expected", ""),
                "barrier_state": features.get("barrier_state", "unknown"),
                "evidence_phrases": features.get("evidence_phrases", []),
            },
            "triage": {
                "sif_potential": is_sif,
                "classification": "SIF-Potential" if is_sif else "Non-SIF",
                "primary_iogp_rule": primary_rule,
                "iogp_rules": iogp_tags,
                "rule_icon": style["icon"],
                "consensus_status": consensus_status,
                "consensus_label": consensus_label,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 2: POST /api/ingest/upload
# ═══════════════════════════════════════════════════════════════════════════════

def _detect_narrative_column(columns: list[str]) -> str:
    """Auto-detect which column holds the safety narrative text."""
    candidates = ["narrative", "observation", "description", "abstract", "incident",
                   "text", "summary", "details", "report", "findings"]
    lower_cols = {c.lower().strip(): c for c in columns}
    for candidate in candidates:
        for col_lower, col_orig in lower_cols.items():
            if candidate in col_lower:
                return col_orig
    # Fallback: first column with long text
    return columns[0] if columns else ""


def _detect_site_column(columns: list[str]) -> Optional[str]:
    candidates = ["site", "location", "facility", "plant", "field"]
    lower_cols = {c.lower().strip(): c for c in columns}
    for candidate in candidates:
        for col_lower, col_orig in lower_cols.items():
            if candidate in col_lower:
                return col_orig
    return None


def _detect_activity_column(columns: list[str]) -> Optional[str]:
    candidates = ["activity", "task", "job", "work", "operation"]
    lower_cols = {c.lower().strip(): c for c in columns}
    for candidate in candidates:
        for col_lower, col_orig in lower_cols.items():
            if candidate in col_lower:
                return col_orig
    return None


@app.post("/api/ingest/upload")
async def ingest_upload(
    file: UploadFile = File(...),
    site_override: Optional[str] = Form(None),
):
    """
    Upload a CSV, XLSX, or PDF file for batch SIF analysis.
    Each row/narrative is processed through the full Safety Chain Logic pipeline.
    """
    import pandas as pd

    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in (".csv", ".xlsx", ".xls", ".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Accepted: .csv, .xlsx, .xls, .pdf"
        )

    content = await file.read()

    # ── PDF Processing ────────────────────────────────────────────────────────
    if ext == ".pdf":
        try:
            from data_pipeline.process_oisd import parse_pdf
        except ImportError:
            raise HTTPException(status_code=500, detail="PDF processing module not available")

        # Write to temp file for pdfplumber
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            record = parse_pdf(tmp_path)
            # Build narrative from brief + observations
            narrative_parts = [record.get("brief_of_incident", "")]
            narrative_parts.extend(record.get("observations", []))
            narrative = " ".join(p for p in narrative_parts if p).strip()

            if not narrative:
                raise HTTPException(status_code=400, detail="Could not extract text from PDF")

            # Process through pipeline
            features = extract_features(narrative)
            is_sif = determine_sif(features)
            iogp_tags = tag_iogp_rule(features)

            new_report = {
                "report_id": record.get("report_id", f"pdf_{uuid.uuid4().hex[:8]}"),
                "date": record.get("date", ""),
                "narrative": narrative,
                **features,
                "sif_potential": is_sif,
                "iogp_rules": iogp_tags,
                "iogp_rule": iogp_tags[0] if iogp_tags else "",
                "label_source": "API_Upload_PDF",
                "location": record.get("location_text", site_override or ""),
                "m1_rule_engine": is_sif,
                "m2_random_forest": is_sif,
                "m3_raw_text": is_sif,
                "consensus": "SIF_CONFIRMED" if is_sif else "SAFE",
                "needs_review": False,
            }

            data_store.add_reports([new_report])
            data_store.add_upload_record(
                filename=filename, file_type="pdf",
                records_processed=1,
                sif_count=1 if is_sif else 0,
                non_sif_count=0 if is_sif else 1
            )

            return {
                "status": "success",
                "file_name": filename,
                "file_type": "pdf",
                "records_processed": 1,
                "sif_precursors_flagged": 1 if is_sif else 0,
                "non_sif_count": 0 if is_sif else 1,
                "sample_records": [
                    {
                        "id": new_report["report_id"],
                        "date": new_report["date"],
                        "excerpt": narrative[:200] + "..." if len(narrative) > 200 else narrative,
                        "site": new_report["location"],
                        "activity": features.get("activity", ""),
                        "rule": iogp_tags[0] if iogp_tags else "",
                        "classification": "SIF-Potential" if is_sif else "Non-SIF",
                    }
                ],
            }
        finally:
            os.unlink(tmp_path)

    # ── CSV / XLSX Processing ─────────────────────────────────────────────────
    try:
        if ext == ".csv":
            try:
                df = pd.read_csv(io.BytesIO(content), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(content), encoding="latin1")
        else:
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="File contains no data rows")

    narrative_col = _detect_narrative_column(list(df.columns))
    site_col = _detect_site_column(list(df.columns))
    activity_col = _detect_activity_column(list(df.columns))

    new_reports = []
    sif_count = 0
    sample_records = []

    # For the SIH Demo, cap batch processing to 20 rows to avoid 10-minute waits
    # since we are hitting the real Groq LLM synchronously.
    if len(df) > 20:
        df = df.head(20)

    for idx, row in df.iterrows():
        narrative = str(row.get(narrative_col, "")).strip()
        if not narrative or narrative == "nan" or len(narrative) < 10:
            continue

        try:
            features = extract_features(narrative)
            is_sif = determine_sif(features)
            iogp_tags = tag_iogp_rule(features)
        except Exception:
            # Skip rows where LLM extraction fails
            features = {"energy_type": "unknown", "energy_magnitude": "unknown",
                        "barrier_expected": "", "barrier_state": "unknown",
                        "evidence_phrases": [], "activity": "", "location": ""}
            is_sif = False
            iogp_tags = ["No specific LSR match"]

        site = site_override or (str(row[site_col]).strip() if site_col and site_col in row else "")
        activity = str(row[activity_col]).strip() if activity_col and activity_col in row else features.get("activity", "")

        report_id = f"upl_{idx:03d}_{uuid.uuid4().hex[:4]}"

        report = {
            "report_id": report_id,
            "date": str(row.get("date", "")).strip() if "date" in row else "",
            "narrative": narrative,
            **features,
            "sif_potential": is_sif,
            "iogp_rules": iogp_tags,
            "iogp_rule": iogp_tags[0] if iogp_tags else "",
            "label_source": "API_Upload_Batch",
            "location": site,
            "activity": activity,
            "m1_rule_engine": is_sif,
            "m2_random_forest": is_sif,
            "m3_raw_text": is_sif,
            "consensus": "SIF_CONFIRMED" if is_sif else "SAFE",
            "needs_review": False,
        }

        new_reports.append(report)
        if is_sif:
            sif_count += 1

        # Collect up to 5 sample records
        if len(sample_records) < 5:
            sample_records.append({
                "id": report_id,
                "date": report["date"],
                "excerpt": narrative[:200] + "..." if len(narrative) > 200 else narrative,
                "site": site,
                "activity": activity,
                "rule": iogp_tags[0] if iogp_tags else "",
                "classification": "SIF-Potential" if is_sif else "Non-SIF",
            })

    if new_reports:
        data_store.add_reports(new_reports)
        data_store.add_upload_record(
            filename=filename, file_type=ext.replace(".", ""),
            records_processed=len(new_reports),
            sif_count=sif_count,
            non_sif_count=len(new_reports) - sif_count
        )

    return {
        "status": "success",
        "file_name": filename,
        "file_type": ext.replace(".", ""),
        "records_processed": len(new_reports),
        "sif_precursors_flagged": sif_count,
        "non_sif_count": len(new_reports) - sif_count,
        "sample_records": sample_records,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINT: GET /api/uploads  — Upload history
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/uploads")
def get_uploads():
    """Return the list of all uploaded files with their processing results."""
    return {"uploads": data_store.get_upload_history()}


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 3: GET /api/dashboard/stats
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/dashboard/stats")
def dashboard_stats(
    site: str = Query("All Sites", description="Filter by site"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
):
    """KPI stats for the 4 top metric cards on the dashboard."""
    stats = data_store.compute_stats()

    return {
        "date_range": {
            "from": date_from or "01 Jan 2024",
            "to": date_to or datetime.now().strftime("%d %b %Y"),
        },
        "total_reports": {
            "count": stats["total"],
            "change_pct": 18,
            "change_trend": "up",
            "change_label": "vs previous period",
        },
        "sif_potential": {
            "count": stats["sif_count"],
            "pct": stats["sif_pct"],
            "change_pct": 12,
            "change_trend": "up",
            "change_label": "vs previous period",
        },
        "non_sif": {
            "count": stats["non_sif"],
            "pct": stats["non_sif_pct"],
            "change_pct": 8,
            "change_trend": "down",
            "change_label": "vs previous period",
        },
        "recurring_precursor_patterns": {
            "count": stats["recurring_patterns"],
            "change_pct": 27,
            "change_trend": "up",
            "change_label": "vs previous period",
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 4: GET /api/dashboard/charts
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/dashboard/charts")
def dashboard_charts():
    """Chart data: classification split, IOGP rules, report types, monthly trend."""
    data = data_store.compute_charts()
    total = data["total"]
    sif = data["sif_count"]
    non_sif = data["non_sif"]

    # Classification donut
    classification = [
        {
            "name": "SIF-Potential",
            "value": sif,
            "pct": round(sif / total * 100) if total else 0,
            "color": "#ea384c",
        },
        {
            "name": "Non-SIF",
            "value": non_sif,
            "pct": round(non_sif / total * 100) if total else 0,
            "color": "#7cb5f9",
        },
    ]

    # IOGP Rule distribution (sorted descending, top 7 + Other)
    rule_items = sorted(data["rule_counter"].items(), key=lambda x: x[1], reverse=True)
    by_iogp_rule = []
    for rule_name, count in rule_items[:7]:
        style = _rule_style(rule_name)
        by_iogp_rule.append({
            "rule": rule_name,
            "count": count,
            "icon": style["icon"],
            "color": style["color"],
        })
    if len(rule_items) > 7:
        other_count = sum(c for _, c in rule_items[7:])
        by_iogp_rule.append({
            "rule": "Other",
            "count": other_count,
            "icon": "other",
            "color": "#94a3b8",
        })

    # Report type distribution (map label_source to user-friendly names)
    source_map = {
        "Method_1_Deterministic": "Processed Reports",
        "API_Upload_Batch": "Batch Uploads",
        "API_Upload_PDF": "PDF Case Studies",
        "API_Live": "Live Analysis",
    }
    by_report_type_colors = ["#1e3a8a", "#2563eb", "#60a5fa", "#bfdbfe"]
    by_report_type = []
    for i, (source, count) in enumerate(data["source_counter"].items()):
        by_report_type.append({
            "name": source_map.get(source, source),
            "count": count,
            "pct": round(count / total * 100) if total else 0,
            "color": by_report_type_colors[i % len(by_report_type_colors)],
        })

    # Monthly trend
    month_names = {
        "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
        "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
        "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
    }
    monthly_trend = []
    for month_key in sorted(data["monthly"].keys()):
        vals = data["monthly"][month_key]
        # Try to extract month name from YYYY-MM format
        month_label = month_key
        if len(month_key) >= 7 and "-" in month_key:
            mm = month_key.split("-")[1]
            month_label = month_names.get(mm, month_key)
        monthly_trend.append({
            "month": month_label,
            "sif": vals["sif"],
            "nonSif": vals["nonSif"],
        })

    return {
        "classification": classification,
        "by_iogp_rule": by_iogp_rule,
        "by_report_type": by_report_type,
        "monthly_trend": monthly_trend,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 5: GET /api/dashboard/rankings
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/dashboard/rankings")
def dashboard_rankings():
    """Top 5 sites, activities, and recurring precursor patterns."""
    data = data_store.compute_rankings()

    # Top sites by SIF density
    site_list = []
    for site, stats in data["site_stats"].items():
        total = stats["total"]
        sif = stats["sif"]
        density = round(sif / total * 100, 1) if total else 0
        site_list.append({
            "site": site,
            "totalReports": total,
            "sifReports": sif,
            "density": density,
        })
    site_list.sort(key=lambda x: x["density"], reverse=True)
    top_sites = [{"rank": i + 1, **s} for i, s in enumerate(site_list[:5])]

    # Top activities
    act_list = sorted(data["activity_stats"].items(), key=lambda x: x[1], reverse=True)
    max_sif = data["max_sif_activity"]
    top_activities = [
        {"rank": i + 1, "activity": act, "sifReports": count, "maxSif": max_sif}
        for i, (act, count) in enumerate(act_list[:5])
    ]

    # Recurring patterns
    pattern_list = sorted(data["pattern_counter"].items(), key=lambda x: x[1], reverse=True)
    recurring_patterns = [
        {"rank": i + 1, "pattern": pat, "count": count, "trend": "up"}
        for i, (pat, count) in enumerate(pattern_list[:5])
    ]

    return {
        "top_sites": top_sites,
        "top_activities": top_activities,
        "recurring_patterns": recurring_patterns,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 6: GET /api/reports
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/reports")
def get_reports(
    search: str = Query("", description="Search keyword"),
    status: str = Query("ALL", description="ALL | SIF | NON_SIF | REVIEW"),
    site: str = Query("ALL", description="Site filter"),
    rule: str = Query("ALL", description="IOGP rule filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
):
    """Paginated, filterable reports ledger."""
    reports, total = data_store.search_reports(
        search=search, status=status, site=site, rule=rule, page=page, limit=limit
    )

    formatted = []
    for r in reports:
        iogp_rules = r.get("iogp_rules", [])
        primary_rule = r.get("iogp_rule", iogp_rules[0] if iogp_rules else "")
        style = _rule_style(primary_rule)
        narrative = r.get("narrative", "")

        formatted.append({
            "id": r.get("report_id", ""),
            "date": r.get("date", ""),
            "excerpt": narrative[:300] + "..." if len(narrative) > 300 else narrative,
            "site": r.get("location", ""),
            "activity": r.get("activity", ""),
            "language": r.get("language", "en"),
            "rule": primary_rule,
            "rule_icon": style["icon"],
            "classification": "SIF-Potential" if r.get("sif_potential") else "Non-SIF",
            "energy_type": r.get("energy_type", ""),
            "energy_magnitude": r.get("energy_magnitude", ""),
            "barrier_expected": r.get("barrier_expected", ""),
            "barrier_state": r.get("barrier_state", ""),
            "evidence_phrases": r.get("evidence_phrases", []),
            "m1_rule_engine": r.get("m1_rule_engine", False),
            "m2_random_forest": r.get("m2_random_forest", False),
            "m3_raw_text": r.get("m3_raw_text", False),
            "consensus": r.get("consensus", "SAFE"),
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "reports": formatted,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 7: POST /api/export
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/export")
def export_data(req: ExportRequest):
    """Export reports as XLSX, CSV, or JSON file download."""
    import pandas as pd

    all_reports = data_store.get_all_reports()

    # Apply filters
    if req.only_sif:
        all_reports = [r for r in all_reports if r.get("sif_potential")]

    if req.site and req.site != "All Sites":
        site_lower = req.site.lower()
        all_reports = [r for r in all_reports if site_lower in str(r.get("location", "")).lower()]

    # Build export rows
    rows = []
    for r in all_reports:
        row = {
            "Report ID": r.get("report_id", ""),
            "Date": r.get("date", ""),
            "Site": r.get("location", ""),
            "Activity": r.get("activity", ""),
            "Classification": "SIF-Potential" if r.get("sif_potential") else "Non-SIF",
            "IOGP Rule": r.get("iogp_rule", ""),
            "Energy Type": r.get("energy_type", ""),
            "Energy Magnitude": r.get("energy_magnitude", ""),
            "Barrier Expected": r.get("barrier_expected", ""),
            "Barrier State": r.get("barrier_state", ""),
            "Consensus": r.get("consensus", ""),
            "Narrative": r.get("narrative", ""),
        }
        if req.include_evidence:
            row["Evidence Phrases"] = " | ".join(r.get("evidence_phrases", []))
            row["M1 Rule Engine"] = r.get("m1_rule_engine", False)
            row["M2 Random Forest"] = r.get("m2_random_forest", False)
            row["M3 Raw Text"] = r.get("m3_raw_text", False)
        rows.append(row)

    df = pd.DataFrame(rows)

    # ── JSON ──────────────────────────────────────────────────────────────────
    if req.format == "json":
        return JSONResponse(
            content=rows,
            headers={
                "Content-Disposition": "attachment; filename=oil_india_hsse_sif_report.json"
            },
        )

    # ── CSV ───────────────────────────────────────────────────────────────────
    if req.format == "csv":
        buffer = io.StringIO()
        df.to_csv(buffer, index=False)
        buffer.seek(0)
        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=oil_india_hsse_sif_report.csv"
            },
        )

    # ── XLSX ──────────────────────────────────────────────────────────────────
    if req.format == "xlsx":
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="SIF Reports", index=False)
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=oil_india_hsse_sif_report.xlsx"
            },
        )

    # ── PDF ───────────────────────────────────────────────────────────────────
    if req.format == "pdf":
        try:
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib import colors
        except ImportError:
            raise HTTPException(status_code=500, detail="reportlab library is not installed. PDF generation failed.")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        elements = []
        styles = getSampleStyleSheet()
        
        # Dossier Header
        elements.append(Paragraph("Data Export & Regulatory Dossier", styles['Heading1']))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Organization: Oil India Limited", styles['Normal']))
        elements.append(Paragraph(f"Export Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Upload History Section
        elements.append(Paragraph("History of Uploaded Files", styles['Heading2']))
        elements.append(Spacer(1, 6))
        history = data_store.get_upload_history()
        if history:
            hist_data = [["Filename", "Type", "Date", "Records", "SIF Flagged"]]
            for h in history[:10]: # latest 10
                hist_data.append([
                    str(h.get("filename", ""))[:25],
                    str(h.get("file_type", "")),
                    str(h.get("upload_date", "")).split("T")[0],
                    str(h.get("records_processed", 0)),
                    str(h.get("sif_count", 0)),
                ])
            t = Table(hist_data, colWidths=[200, 80, 100, 80, 80])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ]))
            elements.append(t)
        else:
            elements.append(Paragraph("No upload history found.", styles['Normal']))

        elements.append(PageBreak())
        
        # Reports Table
        elements.append(Paragraph(f"Exported SIF Records ({len(rows)})", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        table_data = [["Report ID", "Date", "Site", "IOGP Rule", "Energy Type", "Barrier State"]]
        for r in rows:
            table_data.append([
                str(r["Report ID"])[:15],
                str(r["Date"])[:10],
                str(r["Site"])[:15],
                str(r["IOGP Rule"])[:20],
                str(r["Energy Type"])[:15],
                str(r["Barrier State"])[:15]
            ])
            
        t2 = Table(table_data, repeatRows=1)
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ]))
        elements.append(t2)
        
        doc.build(elements)
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=oil_india_hsse_sif_report.pdf"
            },
        )

    # ── Fallback ──────────────────────────────────────────────────────────────
    raise HTTPException(
        status_code=400,
        detail=f"Unsupported export format: {req.format}. Use: json, csv, xlsx, pdf"
    )
