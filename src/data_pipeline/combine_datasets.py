"""
Combine all cleaned datasets into a single unified CSV.

Reads from data/processed/:
  - msha_cleaned.csv
  - osha_cleaned.csv
  - oisd_cleaned.csv
  - synthetic_reports.csv

Outputs:
  - combined_reports.csv  (everything)
  - oil_gas_subset.csv    (oil & gas records only)
"""
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config


def load_if_exists(filepath: str) -> pd.DataFrame:
    """Load a CSV if it exists, otherwise return empty DataFrame."""
    if os.path.exists(filepath):
        df = pd.read_csv(filepath, dtype=str)
        print(f"  Loaded {os.path.basename(filepath)}: {len(df):,} rows")
        return df
    else:
        print(f"  Not found: {os.path.basename(filepath)} (skipping)")
        return pd.DataFrame(columns=config.UNIFIED_COLUMNS)


def validate(df: pd.DataFrame) -> None:
    """Run data quality checks and print warnings."""
    issues = []

    # Check for missing narratives
    empty_narr = df["narrative"].isna() | (df["narrative"].str.strip() == "")
    if empty_narr.any():
        issues.append(f"  [!] {empty_narr.sum()} rows with empty narrative")

    # Check for short narratives
    short_narr = df["narrative"].str.len() < 10
    if short_narr.any():
        issues.append(f"  [!] {short_narr.sum()} rows with narrative < 10 chars")

    # Check severity values
    invalid_sev = ~df["severity_normalized"].isin(config.VALID_SEVERITIES)
    if invalid_sev.any():
        bad_vals = df.loc[invalid_sev, "severity_normalized"].unique()
        issues.append(f"  [!] {invalid_sev.sum()} rows with invalid severity: {bad_vals}")

    # Check for duplicate report_ids
    dups = df["report_id"].duplicated()
    if dups.any():
        issues.append(f"  [!] {dups.sum()} duplicate report_id values")

    # Check severity distribution isn't all one value
    sev_counts = df["severity_normalized"].value_counts()
    if len(sev_counts) == 1:
        issues.append(f"  [!] Only one severity level: {sev_counts.index[0]}")

    if issues:
        print("\n[!] Data Quality Issues:")
        for issue in issues:
            print(issue)
    else:
        print("\n[OK] All data quality checks passed")


def main():
    print("=" * 60)
    print("Combining All Datasets")
    print("=" * 60)

    print("\nLoading cleaned datasets:")
    dfs = []
    dfs.append(load_if_exists(config.MSHA_CLEANED_FILE))
    dfs.append(load_if_exists(config.OSHA_CLEANED_FILE))
    dfs.append(load_if_exists(config.OISD_CLEANED_FILE))
    dfs.append(load_if_exists(config.SYNTHETIC_FILE))

    # Combine
    combined = pd.concat(dfs, ignore_index=True)
    print(f"\nCombined total: {len(combined):,} rows")

    # Remove rows with empty narratives
    before = len(combined)
    combined = combined[
        combined["narrative"].notna() & (combined["narrative"].str.strip() != "")
    ].copy()
    if len(combined) < before:
        print(f"Removed {before - len(combined)} rows with empty narratives")

    # Validate
    validate(combined)

    # Save combined
    combined.to_csv(config.COMBINED_FILE, index=False)
    print(f"\n[OK] Saved: {config.COMBINED_FILE}")

    # ── Oil & Gas subset ──────────────────────────────────────────────────
    oil_gas = combined[combined["industry"] == "oil_gas"].copy()
    oil_gas.to_csv(config.OIL_GAS_SUBSET_FILE, index=False)
    print(f"[OK] Saved oil & gas subset: {config.OIL_GAS_SUBSET_FILE} ({len(oil_gas):,} rows)")

    # ── Summary statistics ────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("DATA QUALITY REPORT")
    print("=" * 60)

    print(f"\nTotal reports: {len(combined):,}")

    print(f"\nBy source:")
    print(combined["source"].value_counts().to_string())

    print(f"\nBy severity:")
    print(combined["severity_normalized"].value_counts().to_string())

    print(f"\nBy industry:")
    print(combined["industry"].value_counts().to_string())

    print(f"\nBy language:")
    print(combined["language"].value_counts().to_string())

    print(f"\nNarrative length stats:")
    lengths = combined["narrative"].str.len()
    print(f"  Mean:   {lengths.mean():.0f} chars")
    print(f"  Median: {lengths.median():.0f} chars")
    print(f"  Min:    {lengths.min()} chars")
    print(f"  Max:    {lengths.max()} chars")

    print(f"\nDate range:")
    dates = pd.to_datetime(combined["date"], errors="coerce").dropna()
    if len(dates) > 0:
        print(f"  Earliest: {dates.min().strftime('%Y-%m-%d')}")
        print(f"  Latest:   {dates.max().strftime('%Y-%m-%d')}")
    else:
        print("  No valid dates found")

    return combined


if __name__ == "__main__":
    main()
