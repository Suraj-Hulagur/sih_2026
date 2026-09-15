"""
Process manually-downloaded OISD Safety Alert / Case Study PDFs.

Source: https://oisd.gov.in → Knowledge Resources → Safety Alert / Case Studies
These are individual PDFs that must be downloaded manually and placed in:
    data/raw/oisd_pdfs/

This script extracts text from each PDF, parses the structured sections,
and outputs a unified CSV.
"""
import os
import re
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config


def extract_pdf_text(pdf_path: str) -> str:
    """Extract all text from a PDF file using pdfplumber."""
    try:
        import pdfplumber
    except ImportError:
        print("[OISD] pdfplumber not installed. Install with: pip install pdfplumber")
        sys.exit(1)

    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def parse_oisd_sections(raw_text: str) -> dict:
    """
    Parse OISD Safety Alert / Case Study into sections.
    Typical structure:
      - Brief / Description of incident
      - Observations / Lapses / Root Cause
      - Lessons Learned / Recommendations / Corrective Action
    """
    sections = {
        "incident_brief": "",
        "observations": "",
        "lessons_learned": "",
        "full_text": raw_text,
    }

    # Try to split by common OISD section headers
    header_patterns = [
        (r"(?i)(brief\s+of\s+(?:the\s+)?incident|incident\s+brief|description)", "incident_brief"),
        (r"(?i)(observation|lapse|root\s*cause|finding)", "observations"),
        (r"(?i)(lesson|recommendation|corrective|preventive|action\s+taken)", "lessons_learned"),
    ]

    # Simple approach: split text into lines, assign to sections
    lines = raw_text.split("\n")
    current_section = "incident_brief"  # default before any header found

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if this line is a section header
        for pattern, section_name in header_patterns:
            if re.search(pattern, stripped) and len(stripped) < 100:
                current_section = section_name
                break

        sections[current_section] += stripped + " "

    # Clean up whitespace
    for key in sections:
        sections[key] = re.sub(r"\s+", " ", sections[key]).strip()

    return sections


def process_pdfs(pdf_dir: str) -> pd.DataFrame:
    """Process all PDFs in the directory and return a unified DataFrame."""
    pdf_files = [
        f for f in os.listdir(pdf_dir)
        if f.lower().endswith(".pdf")
    ]

    if not pdf_files:
        print(f"[OISD] No PDFs found in {pdf_dir}")
        return pd.DataFrame(columns=config.UNIFIED_COLUMNS)

    print(f"[OISD] Found {len(pdf_files)} PDF(s)")

    rows = []
    for i, pdf_file in enumerate(pdf_files):
        pdf_path = os.path.join(pdf_dir, pdf_file)
        print(f"[OISD] Processing ({i+1}/{len(pdf_files)}): {pdf_file}")

        try:
            raw_text = extract_pdf_text(pdf_path)
            if not raw_text or len(raw_text) < 20:
                print(f"[OISD]   WARNING: Very little text extracted, skipping")
                continue

            sections = parse_oisd_sections(raw_text)

            # Use incident_brief as primary narrative, fall back to full_text
            narrative = sections["incident_brief"]
            if len(narrative) < 20:
                narrative = sections["full_text"]

            # Try to extract a date from the text
            date_match = re.search(
                r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})",
                raw_text[:500]
            )
            date_str = ""
            if date_match:
                try:
                    date_str = pd.to_datetime(date_match.group(1), dayfirst=True).strftime("%Y-%m-%d")
                except Exception:
                    pass

            rows.append({
                "report_id": f"oisd_{i:04d}_{pdf_file.replace('.pdf', '').replace(' ', '_')[:30]}",
                "source": "oisd_alert",
                "date": date_str,
                "narrative": narrative,
                "severity_raw": "incident",
                "severity_normalized": "serious",  # OISD alerts are typically serious incidents
                "industry": "oil_gas",
                "location": "India",
                "injury_type": "",
                "source_of_injury": "",
                "naics_sic": "211",
                "language": "en",
            })
            print(f"[OISD]   Extracted {len(narrative)} chars")

        except Exception as e:
            print(f"[OISD]   ERROR processing {pdf_file}: {e}")

    df = pd.DataFrame(rows, columns=config.UNIFIED_COLUMNS)
    return df


def main():
    print("=" * 60)
    print("OISD Safety Alerts — PDF Processing")
    print("=" * 60)

    df = process_pdfs(config.OISD_PDF_DIR)

    if len(df) == 0:
        print()
        print("[OISD] No data extracted. To use OISD data:")
        print(f"  1. Go to: https://oisd.gov.in")
        print(f"  2. Navigate: Knowledge Resources -> Safety Alert / Case Studies")
        print(f"  3. Download PDFs to: {config.OISD_PDF_DIR}")
        print(f"  4. Re-run this script")
        # Create empty CSV so combine step doesn't break
        df.to_csv(config.OISD_CLEANED_FILE, index=False)
        print(f"\n[OISD] Saved empty CSV: {config.OISD_CLEANED_FILE}")
    else:
        df.to_csv(config.OISD_CLEANED_FILE, index=False)
        print(f"\n[OISD] Saved: {config.OISD_CLEANED_FILE}")
        print(f"[OISD] Total rows: {len(df):,}")

    return df


if __name__ == "__main__":
    main()
