"""
In-Memory Data Store for the API Server.

Loads the existing classified_reports.json and final_triaged_reports.csv
at import time, merges them into a unified report list, and exposes
helper functions for querying and appending data.

No external database required — the JSON file on disk is the source of truth.
"""
import json
import os
import csv
from typing import Optional
from collections import Counter, defaultdict
import threading

# ─── Paths ────────────────────────────────────────────────────────────────────
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_THIS_DIR)
_PROCESSED_DIR = os.path.join(_PROJECT_ROOT, "data", "processed")

CLASSIFIED_FILE = os.path.join(_PROCESSED_DIR, "classified_reports.json")
TRIAGED_FILE = os.path.join(_PROCESSED_DIR, "final_triaged_reports.csv")

# ─── Thread Safety ────────────────────────────────────────────────────────────
_lock = threading.Lock()

# ─── In-Memory Store ──────────────────────────────────────────────────────────
_reports: list[dict] = []
_triaged_map: dict[str, dict] = {}


def _load_triaged() -> dict[str, dict]:
    """Load the triaged CSV into a dict keyed by report_id."""
    mapping = {}
    if not os.path.exists(TRIAGED_FILE):
        return mapping
    with open(TRIAGED_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rid = row.get("report_id", "")
            mapping[rid] = {
                "m1_rule_engine": row.get("m1_rule_engine", "").lower() == "true",
                "m2_random_forest": row.get("m2_random_forest", "").lower() == "true",
                "m3_raw_text": row.get("m3_raw_text", "").lower() == "true",
                "consensus": row.get("final_status", "SAFE"),
                "needs_review": row.get("needs_review", "").lower() == "true",
            }
    return mapping


def _load_classified() -> list[dict]:
    """Load the classified JSON, enrich each record with triaged consensus."""
    if not os.path.exists(CLASSIFIED_FILE):
        return []
    with open(CLASSIFIED_FILE, "r", encoding="utf-8") as f:
        raw = json.load(f)

    for i, report in enumerate(raw):
        rid = report.get("report_id", f"report_{i}")
        report.setdefault("report_id", rid)
        report.setdefault("sif_potential", False)
        report.setdefault("iogp_rules", [])
        report.setdefault("iogp_rule", report["iogp_rules"][0] if report["iogp_rules"] else "")
        report.setdefault("energy_type", "unknown")
        report.setdefault("energy_magnitude", "unknown")
        report.setdefault("barrier_expected", "")
        report.setdefault("barrier_state", "unknown")
        report.setdefault("evidence_phrases", [])
        report.setdefault("activity", "General Operation")
        report.setdefault("location", "Unknown")
        report.setdefault("date", "")
        report.setdefault("language", "en")

        # Merge triaged consensus data
        tri = _triaged_map.get(rid, {})
        report["m1_rule_engine"] = tri.get("m1_rule_engine", report.get("sif_potential", False))
        report["m2_random_forest"] = tri.get("m2_random_forest", report.get("sif_potential", False))
        report["m3_raw_text"] = tri.get("m3_raw_text", report.get("sif_potential", False))
        report["consensus"] = tri.get("consensus", "SIF_CONFIRMED" if report["sif_potential"] else "SAFE")
        report["needs_review"] = tri.get("needs_review", False)

    return raw


def _persist():
    """Write the current in-memory reports back to disk."""
    os.makedirs(_PROCESSED_DIR, exist_ok=True)
    with open(CLASSIFIED_FILE, "w", encoding="utf-8") as f:
        json.dump(_reports, f, indent=2, ensure_ascii=False)


# ─── Initialize ──────────────────────────────────────────────────────────────
_triaged_map = _load_triaged()
_reports = _load_classified()


# ─── Public API ───────────────────────────────────────────────────────────────

def get_all_reports() -> list[dict]:
    """Return a shallow copy of all reports."""
    with _lock:
        return list(_reports)


def get_report_count() -> int:
    with _lock:
        return len(_reports)


def add_reports(new_reports: list[dict]):
    """Append new reports and persist to disk."""
    with _lock:
        _reports.extend(new_reports)
        _persist()


def search_reports(
    search: str = "",
    status: str = "ALL",
    site: str = "ALL",
    rule: str = "ALL",
    page: int = 1,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """
    Filter and paginate reports.
    Returns (page_of_reports, total_matching).
    """
    with _lock:
        filtered = list(_reports)

    # Text search across narrative, activity, location, evidence_phrases
    if search and search.strip():
        q = search.lower()
        filtered = [
            r for r in filtered
            if q in str(r.get("narrative", "")).lower()
            or q in str(r.get("activity", "")).lower()
            or q in str(r.get("location", "")).lower()
            or q in str(r.get("barrier_expected", "")).lower()
            or any(q in phrase.lower() for phrase in r.get("evidence_phrases", []))
        ]

    # Status filter
    if status == "SIF":
        filtered = [r for r in filtered if r.get("sif_potential")]
    elif status == "NON_SIF":
        filtered = [r for r in filtered if not r.get("sif_potential")]
    elif status == "REVIEW":
        filtered = [r for r in filtered if r.get("needs_review")]

    # Site filter
    if site and site != "ALL":
        site_lower = site.lower()
        filtered = [r for r in filtered if site_lower in str(r.get("location", "")).lower()]

    # Rule filter
    if rule and rule != "ALL":
        rule_lower = rule.lower()
        filtered = [
            r for r in filtered
            if rule_lower in str(r.get("iogp_rule", "")).lower()
            or any(rule_lower in tag.lower() for tag in r.get("iogp_rules", []))
        ]

    total = len(filtered)
    offset = (page - 1) * limit
    page_data = filtered[offset : offset + limit]

    return page_data, total


def compute_stats() -> dict:
    """Compute KPI stats from all reports."""
    with _lock:
        all_r = list(_reports)

    total = len(all_r)
    sif_count = sum(1 for r in all_r if r.get("sif_potential"))
    non_sif = total - sif_count

    # Recurring patterns: count (iogp_rule, barrier_state) combos appearing >= 2 times
    combos = Counter(
        (r.get("iogp_rule", ""), r.get("barrier_state", ""))
        for r in all_r if r.get("sif_potential")
    )
    recurring = sum(1 for c in combos.values() if c >= 2)

    return {
        "total": total,
        "sif_count": sif_count,
        "non_sif": non_sif,
        "sif_pct": round(sif_count / total * 100, 1) if total else 0,
        "non_sif_pct": round(non_sif / total * 100, 1) if total else 0,
        "recurring_patterns": recurring,
    }


def compute_charts() -> dict:
    """Compute chart distribution data."""
    with _lock:
        all_r = list(_reports)

    total = len(all_r)
    sif_count = sum(1 for r in all_r if r.get("sif_potential"))
    non_sif = total - sif_count

    # IOGP rule distribution
    rule_counter = Counter()
    for r in all_r:
        if r.get("sif_potential"):
            rule_counter[r.get("iogp_rule", "Other")] += 1

    # By source / report type
    source_counter = Counter(r.get("label_source", "Method_1_Deterministic") for r in all_r)

    # Monthly trend (from date field)
    monthly = defaultdict(lambda: {"sif": 0, "nonSif": 0})
    for r in all_r:
        date_str = r.get("date", "")
        if date_str and len(date_str) >= 7:
            month_key = date_str[:7]  # YYYY-MM
        else:
            month_key = "Unknown"
        if r.get("sif_potential"):
            monthly[month_key]["sif"] += 1
        else:
            monthly[month_key]["nonSif"] += 1

    return {
        "total": total,
        "sif_count": sif_count,
        "non_sif": non_sif,
        "rule_counter": dict(rule_counter),
        "source_counter": dict(source_counter),
        "monthly": dict(monthly),
    }


def compute_rankings() -> dict:
    """Compute top sites, activities, and recurring patterns."""
    with _lock:
        all_r = list(_reports)

    # Sites
    site_stats = defaultdict(lambda: {"total": 0, "sif": 0})
    for r in all_r:
        loc = r.get("location", "Unknown") or "Unknown"
        site_stats[loc]["total"] += 1
        if r.get("sif_potential"):
            site_stats[loc]["sif"] += 1

    # Activities
    act_stats = Counter()
    for r in all_r:
        if r.get("sif_potential"):
            act_stats[r.get("activity", "General")] += 1
    max_sif = max(act_stats.values()) if act_stats else 1

    # Recurring patterns (barrier_expected + iogp_rule combos)
    pattern_counter = Counter()
    for r in all_r:
        if r.get("sif_potential"):
            barrier = r.get("barrier_expected", "")
            rule = r.get("iogp_rule", "")
            if barrier:
                pattern_counter[f"{barrier} ({rule})"] += 1

    return {
        "site_stats": dict(site_stats),
        "activity_stats": dict(act_stats),
        "max_sif_activity": max_sif,
        "pattern_counter": dict(pattern_counter),
    }
