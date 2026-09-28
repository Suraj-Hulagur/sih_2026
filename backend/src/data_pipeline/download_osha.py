"""
Download and process OSHA Severe Injury Reports (SIR).

Source: https://www.osha.gov/severeinjury
Coverage: 2015–present, severe injuries only (hospitalization, amputation, eye loss)
Download: Manual CSV download from Power BI dashboard, OR auto-attempt via direct URL.

If auto-download fails, place the CSV manually at:
    data/raw/osha_sir.csv
"""
import glob
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config


def find_osha_csv() -> str | None:
    """
    Look for the OSHA SIR CSV in data/raw/.
    Users may name it differently, so we check common patterns.
    """
    raw = config.RAW_DIR
    patterns = [
        os.path.join(raw, "osha_sir.csv"),
        os.path.join(raw, "SIR*.csv"),
        os.path.join(raw, "severe*.csv"),
        os.path.join(raw, "Severe*.csv"),
        os.path.join(raw, "OSHA*.csv"),
        os.path.join(raw, "osha*.csv"),
    ]
    for pattern in patterns:
        matches = glob.glob(pattern)
        if matches:
            return matches[0]
    return None


def try_auto_download() -> str | None:
    """
    Attempt to download OSHA SIR data programmatically.
    The OSHA severe injury page uses Power BI — direct CSV download may not
    work. This tries known API endpoints; if it fails, returns None and the
    user must download manually.
    """
    import requests

    # Known direct-download attempts
    urls_to_try = [
        "https://www.osha.gov/severeinjury/xml/severeinjury.csv",
        "https://www.osha.gov/pls/sir/sir_data.csv",
    ]
    dest = os.path.join(config.RAW_DIR, "osha_sir.csv")

    for url in urls_to_try:
        try:
            print(f"[OSHA] Trying: {url}")
            resp = requests.get(url, timeout=30, allow_redirects=True)
            if resp.status_code == 200 and len(resp.content) > 1000:
                # Quick sanity: does it look like CSV?
                text = resp.text[:500]
                if "," in text and ("\n" in text):
                    with open(dest, "w", encoding="utf-8") as f:
                        f.write(resp.text)
                    print(f"[OSHA] Auto-download succeeded: {dest}")
                    return dest
        except Exception as e:
            print(f"[OSHA] Auto-download failed for {url}: {e}")

    return None


def load_osha_csv(filepath: str) -> pd.DataFrame:
    """Load the OSHA SIR CSV."""
    df = pd.read_csv(filepath, dtype=str, low_memory=False)
    print(f"[OSHA] Raw rows loaded: {len(df):,}")
    print(f"[OSHA] Columns: {list(df.columns)}")
    return df


def clean_osha_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and normalize OSHA SIR data to unified schema."""
    df.columns = [c.strip() for c in df.columns]

    # ── Identify key columns (OSHA changes column names occasionally) ─────
    col_map = {}
    for c in df.columns:
        cl = c.lower()
        if "narrative" in cl or "abstract" in cl or "summary" in cl or "description" in cl:
            col_map["narrative"] = c
        elif "event" in cl and ("date" in cl or "dt" in cl):
            col_map["date"] = c
        elif "date" in cl and "event" not in col_map:
            col_map["date"] = c
        elif "naics" in cl:
            col_map["naics"] = c
        elif "employer" in cl or "establishment" in cl:
            col_map["employer"] = c
        elif "nature" in cl:
            col_map["nature"] = c
        elif "source" in cl and "injury" in cl:
            col_map["source_injury"] = c
        elif ("event" in cl and "type" in cl) or ("hospitalization" in cl) or ("amputation" in cl):
            col_map["event_type"] = c
        elif "state" in cl or "city" in cl:
            if "location" not in col_map:
                col_map["location"] = c
        elif "inspection" in cl or "activity" in cl:
            if "id" not in col_map:
                col_map["id"] = c

    print(f"[OSHA] Column mapping: {col_map}")

    # ── Narrative ─────────────────────────────────────────────────────────
    if "narrative" not in col_map:
        # Fallback: concatenate all text-heavy columns
        print("[OSHA] WARNING: No obvious narrative column found.")
        print("[OSHA] Available columns:", list(df.columns))
        # Try to find the column with the longest average text
        text_cols = []
        for c in df.columns:
            avg_len = df[c].fillna("").str.len().mean()
            if avg_len > 30:
                text_cols.append((c, avg_len))
        if text_cols:
            text_cols.sort(key=lambda x: x[1], reverse=True)
            col_map["narrative"] = text_cols[0][0]
            print(f"[OSHA] Using '{col_map['narrative']}' as narrative (avg len {text_cols[0][1]:.0f})")
        else:
            print("[OSHA] FATAL: Cannot identify any narrative column!")
            sys.exit(1)

    narr_col = col_map["narrative"]
    df = df[df[narr_col].notna() & (df[narr_col].str.strip() != "")].copy()
    print(f"[OSHA] Rows with non-empty narrative: {len(df):,}")

    # ── Build cleaned DataFrame ───────────────────────────────────────────
    cleaned = pd.DataFrame()

    if "id" in col_map:
        cleaned["report_id"] = "osha_" + df[col_map["id"]].astype(str).str.strip()
    else:
        cleaned["report_id"] = "osha_" + df.index.astype(str)

    cleaned["source"] = "osha_sir"

    if "date" in col_map:
        cleaned["date"] = pd.to_datetime(df[col_map["date"]], errors="coerce").dt.strftime("%Y-%m-%d")
    else:
        cleaned["date"] = ""

    cleaned["narrative"] = df[narr_col].str.strip()

    # Severity — OSHA SIR is all severe by definition
    if "event_type" in col_map:
        cleaned["severity_raw"] = df[col_map["event_type"]].fillna("").str.strip()
    else:
        cleaned["severity_raw"] = "Severe Injury"
    cleaned["severity_normalized"] = "serious"

    # Industry — check NAICS for oil & gas
    if "naics" in col_map:
        naics = df[col_map["naics"]].fillna("").astype(str).str.strip()
        cleaned["naics_sic"] = naics
        is_oil_gas = naics.apply(
            lambda x: any(x.startswith(p) for p in config.OIL_GAS_NAICS_PREFIXES)
        )
        cleaned["industry"] = is_oil_gas.map({True: "oil_gas", False: "general"})
    else:
        cleaned["naics_sic"] = ""
        cleaned["industry"] = "general"

    if "employer" in col_map:
        cleaned["location"] = df[col_map["employer"]].fillna("").str.strip()
    elif "location" in col_map:
        cleaned["location"] = df[col_map["location"]].fillna("").str.strip()
    else:
        cleaned["location"] = ""

    if "nature" in col_map:
        cleaned["injury_type"] = df[col_map["nature"]].fillna("").str.strip()
    else:
        cleaned["injury_type"] = ""

    if "source_injury" in col_map:
        cleaned["source_of_injury"] = df[col_map["source_injury"]].fillna("").str.strip()
    else:
        cleaned["source_of_injury"] = ""

    cleaned["language"] = "en"
    cleaned = cleaned[config.UNIFIED_COLUMNS]

    return cleaned


def main():
    print("=" * 60)
    print("OSHA Severe Injury Reports — Download & Process")
    print("=" * 60)

    csv_path = find_osha_csv()

    if csv_path is None:
        print("[OSHA] No CSV found in data/raw/. Attempting auto-download ...")
        csv_path = try_auto_download()

    if csv_path is None:
        print()
        print("=" * 60)
        print("[OSHA] AUTO-DOWNLOAD FAILED — Manual download required:")
        print()
        print("  1. Go to: https://www.osha.gov/severeinjury")
        print("  2. Click 'Download the full SIR data set'")
        print(f"  3. Save the CSV to: {config.RAW_DIR}")
        print("  4. Re-run this script")
        print("=" * 60)
        sys.exit(0)

    print(f"[OSHA] Found CSV: {csv_path}")
    df_raw = load_osha_csv(csv_path)
    df_clean = clean_osha_data(df_raw)

    df_clean.to_csv(config.OSHA_CLEANED_FILE, index=False)
    print(f"\n[OSHA] Saved: {config.OSHA_CLEANED_FILE}")
    print(f"[OSHA] Total rows: {len(df_clean):,}")

    # Oil & gas subset
    oil_gas = df_clean[df_clean["industry"] == "oil_gas"]
    if len(oil_gas) > 0:
        print(f"\n[OSHA] Oil & Gas subset: {len(oil_gas):,} rows")
    else:
        print("\n[OSHA] No oil & gas records found (NAICS 211/213)")

    print(f"\n[OSHA] Narrative length stats:")
    lengths = df_clean["narrative"].str.len()
    print(f"  Mean: {lengths.mean():.0f} chars | Median: {lengths.median():.0f} | Min: {lengths.min()} | Max: {lengths.max()}")

    return df_clean


if __name__ == "__main__":
    main()
