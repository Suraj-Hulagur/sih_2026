# SIH 2026 — SIF Precursor Detection

AI/NLP engine to detect Serious Injury & Fatality (SIF) precursors in safety reports.

## Project Structure

```
sih_2026/
├── src/
│   └── data_pipeline/      ← Step 1: Data download, clean, combine
├── data/
│   ├── raw/                ← Downloaded ZIPs, CSVs, PDFs
│   │   └── oisd_pdfs/      ← Manually downloaded OISD PDFs go here
│   └── processed/          ← Cleaned & combined output CSVs
├── notebooks/              ← EDA and experiments
└── requirements.txt
```

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the data pipeline (Step 1)
python src/data_pipeline/download_msha.py      # Downloads ~50MB ZIP, takes ~1 min
python src/data_pipeline/download_osha.py       # Needs manual CSV download first
python src/data_pipeline/process_oisd.py        # Needs PDFs in data/raw/oisd_pdfs/
python src/data_pipeline/generate_synthetic.py  # Generates ~150 synthetic reports
python src/data_pipeline/combine_datasets.py    # Merges everything into final CSV
```

## Data Sources

| Source | URL | Records | Severity Range |
|--------|-----|---------|----------------|
| MSHA Accidents | arlweb.msha.gov | ~100k+ | Full (fatality → no injury) |
| OSHA Severe Injury | osha.gov/severeinjury | ~30k+ | Serious only |
| OISD Alerts | oisd.gov.in | ~50-100 | Mostly serious |
| Synthetic | Generated | ~150 | Full |

All real data is from **free, public US/Indian government sources**. No login required.
