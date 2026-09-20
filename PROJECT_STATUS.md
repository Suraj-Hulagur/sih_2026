# SIH 2026 — SIF Precursor Detection: Complete Project State

> **Context for this document.** This is a full technical handoff describing everything that
> currently exists in the `sih_2026` repository, written to be pasted into another AI assistant
> (ChatGPT) as background so it can help without needing the repo. It describes what is built,
> what actually ran, what the real measured numbers are, what is stale or broken, and what has
> not been started. Nothing here is aspirational — every claim is read off the code or the
> output artifacts on disk as of 2026-09-20.

---

## 1. What the project is

**Competition:** Smart India Hackathon 2026, problem statement **SIH26165**, submitted by
**Oil India Limited (OIL)**.

**The task:** read free-text safety reports written by field workers, decide whether each one
describes a **SIF precursor** (Serious Injury & Fatality potential — a situation that *could have*
killed someone, regardless of whether anyone was actually hurt), tag it to one of the 9
**IOGP Life-Saving Rules**, and surface recurring precursor patterns.

**The core domain concept** the whole system is built on comes from published safety-science
work (EEI / Safety Chain Logic, and the "high-energy" SIF literature):

> A report is a SIF precursor when a **high-energy source** was present **AND** the **barrier**
> that should have controlled it was missing, degraded, or bypassed.

That is a two-field test. Everything upstream (LLM, OCR, speech-to-text) exists only to fill
those two fields from messy text. Everything downstream (rules, ML, voting) exists to apply and
cross-check that test.

**The stated architectural principle:** *the LLM is a reader, not a judge.* The LLM extracts
structure; a deterministic, auditable rule makes the safety call. This matters because a safety
officer has to be able to defend the decision, and "the model said so" is not defensible.

**Why Indian-language handling matters:** OIL's field workforce is in Assam (Duliajan, Moran,
Naharkatiya, Digboi, Numaligarh, Baghjan, etc.). Real reports are written in code-mixed
Hinglish and Assamese, often by people who would rather speak than type. So the system has to
handle Hinglish/Assamese text, voice memos, and photographs of handwritten logbooks.

---

## 2. Repository state

- **Repository root:** `sih_2026/`
- **Branch:** `oisd` (main branch is `main`)
- **Commits (4 total):**
  - `cbba364` create data foundation
  - `f141f85` Add Steps 1-3: Extraction pipeline, triangulated classification engine, and academic validation
  - `2b9ae96` Update README.md
  - `4e7989b` Update README.md

**There is a significant amount of uncommitted work.** `git status` shows 9 modified tracked
files and 3 untracked additions:

| Status | Path | What changed |
|---|---|---|
| M | `.gitignore` | added `models/` |
| M | `requirements.txt` | +7 deps (dotenv, openai, scikit-learn, shap, matplotlib, joblib, sentence-transformers) |
| M | `src/data_pipeline/config.py` | +Step 2–3 path constants, +`MODELS_DIR` |
| M | `src/extract_pipeline.py` | rewritten for pluggable LLM backend (Ollama default) |
| M | `src/rule_engine.py` | IOGP tagging rewritten single-label → multi-label; several tagging bugs fixed |
| M | `src/train_random_forest.py` | hardcoded paths → config constants |
| M | `src/raw_text_classifier.py` | hardcoded paths → config constants |
| M | `src/final_sif_voter.py` | **leakage fix**: `fit`+`predict` on same rows → `cross_val_predict` |
| M | `src/academic_crosscheck.py` | hardcoded paths → config; honesty comment on the academic numbers |
| ?? | `.env.example` | new, documents all env vars |
| ?? | `src/llm_client.py` | new, unified LLM + multilingual embedding client |
| ?? | `cla/` | two Jupyter notebooks — **the most rigorous work in the repo** (see §8) |

A recurring theme across the modified files: the committed versions contained **absolute
Windows paths belonging to a different machine and user** (`C:\Users\rithy\OneDrive\Desktop\
SIH_2026\...`). The uncommitted work replaces those with constants from `config.py`. Two files
still contain those stale paths: `src/voice_intake.py` and `src/vision_intake.py`.

---

## 3. Directory map (actual, not aspirational)

```
sih_2026/
├── .env                          # real keys, gitignored
├── .env.example                  # NEW, untracked
├── .gitignore
├── README.md
├── requirements.txt
├── venv/                         # local virtualenv, gitignored
│
├── cla/                          # UNTRACKED — the analysis notebooks
│   ├── SIF_classification_baseline (1).ipynb    # 41 cells, source
│   └── executed (1).ipynb                       # same notebook WITH outputs
│
├── data/
│   ├── 1_Accident Injuries (1).xlsx             # loose, not wired to any script
│   ├── FatalitiesFY09..FY12.csv                 # loose, not wired to any script
│   ├── fy13..fy17_federal-state_summaries.csv   # loose, not wired to any script
│   ├── OSHA HSE DATA_ALL ABSTRACTS 15-17_FINAL.csv  # 3.4MB — used by the notebook
│   ├── raw/
│   │   ├── Accidents.zip         # 52 MB, MSHA
│   │   ├── Accidents.txt         # 228 MB, extracted
│   │   └── oisd_pdfs/            # EMPTY
│   └── processed/
│       ├── msha_cleaned.csv           # 274,725 rows
│       ├── synthetic_reports.csv      # 150 rows
│       ├── oisd_cleaned.csv           # header only, 0 rows
│       ├── combined_reports.csv       # 274,875 rows
│       ├── oil_gas_subset.csv         # 150 rows
│       ├── hinglish_synthetic.csv     # 50 rows  ← the pipeline's actual input
│       ├── extracted_features.json    # 50 records
│       ├── classified_reports.json    # 50 records
│       ├── final_triaged_reports.csv  # 50 rows
│       ├── shap_summary_plot.png
│       └── academic_validation.png
│
└── src/
    ├── data_pipeline/
    │   ├── config.py
    │   ├── download_msha.py
    │   ├── download_osha.py
    │   ├── process_oisd.py
    │   ├── generate_synthetic.py
    │   └── combine_datasets.py
    ├── extract_pipeline.py
    ├── voice_intake.py
    ├── vision_intake.py
    ├── llm_client.py             # NEW, untracked, not yet used by anything
    ├── rule_engine.py
    ├── train_random_forest.py
    ├── raw_text_classifier.py
    ├── final_sif_voter.py
    └── academic_crosscheck.py
```

**Notes on things the README claims that do not exist:** there is no `notebooks/` directory
(the notebooks live in untracked `cla/`), and `data/processed/osha_cleaned.csv` does not exist
because the OSHA download step has never completed. `src/` has no `__init__.py`; scripts work
by being run as `python src/<script>.py` from the repo root, which puts `src/` on `sys.path`.

---

## 4. Step 1 — Data foundation (`src/data_pipeline/`)

### 4.1 `config.py` — single source of truth

Defines, in one place:

- **Paths**: `PROJECT_ROOT`, `DATA_DIR`, `RAW_DIR`, `PROCESSED_DIR`, `OISD_PDF_DIR`, and it
  `os.makedirs(..., exist_ok=True)` them on import.
- **Download URLs**: MSHA `Accidents.zip`, MSHA definitions file, OSHA severe-injury dashboard.
- **Unified 12-column schema** that every source is normalised into:
  `report_id, source, date, narrative, severity_raw, severity_normalized, industry, location,
  injury_type, source_of_injury, naics_sic, language`
- **Controlled vocabularies**:
  - `VALID_SEVERITIES = [fatality, serious, minor, near_miss, no_injury]`
  - `VALID_INDUSTRIES = [oil_gas, mining, construction, general]`
  - `VALID_LANGUAGES = [en, hi, as, hinglish]`
- **`MSHA_SEVERITY_MAP`** — maps MSHA Part 50 `DEGREE_INJURY_CD` codes to the normalised scale.
  Handles both zero-padded (`"01"`) and unpadded (`"1"`) forms plus `"?"` for unknown. e.g.
  `01→fatality`, `02/03→serious`, `04/05/07/09→minor`, `06/08→near_miss`, `00/10→no_injury`.
- **`OSHA_SEVERITY_MAP`** — `Hospitalization / Amputation / Loss of an Eye → serious`.
- **`OIL_GAS_NAICS_PREFIXES = ["211", "213"]`** — oil & gas extraction, and support activities.
- **`IOGP_RULES`** — the 9 Life-Saving Rules: Bypassing Safety Controls, Confined Space,
  Driving, Energy Isolation, Hot Work, Line of Fire, Safe Mechanical Lifting, Work
  Authorisation, Working at Height.
- **`EEI_SCL_PRECURSORS`** — 14 named warning-sign precursors (Gravity–Suspended Load,
  Gravity–Fall from Height, Mechanical–Rotating Equipment, Mechanical–Caught In/Between,
  Electrical–High Voltage, Electrical–Arc Flash, Pressure–Stored Energy, Pressure–Release,
  Thermal–Hot Surfaces, Thermal–Fire/Explosion, Chemical–Toxic Exposure,
  Chemical–Asphyxiation, Confined Space, Motor Vehicle/Driving).
  **These are defined but never referenced by any script yet.**
- **`BEHAVIORAL_FACTORS`** — 7 reasons workers skip rules, taken from the Abanum et al. study
  (time pressure, poor supervision, missing PPE, inadequate training, complacency, fatigue,
  poor equipment). **Also defined but never used yet.**
- **`BARRIER_STATES`** — Missing, Degraded/Damaged, Bypassed/Defeated, Working/Intact, Unknown.
  **Also unused** — the rule engine hardcodes its own lowercase strings instead.
- **Output filename constants** for every artifact, plus (uncommitted) `MODELS_DIR`.

### 4.2 `download_msha.py` — the only fully working real-data ingest

- Streams `Accidents.zip` (52 MB) from `arlweb.msha.gov` with a `tqdm` progress bar; skips the
  download if the ZIP already exists.
- Extracts the first `.txt`/`.csv` member that isn't the definitions file → `Accidents.txt`
  (228 MB).
- `detect_delimiter()` sniffs the first line for `|`, tab, then comma. MSHA is pipe-delimited.
- Loads with `encoding="latin-1"`, `dtype=str`, `low_memory=False`.
- `clean_msha_data()` is defensively written — it uppercases column names and then *searches*
  for the narrative column (`NARRATIVE`, `INJ_BODY_PART_DESC`, `ACCIDENT_DESC`, then any column
  containing `NARR` or `DESC`), the severity column (`DEGREE_INJURY_CD` preferred), the date
  column, location, injury type, source of injury, and NAICS. If it cannot find a narrative it
  exits with the column list printed, rather than silently producing garbage.
- Drops rows with empty narratives. Sets `industry="mining"`, `language="en"`.
- **Ran successfully.** Output `msha_cleaned.csv`: **274,725 rows**.

### 4.3 `download_osha.py` — written, never completed

- Looks for a CSV already in `data/raw/` under six filename patterns.
- If not found, tries two hardcoded direct-download URLs
  (`osha.gov/severeinjury/xml/severeinjury.csv`, `osha.gov/pls/sir/sir_data.csv`) and sanity-
  checks that the response looks like CSV.
- If both fail, prints manual instructions and `sys.exit(0)`.
- `clean_osha_data()` does fuzzy column mapping by substring (`narrative|abstract|summary|
  description`, `event`+`date`, `naics`, `employer|establishment`, `nature`, `source`+`injury`,
  event type, state/city, inspection/activity id). If no narrative column matches, it falls
  back to picking the text column with the longest average length.
- Every OSHA SIR record is `severity_normalized="serious"` by definition of the dataset.
- Industry is `oil_gas` if NAICS starts with 211/213, else `general`.
- **Never produced output.** `data/processed/osha_cleaned.csv` does not exist. OSHA publishes
  through a Power BI dashboard, so the direct-URL guesses do not work; a manual download is
  needed. (Separately, a loose OSHA abstracts CSV *is* present in `data/` and the notebooks use
  it — but through a completely different code path.)

### 4.4 `process_oisd.py` — written, no input data

- Extracts text page-by-page from every PDF in `data/raw/oisd_pdfs/` using `pdfplumber`.
- `parse_oisd_sections()` walks the lines and assigns them to one of three buckets
  (`incident_brief`, `observations`, `lessons_learned`) whenever a short line matches a
  section-header regex. Uses `incident_brief` as the narrative, falling back to full text.
- Regex-scrapes a date from the first 500 characters.
- Hardcodes `industry="oil_gas"`, `location="India"`, `naics_sic="211"`,
  `severity_normalized="serious"`.
- Writes an empty CSV (header only) if no PDFs are found, so `combine_datasets.py` doesn't break.
- **`data/raw/oisd_pdfs/` is empty.** `oisd_cleaned.csv` is 1 line (header). The README says the
  OISD server was down during development. **This is the single biggest data gap**: it is the
  only planned source of real *Indian* oil & gas incident text.

### 4.5 `generate_synthetic.py` — template-based, reproducible

`random.seed(42)`, no LLM, fully deterministic. Fills templates from five vocabulary lists:

- `OIL_SITES` (12): Duliajan Field, Moran Field, Naharkatiya Field, Digboi Refinery,
  Numaligarh Refinery, Tengakhat OCS, Jorhat Workshop, Nazira OCS, Geleki Field,
  Rudrasagar Field, Lakwa Field, Baghjan Well — all real OIL locations.
- `ACTIVITIES` (20): drilling operation, workover, crane lifting, pipeline welding, hot tapping,
  scaffolding erection, tank cleaning, valve replacement, cable laying, pump maintenance, rig
  floor operation, cementing job, perforation, wireline logging, chemical injection, BOP
  testing, gas flaring, compressor overhaul, pig launching, hydrotesting.
- `EQUIPMENT` (20), `BARRIERS` (16), `BARRIER_STATES` (6: missing, not used, bypassed, expired,
  damaged, removed).

Generates exactly **150 reports**:

| Block | Count | Language tag | Templates |
|---|---|---|---|
| English near-miss / UA-UC | 50 | `en` | 10 templates in OIL's own observation genre |
| Hinglish | 50 | `hinglish` | 10 code-mixed templates |
| Assamese | 20 | `as` | 5 templates in Assamese script |
| IOGP rule-specific scenarios | 30 | `en` | 2 templates × 9 rules, sampled |

The IOGP block is the interesting one — it has hand-written scenarios for each of the 9 rules
(e.g. Confined Space: *"Worker entered {equipment} tank at {site} for {activity} without gas
testing or standby person"*), so rare rules get coverage that real data wouldn't give.

Severity is sampled per block, weighted toward `near_miss`. Output: `synthetic_reports.csv`,
150 rows.

### 4.6 `combine_datasets.py` — merge + validate

Concatenates whichever of the four cleaned CSVs exist, drops empty narratives, runs quality
checks (empty narratives, narratives under 10 chars, severities outside the controlled
vocabulary, duplicate `report_id`s, severity collapsed to a single value), then writes
`combined_reports.csv` and the `industry == "oil_gas"` subset.

**Actual output on disk:**

```
combined_reports.csv   274,875 rows
  by source:     msha_acc 274,725 | synthetic 150
  by severity:   serious 91,391 | minor 75,519 | near_miss 74,088
                 no_injury 32,665 | fatality 1,212
  by language:   en 274,805 | hinglish 50 | as 20
  by industry:   mining 274,725 | oil_gas 150
  date range:    2000-01-01 → 2026-09-03

oil_gas_subset.csv     150 rows   (i.e. the synthetic data only)
```

**The headline problem this reveals:** 99.95% of the corpus is US mining data. The oil & gas
subset is *entirely synthetic*. There is currently **zero real oil & gas text** in the combined
dataset, and zero real Indian text.

---

## 5. Step 2 — Intake channels and LLM extraction

### 5.1 `hinglish_synthetic.csv` — the file the pipeline actually runs on

50 rows, ids `hin_0000`…`hin_0049`. Columns match the unified schema but the values differ from
`generate_synthetic.py`'s output: `source="synthetic_hinglish"`, `severity_raw="unsafe_act"`,
`language="hi-en"` (note: **`hi-en` is not in `VALID_LANGUAGES`**).

Sample rows:

```
hin_0000  "scaffolding par kaam kar raha tha bina safety belt ke. height almost
           10 meter tha, fall arrestor nahi lagaya."
hin_0001  "welding chal raha tha near tank 4, but fire blanket missing tha.
           helper bina goggles ke tha."
hin_0002  "crane lifting ke time exclusion zone me log khade the. rigger ne
           barricade cross kiya."
hin_0003  "confined space entry bina gas test kiye kar raha tha. supervisor ne
           immediately stop karwaya."
```

**Important: no script in the repository generates this file.** It appears to have been written
by hand. It is not produced by `generate_synthetic.py` (different id scheme, different language
tag, different `severity_raw`). Every Step 2 and Step 3 script reads from it via
`config.HINGLISH_FILE`. So the entire classification pipeline currently operates on 50
hand-written rows, not on the 274,875-row corpus that Step 1 built.

These 50 rows are also noticeably *cleaner and more on-the-nose* than real reports would be —
almost every one explicitly names a missing barrier. That is why the SIF rate comes out at 84%.

### 5.2 `extract_pipeline.py` — LLM → strict JSON

**Backend selection** (rewritten, uncommitted): reads `LLM_BACKEND` from `.env`.

- `LLM_BACKEND=groq` → `OpenAI(base_url="https://api.groq.com/openai/v1")`,
  model from `GROQ_MODEL`, default `llama-3.1-8b-instant`.
- anything else (**the default**) → Ollama at `OLLAMA_URL` (default
  `http://localhost:11434/v1`), model from `OLLAMA_MODEL`, default `qwen2.5:7b-instruct`,
  with a dummy API key.

This is a deliberate privacy move: the default path keeps report text on-premises.

**The prompt** casts the model as an HSE inspector for an Indian oil & gas company, warns it
about Hinglish and Assamese slang, and demands *only* a JSON object matching:

```json
{
  "energy_type": "gravity | electrical | pressure | kinetic | thermal | chemical | none",
  "energy_magnitude": "high | low | unknown",
  "barrier_expected": "the safety control that should have been there",
  "barrier_state": "working | missing | degraded | bypassed | unknown",
  "activity": "the work being done",
  "location": "where it happened",
  "evidence_phrases": ["exact", "phrases", "from", "the", "text"]
}
```

Two few-shot examples follow (the scaffolding one and the crane one), both Hinglish. The call
uses `temperature=0.0` and `response_format={"type": "json_object"}`. There is a `time.sleep(1)`
between calls, applied only when the backend is Groq.

The loop is per-row with a try/except that prints the error and continues, so a malformed
response drops that report rather than killing the run.

**`evidence_phrases` is the key design decision here** — it forces the model to quote the source
text, which makes every extraction auditable and gives a human reviewer something to check
against. It is currently written to the JSON but **not used downstream by any rule or model**.

**Output:** `extracted_features.json`, 50 records. Example:

```json
{
  "report_id": "hin_0000",
  "energy_type": "gravity",
  "energy_magnitude": "high",
  "barrier_expected": "safety belt / fall arrestor",
  "barrier_state": "missing",
  "activity": "working on scaffolding",
  "location": "scaffolding (10 meter height)",
  "evidence_phrases": ["bina safety belt ke", "fall arrestor nahi lagaya"]
}
```

**Distribution across the 50 extractions:**

- `energy_type`: gravity 14, kinetic 10, chemical 9, pressure 6, thermal 5, electrical 4, none 2
- `barrier_state`: missing 36, degraded 8, working 4, bypassed 2

### 5.3 `voice_intake.py` — Groq Whisper

Sends an audio file to `whisper-large-v3` through Groq's OpenAI-compatible endpoint, with a
domain-priming prompt: *"The following is a safety report from an Indian Oil and Gas worker. It
may contain Hinglish and oilfield jargon like LOTO, scaffold, derrick, or kick."* Priming
Whisper with jargon is the right technique — it measurably improves transcription of
domain terms.

**State:** functional in principle, but never wired into the pipeline. The `__main__` block
points at `C:\Users\rithy\OneDrive\Desktop\SIH_2026\sih_2026\data\sample_voice_report.mp3` —
a path on a different person's machine. It also raises at import time if `GROQ_API_KEY` is
missing, so it cannot be imported in an Ollama-only setup. No sample audio exists in the repo.

### 5.4 `vision_intake.py` — Gemini OCR for handwritten logbooks

Uses `google.generativeai`, uploads an image, and asks for an exact transcription with no
markdown or commentary, warning the model about messy cursive and Hinglish/Assamese field slang.

**Three concrete problems:**

1. It requests model `'gemini-3.5-flash'` — **that model identifier does not exist.**
2. `google-generativeai` is **not in `requirements.txt`**, so this file will `ImportError` on a
   clean install.
3. Same stale `rithy` hardcoded test path; no sample image in the repo.

### 5.5 `llm_client.py` — new, untracked, not yet wired in

A unified client module that does two things:

- `get_llm_client()` — returns `(OpenAI client, model_name)` for whichever backend is
  configured. Same logic as `extract_pipeline.py`, factored out.
- `get_embedding_model()` / `embed_texts()` / `compute_similarity()` — lazily loads
  `sentence-transformers` `paraphrase-multilingual-MiniLM-L12-v2` (~420 MB, 50+ languages
  including Hindi/Assamese/Bengali, 384-dim, runs on CPU), encodes with
  `normalize_embeddings=True`, and provides cosine similarity as a plain dot product.

Has a `__main__` self-test that encodes a Hinglish sentence, its English equivalent, and an
unrelated Hinglish sentence, then prints both similarities to demonstrate cross-lingual
alignment.

**This is the intended replacement for TF-IDF in Method 3, and the foundation for the precedent
library — but nothing imports it yet.** It is pure dead code at the moment.

---

## 6. Step 3 — Triangulated classification

The design: three independent methods vote; if any disagrees, a human reviews. The intent is
sound. §6.6 explains why it does not currently work as claimed.

### 6.1 Method 1 — `rule_engine.py` (deterministic)

**The SIF decision** (`determine_sif`):

```python
high_energy    = energy_magnitude in ["high", "unknown"]
failed_barrier = barrier_state    in ["missing", "degraded", "bypassed"]
return high_energy and failed_barrier
```

Note `"unknown"` energy magnitude is deliberately treated as high — explicit fail-safe logic.
It also inflates the positive rate.

**IOGP tagging** (`tag_iogp_rule`) — this is the part that was rewritten and is uncommitted.

*Before (committed):* a single `if/elif/.../else` chain returning exactly **one** string. Every
report got one tag, the first match won, and the fallback was
`"System Defect / General Safety"`.

*After (working tree):* nine independent `if` blocks, each appending to a `tags` list, so a
report can carry several rules at once. Fallback is `"No specific LSR match"` — honest rather
than inventing a category. The function returns the list; `run_rule_engine()` stores it as
`iogp_rules` and keeps `iogp_rules[0]` as `iogp_rule` for backward compatibility.

Three real bugs were fixed in that rewrite:

1. **Confined Space** used to fire on any mention of `"tank"` or `"vessel"`. Now it requires
   `"confined space"` explicitly, or `"tank"` *plus* an entry keyword
   (`entry|inside|enter|entered|gas test`). Previously "welding near tank 4" was mis-tagged as
   a confined space entry.
2. **Energy Isolation** used to fire on the bare word `"electrical"`. Now it needs `loto`,
   `lock out`, `lockout`, `isolation`, or (`electrical` AND `repair`).
3. **Naming** aligned to the official IOGP wording: `"Safe Driving"` → `"Driving"`,
   `"Work Authorization"` → `"Work Authorisation"`. A new
   **"Bypassing Safety Controls"** rule was added (it was missing entirely), firing when
   `barrier_state == "bypassed"` or the context mentions bypass/override/defeat.

Matching is substring search over `f"{energy_type} {activity} {barrier_expected}"` — note this
string does **not** include `barrier_state`, which is read separately.

The engine also stamps `label_source = "Method_1_Deterministic"` on every record, marking these
as **weak labels** for training Methods 2 and 3.

**Output artifact** `classified_reports.json`: 50 records, **42 flagged SIF (84%)**.
Primary-tag distribution in the artifact:

| Tag | Count | % |
|---|---|---|
| Working at Height | 14 | 28.0% |
| System Defect / General Safety | 9 | 18.0% |
| Line of Fire | 8 | 16.0% |
| Hot Work | 6 | 12.0% |
| Safe Mechanical Lifting | 6 | 12.0% |
| Energy Isolation | 4 | 8.0% |
| Confined Space | 2 | 4.0% |
| Safe Driving | 1 | 2.0% |

### 6.2 Method 2 — `train_random_forest.py` (ML + SHAP)

- Features: `energy_type`, `energy_magnitude`, `barrier_state`, `iogp_rule`, one-hot encoded
  with `pd.get_dummies(drop_first=False)`.
- Target: `sif_potential` (the Method 1 weak label) as int.
- `train_test_split(test_size=0.2, random_state=42)` → 40 train / 10 test.
- `RandomForestClassifier(n_estimators=100, random_state=42, max_depth=5)`.
- Prints accuracy on the 10-row test set. **README reports 80%** — which on 10 rows means 8 of
  10 correct. There is no confidence interval, and one row is worth 10 percentage points.
- **SHAP**: `TreeExplainer`, handles both the old list-of-arrays and the new 3-D array return
  shapes, plots a bar summary to `shap_summary_plot.png`, then prints the top 3 features driving
  a single chosen instance with INCREASED/DECREASED direction.

The SHAP work is the genuinely valuable part — it makes the model's reasoning inspectable,
which is exactly what a safety audit needs.

### 6.3 Method 3 — `raw_text_classifier.py` (raw-text safety net)

- Reads the narratives from `hinglish_synthetic.csv`, merges the labels from
  `classified_reports.json` on `report_id`.
- `TfidfVectorizer(max_features=500, stop_words='english')`.
- `LogisticRegression(class_weight='balanced', random_state=42)`, 80/20 split.
- Prints the top 5 highest-coefficient tokens.

**The stated rationale is good:** this model never sees the LLM's JSON, so if the LLM
hallucinates structure, this path can still catch the report.

**README reports 80% accuracy** (again, 10 test rows) and these top keywords:

| Keyword | Language | Meaning | Weight |
|---|---|---|---|
| `nahi` | Hindi | "not" / "didn't" | 0.39 |
| `kar` | Hindi | "doing" | 0.32 |
| `bina` | Hindi | "without" | 0.29 |
| `near` | English | proximity | 0.29 |

That the model independently surfaced Hindi negation markers as the strongest SIF signal is a
genuinely nice result and a good demo talking point.

**Two weaknesses worth naming:** `stop_words='english'` applies an English stoplist to Hinglish
text, which strips English function words while leaving Hindi ones — an asymmetry that partly
*creates* the "Hindi words dominate" finding. And TF-IDF is exact-string matching, so
`"bina helmet"` and `"without helmet"` are unrelated features. The README already acknowledges
this and proposes multilingual embeddings; `llm_client.py` is the unused groundwork for it.

### 6.4 The Disagreement Engine — `final_sif_voter.py`

Re-runs all three methods over the full 50 rows and votes:

- M1 = the stored `sif_potential`.
- M2 = Random Forest over the same one-hot features.
- M3 = Logistic Regression over TF-IDF of the narratives.
- Unanimous True → `SIF_CONFIRMED`; unanimous False → `SAFE`; **any** disagreement →
  `NEEDS_HUMAN_REVIEW`.

**The uncommitted change here is the most important single fix in the working tree.** The
committed version did `rf.fit(X, y); rf.predict(X)` — training and predicting on the same rows.
Both models therefore reproduced the labels almost perfectly, so nothing ever disagreed, so the
review queue was always empty. The new version uses
`cross_val_predict(..., cv=min(5, len(df)))`, so each row's prediction comes from a fold that
did not train on it. Also fixed: `.iloc` positional indexing (the old `df['col'][i]` form is
label-based and breaks on a non-default index) and `max_iter=1000` on the logistic regression
to stop convergence warnings.

**The artifact on disk is from the OLD leaky version:**

```
final_triaged_reports.csv   50 rows
  SIF_CONFIRMED       42
  SAFE                 8
  NEEDS_HUMAN_REVIEW   0     ← all three methods identical on all 50 rows
```

So the disagreement engine, the centrepiece of the "we don't trust one model" argument, has
**never actually produced a disagreement** in the committed artifacts. Re-running with the fixed
code will almost certainly produce a non-empty review queue — and that is the number worth
reporting.

### 6.5 `academic_crosscheck.py` — external validation

Compares the AI's `iogp_rule` distribution against published compliance-failure rates from:

> Abanum et al., *"Compliance Evaluation of IOGP Life-Saving Rules Amongst Petroleum Industry
> Workers"*, DOI `10.9790/0837-2501022233` — a cross-sectional survey of **317 petroleum
> workers** in Delta State, Nigeria (Shell/SPDC operations).

The rationale is defensible: it is real sharp-end oilfield data from an oil-producing nation,
and it is the closest published proxy available for what OIL's own distribution would look like.

Produces a side-by-side bar chart (`academic_validation.png`) in an enterprise palette
(`#0F4C81` / `#F58220`):

| IOGP Rule | Our AI | Abanum et al. |
|---|---|---|
| Working at Height | 28.0% | 38.5% |
| Line of Fire | 16.0% | 12.0% |
| Hot Work | 12.0% | 15.5% |
| Safe Mechanical Lifting | 12.0% | 22.0% |
| Confined Space | 4.0% | 12.0% |

"Working at Height" dominating in both is the headline claim.

**Two caveats that must be stated before presenting this:**

1. The academic percentages are a **hardcoded list**: `[38.5, 22.0, 15.5, 12.0, 12.0]`. The
   committed comment called them *"Simulated Academic Data"*. The uncommitted edit changed that
   to a `TODO: Verify these numbers against the actual paper before presenting`. **They have not
   been verified.** Presenting unverified numbers attributed to a named paper is the kind of
   thing a technical judge will check.
2. The comparison is between *our tagging distribution on 50 synthetic Hinglish reports* and
   *self-reported rule-compliance rates from a survey*. Those are different quantities. A
   trend agreement is suggestive, not validation.

Also, the chart reads only the single primary `iogp_rule`, so the multi-label work in the
rewritten rule engine does not reach it.

### 6.6 Why the "triangulation" is weaker than it looks

This is the most important critique of the `src/` pipeline, and the notebooks (§8) state it
explicitly:

- Method 1 produces the labels.
- Method 2 is trained **on Method 1's labels**, using features that are **the same fields Method
  1's rule reads** (`energy_magnitude`, `barrier_state`) plus a field **Method 1 itself computed**
  (`iogp_rule`).
- Method 3 is trained **on Method 1's labels** too.

So Methods 2 and 3 are not independent checks — they are approximations of Method 1. When they
agree with it, that proves only that a Random Forest can learn a two-condition AND rule (it
can; trivially). The "80% accuracy" figures measure *how well the ML reproduces the rule*, not
how well anything detects SIF potential.

The notebook says this in as many words:

> *"Do not train anything on labels the rule engine produced, then present agreement between
> them as validation."*

The fix is to train the cross-check on an **independent** label — the notebooks do exactly that,
using OSHA's own human-assigned Fatal/Nonfatal field.

---

## 7. What the artifacts on disk actually reflect (stale-state audit)

This matters a lot if you are reasoning about the numbers.

**`classified_reports.json` was produced by the OLD committed `rule_engine.py`, not the current
working-tree version.** Proof:

- It has an `iogp_rule` key but **no `iogp_rules` key** — the multi-label list the new code adds.
- It contains the tags `"System Defect / General Safety"` (9 records) and `"Safe Driving"`
  (1 record) — strings the current code **no longer emits** (they are now `"No specific LSR
  match"` and `"Driving"`).

**`final_triaged_reports.csv` was produced by the OLD leaky voter** (0 disagreements, all three
columns identical).

**Consequently, every downstream number in the README — the 42/50 SIF count, the tag
distribution, the academic comparison percentages, the two 80% accuracies, the empty review
queue — describes the *previous* version of the code.** None of them have been regenerated
since the rule engine and voter were rewritten.

The fix is mechanical: re-run steps 2→3 in order. The SIF count may shift (the Confined Space
and Energy Isolation fixes change tags, not the SIF test itself, so 42 should hold; the tag
distribution will definitely change), and the review queue should become non-empty.

---

## 8. `cla/` — the two notebooks, and the real measured evidence

These are untracked and easy to miss, but they contain the most methodologically careful work in
the project, run against **real OSHA data at scale**, with confidence intervals and an explicit
hunt for leakage. `SIF_classification_baseline (1).ipynb` is the source (41 cells);
`executed (1).ipynb` is the same notebook with outputs preserved. It was run on a Debian machine
(the `pip install` cell failed with `externally-managed-environment`), so the deps were already
present there.

**Inputs used:** `January2015toNovember2025__1_.csv` (OSHA Severe Injury Reports, **105,996 ×
28**) and `OSHA_HSE_DATA_ALL_ABSTRACTS_15-17_FINAL.csv` (OSHA abstracts, **4,847 × 29**, with a
human-assigned `Degree of Injury` field: **Fatal 2,964 / Nonfatal 1,883**). The abstracts file
is present in `data/`; the SIR file is **not** in the repo.

### 8.1 What the notebook builds

- **`extract_chain(text)`** — a regex implementation of the same extraction contract the LLM
  fulfils. Emits `{energy_source, all_energy_sources, barrier_state, evidence_phrases}`.
  Deliberately identical in output shape to the LLM version, so the engine below is unchanged in
  both modes and the whole notebook runs offline with no API key. Energy patterns cover
  `gravity_suspended`, `gravity_fall`, `falling_object`, `mechanical_motion`, `electrical`,
  `chemical`, `thermal`, `pressure`, `mobile_equipment`, `excavation`, `confined_space`.
- **`energy_magnitude()`** — a **threshold table written by the team**, so the high/low boundary
  is code, not a model's opinion. This is directly defensible in a judging session.
- **`rule_verdict()`** — and this is the key design difference from `src/`: it is **tri-state**.
  `SIF` / `NOT_SIF` / **`INSUFFICIENT`**. If the text names no energy source, or says nothing
  about the barrier, the report goes to a review queue instead of receiving a confident
  negative. A trained classifier has no such option and will always guess.
- **Contradiction checks** — cheap code validators that compare the structured output against
  the raw text it came from, catching extraction errors without a second model:
  - barrier reported `working` but the text contains a negation (`not` / `without`)
  - `confined_space` present but no mention of gas test / atmosphere / monitor / ventilation
  - `electrical` present but no mention of lockout / isolation / de-energize / tagout / grounded
  - height named but no fall protection mentioned
- **`wilson()`** — a hand-rolled Wilson score interval, no `statsmodels` dependency. Every
  reported rate comes with a 95% CI and an `n`.
- **Leakage-controlled text classifier** — see 8.3.
- **Routing function** — four-way: insufficient information / contradiction / rule-vs-model
  disagreement / agreed.
- **Gold-set builder** — samples 100 reports **stratified to the real base rate** (`POS_RATE =
  0.22`, matching the problem statement's expected 20–25% SIF), assigns each a **difficulty
  tier** from how the system behaved (`ambiguous` if the rule abstained, `hard` if rule and
  model disagreed, `clear` otherwise), and writes `gold_set_to_label.csv` with blank
  `label_sif`, `label_energy`, `label_barrier`, `label_iogp`, `labeller`, `notes` columns.
  Instructions: two people label independently, then argue out disagreements; nobody who wrote
  the extraction prompt may label; never reuse a gold row as a prompt example.
- **`score_gold()`** — tiered precision/recall with Wilson CIs per tier plus overall, ready for
  when the labels come back.
- **Precedent library seed** — converts each chain into a short "chain sentence"
  (`"gravity suspended, barrier degraded, rigging fell on the employee loose"`) and writes 150
  of them to `precedent_seed.csv`. The insight: two very differently worded reports about a
  suspended load collapse to nearly the same chain sentence, so matching on **chains** beats
  matching on **text**.

### 8.2 Measured results — the findings that matter

**Finding 1: OSHA narratives are the wrong genre, and that is worth knowing.**

```
barrier state coverage (4,847 OSHA abstracts)
  unknown     93.91%
  missing      3.30%
  degraded     2.08%
  bypassed     0.60%
  working      0.10%

barrier actually described in:  6.1% of reports
rule verdicts:  INSUFFICIENT 96.0% | SIF 3.9% | NOT_SIF 0.1%
```

The explanation is sharp: OSHA narratives are written *after* an injury, so they describe an
**outcome** — what hit the person and what it broke. A UA/UC observation is written *before*
anything happens, so it describes a **condition** — what guard was missing, what permit was not
raised. The barrier language the rule depends on simply is not in post-hoc injury text.

Three consequences, all worth stating out loud:

1. The rule is not broken here; it is **correctly abstaining**. That is what `INSUFFICIENT` is
   for. A classifier has no such option and will guess.
2. **OIL's own UA/UC reports are the right genre.** This is the strongest possible argument for
   asking OIL for their data.
3. Synthetic data must be written in the right genre — present tense, condition not outcome.

**Coverage is improvable and the improvement is measurable.** Adding 12 extra "missing barrier"
regex patterns (`should have been`, `failed`, `not wearing`, `no fall protection`, `was not`,
`had been removed`, `did not`, `none was/were`, `without`, `improper*`, `unprotected`,
`open hole/hatch/pit`):

```
barrier described, before:  6.1%   → after: 18.5%
decided reports:            4.0%   → after: 12.4%  (192 → 601 reports)
```

Every added pattern is one line, readable by a safety officer, and moves coverage. That is the
practical difference between a rule you can improve and a model you have to retrain.

**Finding 2: the high-energy concept holds up on real, independent data.** Fatality rate by
extracted energy source (restricted to sources with n ≥ 40):

| Energy source | Fatal rate | n |
|---|---|---|
| electrical | 0.790 | 157 |
| falling_object | 0.778 | 54 |
| mobile_equipment | 0.759 | 862 |
| chemical | 0.742 | 89 |
| gravity_suspended | 0.728 | 235 |
| excavation | 0.724 | 58 |
| gravity_fall | 0.645 | 950 |
| thermal | 0.582 | 110 |
| pressure | 0.577 | 97 |
| other | 0.564 | 1687 |
| mechanical_motion | 0.305 | 509 |

Chemical, electrical, mobile equipment and suspended loads sit far above mechanical motion.
**That spread is the high-energy concept appearing in independent data**, and it is the defensible
answer to *"why do you treat a suspended load as high energy?"*

**Rule performance, scored only where it had the information to decide:**

```
decided on 192 of 4,847 reports (4.0%);  abstained 96.0%
              precision   recall   f1     support
  not fatal      0.400     0.021   0.040     95
  fatal          0.503     0.969   0.662     97
  accuracy                         0.500    192

precision 0.503   95% CI [0.432, 0.574]   n=187
recall    0.969   95% CI [0.913, 0.989]   n=97
```

After widening the barrier patterns (601 decided, 12.4%): accuracy 0.606, fatal precision 0.608,
fatal recall 0.989.

The notebook's own reading of this is careful and worth reproducing: precision sitting near the
base rate is **expected** here, because the decided subset is roughly half fatal to begin with,
and because `y_fatal` measures **outcome** while the rule predicts **potential**. A report
correctly flagged SIF whose victim survived is not a false positive in the real task — only in
this proxy. Very high recall with abstention is the behaviour you actually want from a triage
system.

### 8.3 Finding 3 — the leakage, and why it is the best argument in the project

The notebook trains the raw-text cross-check on OSHA's **own human-assigned** Fatal/Nonfatal
field, explicitly *not* on rule-produced labels, because a model trained on the rule's output
would only ever agree with the rule and agreement would prove nothing.

Trained naively:

```
naive accuracy: 0.973    fatal-class recall: 0.982

top features pushing FATAL:
killed, was killed, died, 2016, 2015, 2016 an, 2015 an, on may, employee died,
may, and died, head, worker, and killed, killing, found, death, 2016 employee,
trauma, electrocuted, him, was found, was electrocuted, blunt, november
```

97.3% accuracy — and the feature list shows it is worthless. The model is reading **the ending
of the story** (`died`, `killed`, `electrocuted`) and, worse, **the date stamp** (`2016`, `2015`,
`november`, `on may`) — because the fatal and nonfatal records in that file come from different
collection periods.

So the notebook masks both: a large regex over outcome vocabulary (`died|dead|fatal*|kill*|
deceas*|coroner|morgue|autops*|succumb*|surviv*|hospitaliz*|amputat*|fractur*|laceration*|
contusion*|electrocut*|asphyxiat*|drown*|trauma|injur*|wound*|burns?` …) plus years and month
names, then retrains:

```
naive           accuracy 0.973
leak-controlled accuracy 0.917

              precision   recall   f1     support
  not fatal      0.922     0.858   0.889    471
  fatal          0.913     0.954   0.933    741
  accuracy                         0.917   1212

top features after masking:
head, worker, him, found, was from, and was, head and, was found, crushed,
heart, the worker, later, truck, from, worker was, over, tree, attack,
heart attack, employee from, vehicle, was crushed, result of, body, unresponsive
```

**Report both numbers. The gap between them is the most useful thing in the notebook, and no
other team will have measured it.** It is also the cleanest available argument for the
architecture: a trained classifier will happily reach a very high score by learning outcome
vocabulary, and **nothing on its output tells you that is what happened**. The rule cannot do
this, because it only ever sees an energy source and a barrier state.

The notebook is honest that residual leakage remains even after masking, and says to state that
rather than claim the masked number is clean.

### 8.4 Routing and gold set

```
routing over 4,847 abstracts
  review: not enough information          96.0%
  review: contradiction                    1.4%
  review: rule and text model disagree     1.3%
  agreed                                   1.2%

gold_set_to_label.csv  — 100 rows written
  tier: ambiguous 73 | clear 18 | hard 9
  STATUS: NOT YET LABELLED
```

### 8.5 Scale test on the 105,996-row SIR file

An 8,000-row sample:

```
energy_source                     verdict
  other              4137           INSUFFICIENT  96.8%
  mobile_equipment   1083           SIF            3.1%
  gravity_fall        973           NOT_SIF        0.1%
  mechanical_motion   838
  gravity_suspended   269
  thermal             202
  falling_object      128
  electrical          125
  pressure            100
  chemical             81
```

Same abstention pattern, confirming Finding 1 at scale. `other` at 4,137 also flags that the
energy-pattern coverage itself has room to grow.

### 8.6 The notebook's own "what to do next"

1. Widen `BARRIER_PATTERNS` — the binding constraint on how often the rule can decide, and every
   pattern is cheap and auditable.
2. Swap `extract_chain` for the LLM version; the output shape is unchanged so nothing downstream
   moves. **Keep the regex version as a no-API-key fallback for the demo.**
3. Write synthetic UA/UC observations in the right genre — present tense, condition not outcome,
   including Hinglish and Assamese.
4. Label the gold set and fill in the real numbers.
5. Embed `precedent_seed.csv` chain sentences with a MiniLM model and match by cosine similarity.
6. **Do not** train anything on labels the rule engine produced and then present agreement
   between them as validation.

---

## 9. README vs. code — every discrepancy

| README says | Code / artifacts actually say |
|---|---|
| Extraction uses `openai/gpt-oss-120b` via Groq | Default backend is **Ollama `qwen2.5:7b-instruct`**; Groq fallback is `llama-3.1-8b-instant`. `gpt-oss-120b` appears nowhere in the code. |
| Vision intake uses "Gemini 3.5 Flash" | `vision_intake.py` requests `'gemini-3.5-flash'` — **that model id does not exist**, and `google-generativeai` is not in `requirements.txt`. |
| "42 out of 50 reports flagged" | Correct for the artifact — but that artifact came from the **old** rule engine. |
| Method 2 accuracy 80% | True, on a **10-row test set**, against labels Method 1 generated. No CI. |
| Method 3 accuracy 80% | Same caveat. |
| "If even one method disagrees, the report is flagged NEEDS_HUMAN_REVIEW" | The shipped artifact has **0 reports needing review** — the old voter trained and predicted on the same rows, so disagreement was structurally impossible. Fixed in the working tree, not yet re-run. |
| Academic percentages attributed to Abanum et al. | Hardcoded list; the committed code called them *"Simulated Academic Data"*; the current code carries a `TODO: Verify`. **Unverified.** |
| Project structure shows `notebooks/` | Does not exist. The notebooks are in untracked `cla/`. |
| Project structure shows `data/raw/oisd_pdfs/` with content | Directory exists and is **empty**. |
| Three methods "cross-check each other" | Methods 2 and 3 are trained on Method 1's labels, and Method 2's features include a field Method 1 computed. They are not independent. |
| Mermaid diagram shows an embedding model feeding Method 3 | Method 3 uses **TF-IDF**. The embedding client exists (`llm_client.py`) but is not wired in. |

---

## 10. Known bugs and weaknesses, ranked

**Blocking / correctness**

1. **Artifacts are stale** (§7). Every published number describes superseded code.
2. **Methods 2 and 3 are not independent of Method 1** (§6.6). The triangulation claim does not
   hold as implemented.
3. **`vision_intake.py` cannot run**: nonexistent model id + missing dependency.
4. **`voice_intake.py` and `vision_intake.py` still hardcode another machine's paths**
   (`C:\Users\rithy\...`) and raise at import if their key is absent.
5. **Academic comparison numbers are unverified** and attributed to a named paper.

**Methodological**

6. Test sets of **10 rows**. Accuracy reported to two decimals with no interval; one row moves
   the number by 10 points.
7. **`stop_words='english'` on Hinglish text** — strips English function words but not Hindi
   ones, which partly manufactures the "Hindi negation dominates" result.
8. TF-IDF cannot relate `"bina helmet"` to `"without helmet"`.
9. `src/` has **no `INSUFFICIENT` state** — unlike the notebook, it forces a binary call on every
   report. `determine_sif` maps unknown energy to *high*, which is fail-safe but also means
   "we don't know" becomes "yes".
10. The 84% SIF rate on `hinglish_synthetic.csv` reflects how the 50 rows were written (nearly
    all explicitly name a missing barrier), not a realistic base rate. The problem statement
    implies ~20–25%.

**Data**

11. **No real Indian data at all.** OISD is empty; the oil & gas subset is 100% synthetic.
12. **No real oil & gas data at all.** 99.95% of the combined corpus is US mining.
13. **OSHA ingest never completed** — yet a usable OSHA abstracts CSV is sitting in `data/`,
    used only by the notebooks through a separate path.
14. **`hinglish_synthetic.csv` has no generator script.** It is hand-written and unreproducible,
    yet it is the sole input to Steps 2–3.
15. `hinglish_synthetic.csv` uses `language="hi-en"`, which is **not in `VALID_LANGUAGES`**
    (`hinglish` is). `combine_datasets.py` would not flag this because that file is never
    combined.
16. Loose files in `data/` (Fatalities FY09–12, fy13–17 summaries, the xlsx) are wired to
    nothing.

**Code hygiene**

17. The two notebooks are **untracked** — the best work in the repo is one `git clean` from
    being lost.
18. `llm_client.py` is dead code; nothing imports it.
19. `EEI_SCL_PRECURSORS`, `BEHAVIORAL_FACTORS`, and `BARRIER_STATES` in `config.py` are defined
    but unused; the rule engine hardcodes its own barrier strings instead.
20. `evidence_phrases` — the audit trail the prompt works hard to produce — is stored and then
    never used downstream.
21. `IOGP_RULES` is imported into `rule_engine.py` but never referenced; the nine tag strings are
    duplicated as literals, so the two can drift.
22. `academic_crosscheck.py`, `train_random_forest.py` and `final_sif_voter.py` all read only the
    primary `iogp_rule`, so the new multi-label output does not reach any consumer.
23. `train_random_forest.py` calls `rf_model.predict([report_features])` with a pandas Series,
      which triggers a sklearn feature-names warning.
24. No `__init__.py` in `src/`; the `sys.path.insert` + `from data_pipeline.config import ...`
    pattern only works when scripts are launched as `python src/<name>.py` from the repo root.
25. No tests of any kind. No CI.
26. 228 MB `Accidents.txt` and 52 MB `Accidents.zip` sit in the working tree (gitignored, but
    present).

---

## 11. What has NOT been built

- **Steps 4–7** of the stated 7-step approach. The README says Steps 1–3 are complete and 4–7
  are "in progress"; there is no code for them. What they are is not documented anywhere in the
  repo.
- **Any user interface.** No dashboard, no API, no web app, no CLI beyond `python src/x.py`.
- **The precedent / similar-incident library.** Designed in the notebook (`precedent_seed.csv`,
  chain-sentence embedding, cosine matching), not implemented in `src/`.
- **Recurring-pattern surfacing** — explicitly part of the problem statement, not built.
- **Gold-set labelling.** The 100-row file was generated; nobody has labelled it. Until that
  happens there is **no ground truth anywhere in the project**.
- **Model persistence.** `MODELS_DIR` was added to config and `joblib` to requirements, but
  nothing saves or loads a model. Every script retrains from scratch.
- **End-to-end runner.** No script chains Steps 1→2→3.
- **Local Whisper / local OCR.** The README commits to on-premises replacements for Groq Whisper
  and Gemini; the Ollama switch is done, the other two are not.
- **Embedding-based Method 3.** Client written, not wired in.
- **Running the real corpus through the pipeline.** All 274,875 rows sit unused; only the 50
  hand-written Hinglish rows have been processed.

---

## 12. How to reproduce everything from scratch

```bash
# 0. Environment
python -m venv venv && venv\Scripts\activate       # Windows
pip install -r requirements.txt
# NOTE: add google-generativeai manually if you want vision_intake.py
cp .env.example .env                                # then fill in keys if using Groq/Gemini

# 1. Data foundation  (run from repo root)
python src/data_pipeline/download_msha.py           # ~52MB download, ~1 min, then a slow parse
python src/data_pipeline/download_osha.py           # WILL FAIL — needs a manual CSV in data/raw/
python src/data_pipeline/process_oisd.py            # no-op — data/raw/oisd_pdfs/ is empty
python src/data_pipeline/generate_synthetic.py      # 150 rows, deterministic (seed 42)
python src/data_pipeline/combine_datasets.py        # → combined_reports.csv + oil_gas_subset.csv

# 2. Extraction (needs Ollama running, or LLM_BACKEND=groq in .env)
ollama serve
ollama pull qwen2.5:7b-instruct
python src/extract_pipeline.py                      # hinglish_synthetic.csv → extracted_features.json

# 3. Classification
python src/rule_engine.py                           # → classified_reports.json  (REGENERATES STALE DATA)
python src/train_random_forest.py                   # → shap_summary_plot.png
python src/raw_text_classifier.py                   # prints accuracy + top keywords
python src/final_sif_voter.py                       # → final_triaged_reports.csv (REGENERATES STALE DATA)
python src/academic_crosscheck.py                   # → academic_validation.png

# Optional: verify the embedding client works
python src/llm_client.py
```

The notebooks in `cla/` need `January2015toNovember2025__1_.csv` (OSHA SIR, not in the repo) and
`OSHA_HSE_DATA_ALL_ABSTRACTS_15-17_FINAL.csv` (present in `data/`, but under a different
filename — spaces instead of underscores, so the path in the notebook needs adjusting).

---

## 13. The honest one-paragraph summary

A complete, runnable Step 1→3 pipeline exists: MSHA ingest works at scale (274k rows), a
deterministic 150-row synthetic generator covers Hinglish, Assamese and all 9 IOGP rules, an
LLM extractor turns free text into a strict evidence-carrying JSON schema with a local-first
backend, a hand-written rule engine applies the published high-energy × failed-barrier test and
tags IOGP rules, a Random Forest with SHAP makes the decision inspectable, a TF-IDF model reads
the raw text as a fallback, and a voting layer routes disagreement to a human. Two intake
channels (voice, handwriting OCR) are sketched. Separately — and this is the stronger half of
the project — a pair of notebooks measures the same rule against 4,847 real OSHA narratives with
Wilson intervals, discovers that barrier language appears in only 6.1% of post-injury text (so
the rule correctly abstains 96% of the time, which is an argument *for* the architecture and
*for* getting OIL's UA/UC data), demonstrates that fatality rate really does track extracted
energy source on independent data (electrical 0.79 vs mechanical motion 0.31), and catches a
text classifier scoring 97.3% purely by reading outcome words and year stamps — dropping to
91.7% once masked. What is missing is real Indian and real oil & gas data, any labelled ground
truth, Steps 4–7, any interface, and a regeneration of the published artifacts, which currently
reflect superseded code. The single most damaging gap to fix before presenting is that Methods 2
and 3 are trained on Method 1's own labels, so their agreement is not evidence of anything —
the notebooks already show how to do it properly.

---

## Verification

To confirm the claims in this document:

```bash
git status --short                      # confirms the uncommitted set in §2
git diff src/rule_engine.py             # confirms the single→multi-label rewrite
git diff src/final_sif_voter.py         # confirms the cross_val_predict leakage fix

python -c "import json; d=json.load(open('data/processed/classified_reports.json',encoding='utf-8')); print('iogp_rules' in d[0], sum(1 for r in d if r['sif_potential']), len(d))"
# → False 42 50    (False proves the artifact predates the rewrite)

python -c "import pandas as pd; print(pd.read_csv('data/processed/final_triaged_reports.csv')['final_status'].value_counts())"
# → SIF_CONFIRMED 42, SAFE 8, no NEEDS_HUMAN_REVIEW
```

Notebook numbers are all read directly from the stored outputs in `cla/executed (1).ipynb`.
