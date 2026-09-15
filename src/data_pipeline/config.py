"""
Step 1: Data Foundation — Central Configuration
All URLs, file paths, schema definitions, and mapping dictionaries.
"""
import os

# ─── Base Paths ───────────────────────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
OISD_PDF_DIR = os.path.join(RAW_DIR, "oisd_pdfs")

# Create directories if they don't exist
for d in [RAW_DIR, PROCESSED_DIR, OISD_PDF_DIR]:
    os.makedirs(d, exist_ok=True)

# ─── Download URLs ────────────────────────────────────────────────────────────
MSHA_ACCIDENTS_ZIP_URL = "https://arlweb.msha.gov/OpenGovernmentData/DataSets/Accidents.zip"
MSHA_DEFINITIONS_URL = "https://arlweb.msha.gov/OpenGovernmentData/DataSets/Accidents_Definition_File.txt"

# OSHA SIR — downloaded manually from the dashboard at:
OSHA_SIR_DASHBOARD_URL = "https://www.osha.gov/severeinjury"

# ─── Unified Schema ──────────────────────────────────────────────────────────
UNIFIED_COLUMNS = [
    "report_id",
    "source",
    "date",
    "narrative",
    "severity_raw",
    "severity_normalized",
    "industry",
    "location",
    "injury_type",
    "source_of_injury",
    "naics_sic",
    "language",
]

VALID_SEVERITIES = ["fatality", "serious", "minor", "near_miss", "no_injury"]
VALID_INDUSTRIES = ["oil_gas", "mining", "construction", "general"]
VALID_LANGUAGES = ["en", "hi", "as", "hinglish"]

# ─── MSHA Degree of Injury Mapping ───────────────────────────────────────────
# From MSHA Part 50 coding:
#   01 = Fatality
#   02 = Permanent total or partial disability
#   03 = Days away from work only
#   04 = Days away + restricted activity
#   05 = Days of restricted activity only
#   06 = No days away, no restricted activity
#   07 = Occupational illness (no lost time)
#   08 = All other cases
#   10 = Accident only (no injury)
MSHA_SEVERITY_MAP = {
    # Zero-padded (as found in actual data)
    "00": "no_injury",      # Accident only (no injuries)
    "01": "fatality",       # Fatality
    "02": "serious",        # Permanent total or partial disability
    "03": "serious",        # Days away from work only
    "04": "minor",          # Days away + restricted activity
    "05": "minor",          # Days restricted activity only
    "06": "near_miss",      # No days away, no restricted activity
    "07": "minor",          # Occupational illness (not degree 1-6)
    "08": "near_miss",      # All other cases (incl first aid)
    "09": "minor",          # Injuries involving non-employees
    "10": "no_injury",      # Accident only (alternate code)
    "?": "near_miss",       # No value found / unknown
    # Non-padded fallbacks
    "0": "no_injury",
    "1": "fatality",
    "2": "serious",
    "3": "serious",
    "4": "minor",
    "5": "minor",
    "6": "near_miss",
    "7": "minor",
    "8": "near_miss",
    "9": "minor",
}

# ─── OSHA SIR Severity Mapping ───────────────────────────────────────────────
OSHA_SEVERITY_MAP = {
    "Hospitalization": "serious",
    "Amputation": "serious",
    "Loss of an Eye": "serious",
}

# ─── Oil & Gas NAICS codes ───────────────────────────────────────────────────
# 211 = Oil and Gas Extraction
# 213 = Support Activities for Mining (includes oil/gas support)
OIL_GAS_NAICS_PREFIXES = ["211", "213"]

# ─── IOGP Life-Saving Rules ──────────────────────────────────────────────────
IOGP_RULES = [
    "Bypassing Safety Controls",
    "Confined Space",
    "Driving",
    "Energy Isolation",
    "Hot Work",
    "Line of Fire",
    "Safe Mechanical Lifting",
    "Work Authorisation",
    "Working at Height",
]

# ─── Schema Definitions for Extraction (Step 2) ──────────────────────────────
# EEI SCL Model - 13 Known Warning-Sign Precursors
EEI_SCL_PRECURSORS = [
    "Gravity - Suspended Load",
    "Gravity - Fall from Height",
    "Mechanical - Rotating Equipment",
    "Mechanical - Caught In/Between",
    "Electrical - High Voltage",
    "Electrical - Arc Flash",
    "Pressure - Stored Energy",
    "Pressure - Release",
    "Thermal - Hot Surfaces",
    "Thermal - Fire/Explosion",
    "Chemical - Toxic Exposure",
    "Chemical - Asphyxiation",
    "Confined Space",
    "Motor Vehicle/Driving"
]

# Abanum et al. Nigerian Oil Workers Study - Reasons for Skipping Safety Rules
BEHAVIORAL_FACTORS = [
    "Rushing to finish tasks / Time pressure",
    "Poor supervision",
    "Missing or inadequate PPE",
    "Inadequate training",
    "Complacency / Overconfidence",
    "Fatigue / Overwork",
    "Poor equipment condition"
]

# Barrier States (Derived from real industry standards)
BARRIER_STATES = [
    "Missing",
    "Degraded / Damaged",
    "Bypassed / Defeated",
    "Working / Intact",
    "Unknown"
]

# ─── Output file names ───────────────────────────────────────────────────────
MSHA_CLEANED_FILE = os.path.join(PROCESSED_DIR, "msha_cleaned.csv")
OSHA_CLEANED_FILE = os.path.join(PROCESSED_DIR, "osha_cleaned.csv")
OISD_CLEANED_FILE = os.path.join(PROCESSED_DIR, "oisd_cleaned.csv")
SYNTHETIC_FILE = os.path.join(PROCESSED_DIR, "synthetic_reports.csv")
COMBINED_FILE = os.path.join(PROCESSED_DIR, "combined_reports.csv")
OIL_GAS_SUBSET_FILE = os.path.join(PROCESSED_DIR, "oil_gas_subset.csv")
