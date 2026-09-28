"""
Download and process MSHA Accident, Injuries & Illnesses dataset.

Source: https://arlweb.msha.gov/OpenGovernmentData/DataSets/Accidents.zip
Coverage: 2000–present, ALL severities (fatality → no injury), 100k+ records
Format: Pipe-delimited text inside a ZIP
"""
import os
import sys
import zipfile

import pandas as pd
import requests
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config


def download_msha_zip(url: str, dest_dir: str) -> str:
    """Download the MSHA Accidents.zip and extract the data file."""
    zip_path = os.path.join(dest_dir, "Accidents.zip")

    if os.path.exists(zip_path):
        print(f"[MSHA] ZIP already downloaded: {zip_path}")
    else:
        print(f"[MSHA] Downloading from {url} ...")
        resp = requests.get(url, stream=True, timeout=120)
        resp.raise_for_status()
        total = int(resp.headers.get("content-length", 0))
        with open(zip_path, "wb") as f:
            with tqdm(total=total, unit="B", unit_scale=True, desc="Accidents.zip") as pbar:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
                    pbar.update(len(chunk))
        print(f"[MSHA] Downloaded: {zip_path}")

    # Extract
    print("[MSHA] Extracting ZIP ...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        names = zf.namelist()
        print(f"[MSHA] Files in ZIP: {names}")
        data_file = None
        for name in names:
            lower = name.lower()
            if lower.endswith((".txt", ".csv")) and "definition" not in lower:
                data_file = name
                break
        if data_file is None:
            data_file = names[0]
        zf.extract(data_file, dest_dir)
        extracted_path = os.path.join(dest_dir, data_file)
        print(f"[MSHA] Extracted: {extracted_path}")
        return extracted_path


def detect_delimiter(filepath: str) -> str:
    """Auto-detect the delimiter (pipe, tab, or comma)."""
    with open(filepath, "r", encoding="latin-1") as f:
        first_line = f.readline()
    if "|" in first_line:
        return "|"
    elif "\t" in first_line:
        return "\t"
    return ","


def load_msha_data(filepath: str) -> pd.DataFrame:
    """Load the raw MSHA data file into a DataFrame."""
    delimiter = detect_delimiter(filepath)
    print(f"[MSHA] Detected delimiter: '{delimiter}'")

    df = pd.read_csv(
        filepath,
        sep=delimiter,
        encoding="latin-1",
        low_memory=False,
        dtype=str,
    )
    print(f"[MSHA] Raw rows loaded: {len(df):,}")
    print(f"[MSHA] Columns: {list(df.columns)}")
    return df


def clean_msha_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and normalize MSHA data to unified schema."""
    df.columns = [c.strip().upper() for c in df.columns]

    # ── Find narrative column ─────────────────────────────────────────────
    narrative_col = None
    for candidate in ["NARRATIVE", "INJ_BODY_PART_DESC", "ACCIDENT_DESC"]:
        if candidate in df.columns:
            narrative_col = candidate
            break
    if narrative_col is None:
        for c in df.columns:
            if "NARR" in c or "DESC" in c:
                narrative_col = c
                break
    if narrative_col is None:
        print("[MSHA] FATAL: No narrative column found!")
        print("[MSHA] Available columns:", list(df.columns))
        sys.exit(1)

    print(f"[MSHA] Using narrative column: {narrative_col}")

    # Filter empty narratives
    df = df[df[narrative_col].notna() & (df[narrative_col].str.strip() != "")].copy()
    print(f"[MSHA] Rows with non-empty narrative: {len(df):,}")

    # ── Find severity column (prefer _CD coded column for our map) ─────
    degree_col = None
    for candidate in ["DEGREE_INJURY_CD", "DEGREE_INJURY", "DEG_INJURY"]:
        if candidate in df.columns:
            degree_col = candidate
            break
    print(f"[MSHA] Using severity column: {degree_col}")

    # ── Build cleaned DataFrame ───────────────────────────────────────────
    cleaned = pd.DataFrame()

    if "DOCUMENT_NO" in df.columns:
        cleaned["report_id"] = "msha_" + df["DOCUMENT_NO"].astype(str).str.strip()
    elif "MINE_ID" in df.columns:
        cleaned["report_id"] = "msha_" + df["MINE_ID"].astype(str).str.strip() + "_" + df.index.astype(str)
    else:
        cleaned["report_id"] = "msha_" + df.index.astype(str)

    cleaned["source"] = "msha_acc"

    # Date
    date_col = None
    for candidate in ["ACCIDENT_DT", "INJ_DT", "CAL_DT", "ACCIDENT_DATE"]:
        if candidate in df.columns:
            date_col = candidate
            break
    if date_col:
        cleaned["date"] = pd.to_datetime(df[date_col], errors="coerce").dt.strftime("%Y-%m-%d")
    else:
        cleaned["date"] = ""

    cleaned["narrative"] = df[narrative_col].str.strip()

    # Severity
    if degree_col:
        cleaned["severity_raw"] = df[degree_col].astype(str).str.strip()
        cleaned["severity_normalized"] = (
            cleaned["severity_raw"].map(config.MSHA_SEVERITY_MAP).fillna("minor")
        )
    else:
        cleaned["severity_raw"] = ""
        cleaned["severity_normalized"] = "minor"

    cleaned["industry"] = "mining"

    # Location
    if "MINE_NAME" in df.columns:
        cleaned["location"] = df["MINE_NAME"].fillna("").str.strip()
    elif "MINE_ID" in df.columns:
        cleaned["location"] = "Mine_" + df["MINE_ID"].astype(str)
    else:
        cleaned["location"] = ""

    # Injury type
    for candidate in ["NATURE_INJURY", "NATURE_OF_INJURY", "INJ_BODY_PART"]:
        if candidate in df.columns:
            cleaned["injury_type"] = df[candidate].fillna("").str.strip()
            break
    else:
        cleaned["injury_type"] = ""

    # Source of injury
    for candidate in ["SOURCE_INJURY", "OCCUPATION", "CLASSIFICATION"]:
        if candidate in df.columns:
            cleaned["source_of_injury"] = df[candidate].fillna("").str.strip()
            break
    else:
        cleaned["source_of_injury"] = ""

    # NAICS
    if "NAICS_CD" in df.columns:
        cleaned["naics_sic"] = df["NAICS_CD"].fillna("").str.strip()
    elif "SIC" in df.columns:
        cleaned["naics_sic"] = df["SIC"].fillna("").str.strip()
    else:
        cleaned["naics_sic"] = ""

    cleaned["language"] = "en"
    cleaned = cleaned[config.UNIFIED_COLUMNS]

    return cleaned


def main():
    print("=" * 60)
    print("MSHA Accident Injuries & Illnesses — Download & Process")
    print("=" * 60)

    data_file = download_msha_zip(config.MSHA_ACCIDENTS_ZIP_URL, config.RAW_DIR)
    df_raw = load_msha_data(data_file)
    df_clean = clean_msha_data(df_raw)

    df_clean.to_csv(config.MSHA_CLEANED_FILE, index=False)
    print(f"\n[MSHA] Saved: {config.MSHA_CLEANED_FILE}")
    print(f"[MSHA] Total rows: {len(df_clean):,}")
    print(f"\n[MSHA] Severity distribution:")
    print(df_clean["severity_normalized"].value_counts().to_string())
    print(f"\n[MSHA] Narrative length stats:")
    lengths = df_clean["narrative"].str.len()
    print(f"  Mean: {lengths.mean():.0f} chars | Median: {lengths.median():.0f} | Min: {lengths.min()} | Max: {lengths.max()}")

    return df_clean


if __name__ == "__main__":
    main()
