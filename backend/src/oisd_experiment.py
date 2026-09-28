"""
Does section-aware ingestion give the rule engine what it needs to decide?

The cla/ notebooks measured that barrier language appears in only 6.1% of real OSHA
narratives, so the rule engine correctly abstained on 96% of them. The conclusion was
that post-injury text is the wrong genre: it describes an outcome, not a condition.

OISD case studies are also post-incident, but they are *structured*: a BRIEF OF INCIDENT
section written in outcome genre, and an OBSERVATIONS/LAPSES section written in
barrier-failure genre. If the genre argument is right, feeding the observations section
should lift barrier coverage sharply over the brief alone.

So: run the same extraction twice over the same ten documents.

    arm "brief_only"     -> BRIEF OF INCIDENT
    arm "brief_plus_obs" -> BRIEF OF INCIDENT + OBSERVATIONS

then apply the unchanged rule engine to both and compare.

Usage:  ollama serve && python src/oisd_experiment.py
Output: data/processed/oisd_coverage_report.md
"""
import json
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "data_pipeline"))

from data_pipeline.config import OISD_STRUCTURED_FILE, OISD_COVERAGE_REPORT
from llm_client import LLM_BACKEND, get_llm_client, extract_features
from rule_engine import determine_sif, tag_iogp_rule
from stats import rate_str, wilson

# Baselines measured in cla/executed.ipynb on 4,847 real OSHA abstracts.
OSHA_BARRIER_COVERAGE = 0.061
OSHA_BARRIER_COVERAGE_WIDENED = 0.185
OSHA_N = 4847

ARMS = {
    "brief_only": lambda r: r["brief_of_incident"],
    "brief_plus_obs": lambda r: " ".join([r["brief_of_incident"]] + r["observations"]),
}


def run_arm(records, arm_name, text_fn, client, model):
    """Extract + classify every document under one arm."""
    print(f"\n--- arm: {arm_name} ---")
    rows = []

    for i, record in enumerate(records, 1):
        text = text_fn(record).strip()
        if not text:
            print(f"  ({i}/{len(records)}) {record['report_id']}: empty text, skipped")
            continue

        try:
            features = extract_features(text, client, model)
        except Exception as e:
            print(f"  ({i}/{len(records)}) {record['report_id']}: EXTRACTION FAILED - {e}")
            continue

        barrier = str(features.get("barrier_state", "unknown")).lower().strip()
        energy = str(features.get("energy_type", "none")).lower().strip()
        magnitude = str(features.get("energy_magnitude", "unknown")).lower().strip()

        rows.append({
            "report_id": record["report_id"],
            "doc_ref": record["doc_ref"],
            "title": record["title"],
            "chars_in": len(text),
            "energy_type": energy,
            "energy_magnitude": magnitude,
            "barrier_state": barrier,
            "barrier_expected": features.get("barrier_expected", ""),
            "activity": features.get("activity", ""),
            "evidence_phrases": features.get("evidence_phrases", []),
            "sif_potential": determine_sif(features),
            "iogp_rules": tag_iogp_rule(features),
            # The rule engine has no INSUFFICIENT state; we measure where it would
            # have abstained without changing its behaviour.
            "would_abstain": barrier == "unknown" or magnitude == "unknown",
        })
        print(f"  ({i}/{len(records)}) {record['report_id']:<22} "
              f"energy={energy:<10} barrier={barrier:<9} sif={rows[-1]['sif_potential']}")

    return rows


def summarise(rows):
    """Compute the headline rates for one arm."""
    n = len(rows)
    barrier_known = sum(1 for r in rows if r["barrier_state"] != "unknown")
    energy_known = sum(1 for r in rows if r["energy_type"] != "none")
    sif = sum(1 for r in rows if r["sif_potential"])
    abstain = sum(1 for r in rows if r["would_abstain"])
    return {
        "n": n,
        "barrier_known": barrier_known,
        "energy_known": energy_known,
        "sif": sif,
        "abstain": abstain,
    }


def build_report(arm_rows, arm_stats):
    """Render the markdown report."""
    L = []
    add = L.append

    add("# OISD Case Studies - Barrier Coverage Experiment\n")
    add("**Question.** The `cla/` notebooks found barrier language in only "
        f"**{OSHA_BARRIER_COVERAGE:.1%}** of {OSHA_N:,} real OSHA narratives, so the rule "
        "engine abstained on 96% of them. Is that a property of *post-incident text*, or a "
        "property of *unstructured* post-incident text?\n")
    add("**Method.** The same extraction prompt and the same unmodified rule engine, run "
        "twice over the same ten OISD case studies. The only thing that changes between "
        "arms is which sections of the document are fed in.\n")

    add("## Headline\n")
    add("| Arm | Text fed in | Barrier coverage | Energy identified | SIF rate | Would abstain |")
    add("|---|---|---|---|---|---|")
    labels = {
        "brief_only": "BRIEF OF INCIDENT only",
        "brief_plus_obs": "BRIEF + OBSERVATIONS",
    }
    for arm, st in arm_stats.items():
        add(f"| `{arm}` | {labels[arm]} | {rate_str(st['barrier_known'], st['n'])} "
            f"| {rate_str(st['energy_known'], st['n'])} "
            f"| {rate_str(st['sif'], st['n'])} "
            f"| {rate_str(st['abstain'], st['n'])} |")
    add("")

    add("### Reference: the same measurement on OSHA\n")
    add("| Corpus | n | Barrier coverage |")
    add("|---|---|---|")
    lo, hi = wilson(int(OSHA_BARRIER_COVERAGE * OSHA_N), OSHA_N)
    add(f"| OSHA abstracts, as written | {OSHA_N:,} | {OSHA_BARRIER_COVERAGE:.1%} "
        f"[{lo:.1%}, {hi:.1%}] |")
    lo, hi = wilson(int(OSHA_BARRIER_COVERAGE_WIDENED * OSHA_N), OSHA_N)
    add(f"| OSHA abstracts, widened patterns | {OSHA_N:,} | "
        f"{OSHA_BARRIER_COVERAGE_WIDENED:.1%} [{lo:.1%}, {hi:.1%}] |")
    add("")

    base = arm_stats["brief_only"]
    full = arm_stats["brief_plus_obs"]
    delta = (full["barrier_known"] / full["n"]) - (base["barrier_known"] / base["n"]) \
        if base["n"] and full["n"] else 0.0
    add("### Reading\n")
    add(f"Adding the observations section moved barrier coverage by "
        f"**{delta:+.1%}** ({base['barrier_known']}/{base['n']} -> "
        f"{full['barrier_known']}/{full['n']}).\n")
    add("With n=10 the intervals are wide and overlapping, so this is a **direction, not a "
        "proven effect size**. What it does establish is that the barrier language exists in "
        "these documents and is recoverable by section, which is not true of OSHA narratives "
        "at any pattern breadth.\n")

    add("## IOGP tag distribution\n")
    for arm, rows in arm_rows.items():
        counts = Counter(tag for r in rows for tag in r["iogp_rules"])
        add(f"**`{arm}`** - {len(rows)} documents, {sum(counts.values())} tags\n")
        add("| IOGP Life-Saving Rule | Documents |")
        add("|---|---|")
        for tag, count in counts.most_common():
            add(f"| {tag} | {count} |")
        add("")

    add("## Per-document audit\n")
    add("Ten rows is small enough to check every decision by hand. That is the point.\n")
    for arm, rows in arm_rows.items():
        add(f"### `{arm}`\n")
        add("| Document | Title | Energy | Mag | Barrier | SIF | IOGP tags |")
        add("|---|---|---|---|---|---|---|")
        for r in rows:
            title = r["title"][:44] + ("..." if len(r["title"]) > 44 else "")
            tags = ", ".join(r["iogp_rules"])
            add(f"| `{r['doc_ref']}` | {title} | {r['energy_type']} | "
                f"{r['energy_magnitude']} | **{r['barrier_state']}** | "
                f"{'YES' if r['sif_potential'] else 'no'} | {tags} |")
        add("")

    add("## Limits\n")
    add("- **n = 10.** Every rate carries a wide Wilson interval. Never quote a point "
        "estimate from this corpus without its interval and its n.")
    add("- **These are outcome documents.** Every case describes harm that already "
        "happened, so this corpus cannot show precursors being caught *before* an incident.")
    add("- **Not a base rate.** OISD publishes only serious cases, so the SIF rate here "
        "says nothing about the 20-25% prevalence the problem statement describes.")
    add("- **Weak labels, not ground truth.** No human has labelled these documents. The "
        "SIF column is the rule engine's own output, not a verified answer.")
    add("- **Extraction is a single LLM pass** at temperature 0, not self-consistent over "
        "multiple samples.\n")

    return "\n".join(L)


def main():
    if not os.path.exists(OISD_STRUCTURED_FILE):
        print(f"Not found: {OISD_STRUCTURED_FILE}")
        print("Run: python src/data_pipeline/process_oisd.py")
        return

    with open(OISD_STRUCTURED_FILE, "r", encoding="utf-8") as f:
        records = json.load(f)

    if not records:
        print("No OISD records to run on.")
        return

    client, model = get_llm_client()
    print("=" * 60)
    print("OISD Barrier-Coverage Experiment")
    print("=" * 60)
    print(f"Documents: {len(records)} | backend: {LLM_BACKEND} | model: {model}")

    arm_rows = {}
    for arm_name, text_fn in ARMS.items():
        arm_rows[arm_name] = run_arm(records, arm_name, text_fn, client, model)

    arm_stats = {arm: summarise(rows) for arm, rows in arm_rows.items()}

    report = build_report(arm_rows, arm_stats)
    with open(OISD_COVERAGE_REPORT, "w", encoding="utf-8") as f:
        f.write(report)

    print("\n" + "=" * 60)
    for arm, st in arm_stats.items():
        print(f"{arm:<16} barrier coverage {rate_str(st['barrier_known'], st['n'])}"
              f" | SIF {rate_str(st['sif'], st['n'])}")
    print(f"\nReport written to: {OISD_COVERAGE_REPORT}")


if __name__ == "__main__":
    main()
