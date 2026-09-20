"""
Parse OISD Safety Alert / Case Study PDFs into structured records.

Source: https://oisd.gov.in -> Knowledge Resources -> Safety Alert / Case Studies
PDFs are downloaded manually and placed in data/pdf/ (see config.OISD_PDF_SOURCE_DIR).

These documents follow a consistent shape but an inconsistent vocabulary:

    CASE STUDY
    OISD/CS/2026-27/E&P/05   Date: 15.05.2026
    INTRODUCTION            -> Title:, Location:, Loss/ Outcome:
    BRIEF OF INCIDENT       -> what happened (outcome genre)
    OBSERVATIONS/ LAPSES    -> what barrier failed (condition genre)
    ROOT CAUSE              -> why
    RECOMMENDATIONS         -> corrective actions

Header wording varies across disciplines ("INCIDENT" vs "BRIEF OF INCIDENT (S)",
"OBSERVATIONS" vs "OBSERVATIONS / SHORTCOMINGS", five spellings of root cause) and
two documents use title case rather than upper case, so headers are matched with
anchored, case-insensitive, whole-line patterns.

Outputs:
  - oisd_structured.json : full sections, one record per document
  - oisd_cleaned.csv     : the unified 12-column schema, for combine_datasets.py
"""
import json
import os
import re
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config


# ─── Section headers ─────────────────────────────────────────────────────────
# Whole-line, case-insensitive. Ordered most-specific first so that, e.g.,
# "CONCLUSION / ROOT CAUSE" is not consumed by a looser pattern.
SECTION_PATTERNS = [
    ("recommendations", r"recommendations?"),
    ("root_cause", r"(?:probable\s+)?reasons?\s+of\s+failure\s*/\s*root\s+cause"),
    ("root_cause", r"conclusion\s*/\s*root\s+cause"),
    ("root_cause", r"root\s+cause(?:\s+of\s+the\s+incident)?"),
    ("observations", r"observations?\s*(?:[/-]\s*(?:shortcomings|lapses))?"),
    ("brief_of_incident", r"brief\s+of\s+incident(?:\s*\(s\))?"),
    ("brief_of_incident", r"incident"),
    ("introduction", r"introduction"),
    # Everything below is dropped, along with the content that follows it.
    ("_drop", r"photographs?"),
    ("_drop", r"annexure.*"),
    ("_drop", r"case\s+study"),
]
SECTION_PATTERNS = [
    (name, re.compile(r"^\s*" + pat + r"\s*:?\s*$", re.I))
    for name, pat in SECTION_PATTERNS
]

# Page footer that repeats on every page of the case study itself.
FOOTER_RE = re.compile(
    r"Provided for information purpose only.*?incidents\.", re.S | re.I
)
# Annexures carry their own "Page 1 of 3" style footer.
PAGE_NUM_RE = re.compile(r"^.*\bPage\s+\d+\s+of\s+\d+\s*$", re.I)

DOC_REF_RE = re.compile(r"OISD\s*/\s*CS\s*/\s*(\d{4}-\d{2})\s*/\s*([A-Z&]+)\s*/\s*(\d+)", re.I)
DATE_RE = re.compile(r"(?:Date|Dt|Dated)[.:\s]*\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})", re.I)

INTRO_FIELDS = {
    "title": re.compile(r"^Title\s*:\s*(.*)$", re.I),
    "location_text": re.compile(r"^Location\s*:\s*(.*)$", re.I),
    # Spelled "Loss/ Outcome" in most documents but "Result/ outcome" in LPG/12 and
    # MOLPG/22. Without both spellings the value bleeds into Location as a continuation.
    "loss_outcome": re.compile(r"^(?:Loss|Result)\s*/?\s*Outcome\s*:\s*(.*)$", re.I),
}

# A line that starts a new bullet: arrow/dot glyphs, "1.", "1.1", "a.", "iii.", or a
# bare "1 " enumerator. The bare form requires a following capital so that continuation
# lines such as "5 m in river section" are not mistaken for new bullets.
BULLET_START_RE = re.compile(
    r"^\s*(?:[➢➞▪•‣●·-]\s*"
    r"|\d+\.\d*\s+"
    r"|\d+\s+(?=[A-Z])"
    r"|[a-z]\.\s+"
    r"|[ivx]{1,4}\.\s+)",
    re.I,
)
# Lead-ins that precede the real bullets, e.g. "The observations are as follows: -" or
# "Basis site visit ... following observations were made:". Anchored to the end of the
# line, so genuine content (which does not end this way) is never dropped.
LEADIN_RE = re.compile(
    r"^.{0,200}?(?:are\s+as\s+follows|were\s+made|are\s+given\s+below|is\s+as\s+under)"
    r"\s*:?\s*-?\s*$",
    re.I,
)

# Decorative bullet glyphs, stripped from prose sections that are not split into bullets.
GLYPH_RE = re.compile(r"[➢➞▪•‣●]\s*")

MIN_BULLET_CHARS = 40


def extract_pdf_text(pdf_path: str) -> tuple[str, int]:
    """Extract all text from a PDF. Returns (text, page_count)."""
    try:
        import pdfplumber
    except ImportError:
        print("[OISD] pdfplumber not installed. Install with: pip install pdfplumber")
        sys.exit(1)

    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or "")
        n_pages = len(pdf.pages)
    return "\n".join(pages), n_pages


def clean_text(raw: str) -> str:
    """Strip repeating page furniture before any section splitting happens."""
    text = FOOTER_RE.sub("", raw)
    kept = [ln for ln in text.split("\n") if not PAGE_NUM_RE.match(ln.strip())]
    return "\n".join(kept)


def match_header(line: str) -> str | None:
    """Return the section name if this whole line is a section header."""
    stripped = line.strip()
    if not stripped or len(stripped) > 70:
        return None
    for name, pattern in SECTION_PATTERNS:
        if pattern.match(stripped):
            return name
    return None


def split_sections(text: str) -> dict[str, list[str]]:
    """Walk the lines, switching buckets whenever a header line appears."""
    sections: dict[str, list[str]] = {}
    current = "_preamble"

    for line in text.split("\n"):
        header = match_header(line)
        if header is not None:
            current = header
            continue
        if current == "_drop":
            continue
        stripped = line.strip()
        if not stripped or len(stripped) <= 1:
            continue
        sections.setdefault(current, []).append(stripped)

    return sections


def join_lines(lines: list[str]) -> str:
    """De-wrap PDF hard line breaks into flowing prose, dropping bullet decoration."""
    joined = GLYPH_RE.sub("", " ".join(lines))
    return re.sub(r"\s+", " ", joined).strip()


def split_bullets(lines: list[str]) -> list[str]:
    """
    Group lines into bullets. A new bullet starts at a bullet glyph or an
    enumerator; continuation lines are appended to the bullet above them.
    """
    bullets: list[list[str]] = []
    for line in lines:
        # Lead-ins are detected on the joined bullet below, not per line: a lead-in
        # often wraps ("... following observations" / "were made:") and dropping the
        # tail here would strand the head as a bogus bullet.
        if BULLET_START_RE.match(line) or not bullets:
            cleaned = BULLET_START_RE.sub("", line, count=1).strip()
            bullets.append([cleaned] if cleaned else [])
        else:
            bullets[-1].append(line)

    out = []
    for bullet in bullets:
        text = join_lines(bullet)
        # Drop the lead-in if it ended up as its own bullet, and drop fragments.
        if LEADIN_RE.match(text) or len(text) < MIN_BULLET_CHARS:
            continue
        out.append(text)
    return out


def parse_metadata(text: str) -> dict:
    """Pull the OISD document reference and issue date out of the header block."""
    meta = {"doc_ref": "", "discipline": "", "year": "", "number": "", "date": ""}

    ref = DOC_REF_RE.search(text)
    if ref:
        year, discipline, number = ref.group(1), ref.group(2).upper(), ref.group(3)
        meta.update(
            doc_ref=f"OISD/CS/{year}/{discipline}/{number}",
            discipline=discipline,
            year=year,
            number=number,
        )

    # Look for the date near the document reference, not anywhere in the body.
    head = text[: ref.end() + 120] if ref else text[:600]
    date = DATE_RE.search(head)
    if date:
        for dayfirst in (True, False):
            try:
                parsed = pd.to_datetime(date.group(1), dayfirst=dayfirst)
                meta["date"] = parsed.strftime("%Y-%m-%d")
                break
            except Exception:
                continue

    return meta


def parse_intro(lines: list[str]) -> dict:
    """Read Title / Location / Loss-Outcome, including values wrapped onto the next line."""
    fields = {"title": "", "location_text": "", "loss_outcome": ""}
    active = None

    for line in lines:
        matched = False
        for name, pattern in INTRO_FIELDS.items():
            hit = pattern.match(line)
            if hit:
                fields[name] = hit.group(1).strip()
                active = name
                matched = True
                break
        if not matched and active:
            # A wrapped continuation of the field above.
            fields[active] = (fields[active] + " " + line).strip()

    return {k: re.sub(r"\s+", " ", v).strip() for k, v in fields.items()}


def normalise_severity(loss_outcome: str, title: str) -> str:
    """
    OISD only publishes serious cases, so the floor is 'serious'.
    Guard against "Injury/ Fatality: Nil", which means property damage only.
    """
    blob = f"{loss_outcome} {title}".lower()

    if re.search(r"(?:injury|fatalit)[^.]{0,20}\bnil\b", blob):
        return "serious"
    if "fatal" in blob:
        return "fatality"
    return "serious"


def parse_pdf(pdf_path: str) -> dict:
    """Parse one OISD case-study PDF into a structured record."""
    raw, n_pages = extract_pdf_text(pdf_path)
    text = clean_text(raw)
    sections = split_sections(text)
    meta = parse_metadata(text)
    intro = parse_intro(sections.get("introduction", []))

    brief = join_lines(sections.get("brief_of_incident", []))
    observations = split_bullets(sections.get("observations", []))
    root_cause = join_lines(sections.get("root_cause", []))
    recommendations = split_bullets(sections.get("recommendations", []))

    basename = os.path.basename(pdf_path)
    if meta["doc_ref"]:
        report_id = "oisd_{}_{}_{}".format(
            meta["year"], meta["discipline"].replace("&", ""), meta["number"]
        )
    else:
        report_id = "oisd_" + re.sub(r"\W+", "_", basename.replace(".pdf", ""))[:40]

    warnings = []
    for field, value in [
        ("doc_ref", meta["doc_ref"]),
        ("date", meta["date"]),
        ("title", intro["title"]),
        ("brief_of_incident", brief),
        ("observations", observations),
        ("root_cause", root_cause),
        ("recommendations", recommendations),
    ]:
        if not value:
            warnings.append(f"missing:{field}")

    return {
        "report_id": report_id,
        "doc_ref": meta["doc_ref"],
        "discipline": meta["discipline"],
        "date": meta["date"],
        "title": intro["title"],
        "location_text": intro["location_text"],
        "loss_outcome": intro["loss_outcome"],
        "brief_of_incident": brief,
        "observations": observations,
        "root_cause": root_cause,
        "recommendations": recommendations,
        "source_pdf": basename,
        "n_pages": n_pages,
        "parse_warnings": warnings,
    }


def to_unified_row(record: dict) -> dict:
    """
    Map a structured record onto the 12-column schema in config.UNIFIED_COLUMNS.

    narrative = brief + observations, because the observations section is where
    barrier-failure language lives and the rule engine needs it. src/oisd_experiment.py
    measures exactly how much that choice buys.
    """
    narrative_parts = [record["brief_of_incident"]] + record["observations"]
    narrative = " ".join(p for p in narrative_parts if p).strip()

    return {
        "report_id": record["report_id"],
        "source": "oisd_case_study",
        "date": record["date"],
        "narrative": narrative,
        "severity_raw": record["loss_outcome"] or "case_study",
        "severity_normalized": normalise_severity(record["loss_outcome"], record["title"]),
        "industry": "oil_gas",
        "location": record["location_text"],
        "injury_type": "",
        "source_of_injury": "",
        "naics_sic": "211",
        "language": "en",
    }


def find_pdf_dir() -> str | None:
    """Prefer data/pdf/, fall back to the older data/raw/oisd_pdfs/ location."""
    for candidate in (config.OISD_PDF_SOURCE_DIR, config.OISD_PDF_DIR):
        if os.path.isdir(candidate) and any(
            f.lower().endswith(".pdf") for f in os.listdir(candidate)
        ):
            return candidate
    return None


def main():
    print("=" * 60)
    print("OISD Case Studies - PDF Parsing")
    print("=" * 60)

    pdf_dir = find_pdf_dir()
    if pdf_dir is None:
        print()
        print("[OISD] No PDFs found. To use OISD data:")
        print("  1. Go to: https://oisd.gov.in")
        print("  2. Navigate: Knowledge Resources -> Safety Alert / Case Studies")
        print(f"  3. Download PDFs to: {config.OISD_PDF_SOURCE_DIR}")
        print("  4. Re-run this script")
        empty = pd.DataFrame(columns=config.UNIFIED_COLUMNS)
        empty.to_csv(config.OISD_CLEANED_FILE, index=False)
        with open(config.OISD_STRUCTURED_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
        return empty

    pdf_files = sorted(f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf"))
    print(f"[OISD] Reading {len(pdf_files)} PDF(s) from {pdf_dir}\n")

    records = []
    for i, pdf_file in enumerate(pdf_files, 1):
        path = os.path.join(pdf_dir, pdf_file)
        try:
            record = parse_pdf(path)
        except Exception as e:
            print(f"[OISD] ({i}/{len(pdf_files)}) ERROR {pdf_file}: {e}")
            continue

        records.append(record)
        flag = " ".join(record["parse_warnings"]) or "ok"
        print(
            f"[OISD] ({i}/{len(pdf_files)}) {record['report_id']:<22}"
            f" obs={len(record['observations']):<2}"
            f" recs={len(record['recommendations']):<2}"
            f" brief={len(record['brief_of_incident']):<5} {flag}"
        )

    with open(config.OISD_STRUCTURED_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    df = pd.DataFrame([to_unified_row(r) for r in records], columns=config.UNIFIED_COLUMNS)
    df.to_csv(config.OISD_CLEANED_FILE, index=False)

    print()
    print(f"[OISD] Saved structured : {config.OISD_STRUCTURED_FILE}")
    print(f"[OISD] Saved unified    : {config.OISD_CLEANED_FILE}")
    print(f"[OISD] Documents parsed : {len(records)}")
    print(f"\n[OISD] By severity:\n{df['severity_normalized'].value_counts().to_string()}")
    print(f"\n[OISD] By discipline:")
    print(pd.Series([r["discipline"] for r in records]).value_counts().to_string())

    lengths = df["narrative"].str.len()
    print(f"\n[OISD] Narrative length: mean {lengths.mean():.0f} | "
          f"min {lengths.min()} | max {lengths.max()} chars")

    flagged = [(r["report_id"], r["parse_warnings"]) for r in records if r["parse_warnings"]]
    if flagged:
        print(f"\n[OISD] {len(flagged)} document(s) with parse warnings:")
        for report_id, warns in flagged:
            print(f"  {report_id}: {', '.join(warns)}")
    else:
        print("\n[OISD] No parse warnings.")

    return df


if __name__ == "__main__":
    main()
