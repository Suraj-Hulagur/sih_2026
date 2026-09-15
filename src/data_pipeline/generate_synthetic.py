"""
Generate targeted synthetic safety reports to fill coverage gaps.

Only ~150 reports total — fills specific gaps real data doesn't cover:
  - Hinglish reports (~50): Oil & gas scenarios in Hindi-English code-mix
  - Assamese reports (~20): Key safety scenarios in Assamese
  - Rare IOGP rule scenarios (~30): Confined space, working at height, etc.
  - Near-miss UA/UC style reports (~50): The format OIL actually uses

Uses templates + random variation. No LLM needed — fully reproducible.
"""
import os
import random
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config

# Seed for reproducibility
random.seed(42)

# ─── Templates ────────────────────────────────────────────────────────────────

# Oil & gas sites typical for OIL (Oil India Limited)
OIL_SITES = [
    "Duliajan Field", "Moran Field", "Naharkatiya Field", "Digboi Refinery",
    "Numaligarh Refinery", "Tengakhat OCS", "Jorhat Workshop", "Nazira OCS",
    "Geleki Field", "Rudrasagar Field", "Lakwa Field", "Baghjan Well",
]

ACTIVITIES = [
    "drilling operation", "workover", "crane lifting", "pipeline welding",
    "hot tapping", "scaffolding erection", "tank cleaning", "valve replacement",
    "cable laying", "pump maintenance", "rig floor operation", "cementing job",
    "perforation", "wireline logging", "chemical injection", "BOP testing",
    "gas flaring", "compressor overhaul", "pig launching", "hydrotesting",
]

EQUIPMENT = [
    "crane", "forklift", "welding machine", "grinding machine", "scaffolding",
    "pipe", "valve", "pump", "compressor", "BOP stack", "drill string",
    "lifting sling", "H2S detector", "safety harness", "fire extinguisher",
    "pressure gauge", "gas cylinder", "electrical panel", "generator", "hose",
]

BARRIERS = [
    "barricade", "safety harness", "LOTO lock", "fire watch", "gas detector",
    "safety net", "guardrail", "permit to work", "exclusion zone", "PPE",
    "emergency shutdown", "pressure relief valve", "grounding cable",
    "fire suppression system", "ventilation fan", "buddy system",
]

BARRIER_STATES = ["missing", "not used", "bypassed", "expired", "damaged", "removed"]

# ─── English Near-Miss / UA/UC Templates ──────────────────────────────────────

ENGLISH_NEAR_MISS_TEMPLATES = [
    "During {activity} at {site}, worker observed {equipment} was {state}. No {barrier} was in place. Work stopped immediately and reported to supervisor.",
    "Near miss: {equipment} nearly struck worker during {activity} at {site}. {barrier} was {state}. No injury occurred but potential for serious harm was identified.",
    "Unsafe condition reported at {site}: {barrier} found {state} near {activity} area. {equipment} left unsecured. Corrective action taken on site.",
    "UA observation: Worker performing {activity} without {barrier} at {site}. {equipment} positioned incorrectly. Supervisor intervened before any incident.",
    "While conducting {activity} at {site}, a {equipment} malfunctioned. {barrier} was {state}. Workers evacuated area. No injuries but high potential severity.",
    "Observation: During {activity} near {site}, two workers found under suspended {equipment} without {barrier}. Line of fire violation. Work halted.",
    "UC report: {barrier} found {state} at {site} during routine inspection. {equipment} operating without proper safeguards during {activity}.",
    "During shift handover at {site}, incoming crew noticed {barrier} was {state} near {activity} zone. {equipment} left energized. Immediate lockout performed.",
    "Near miss at {site}: {equipment} dropped from height during {activity}. {barrier} was {state}. Fell into exclusion zone — no personnel present. Potential fatality averted.",
    "Worker reported unsafe act at {site}: colleague bypassed {barrier} during {activity} to save time. {equipment} in use without proper isolation.",
]

# ─── Hinglish Templates ──────────────────────────────────────────────────────

HINGLISH_TEMPLATES = [
    "{site} mein {activity} ke dauran {equipment} ka {barrier} nahi tha. Koi injury nahi hui lekin bahut khatarnak situation thi. Supervisor ko turant bataya.",
    "Aaj {site} pe {activity} ho raha tha, {equipment} ke paas {barrier} {state} mila. Worker ne kaam rok diya aur safety officer ko inform kiya.",
    "Near miss report: {site} mein {equipment} girte girte bacha. {barrier} {state} tha. Bahut serious ho sakta tha. PTW check karna zaroori hai.",
    "UA dekha gaya {site} pe — worker bina {barrier} ke {activity} kar raha tha. {equipment} unsafe position mein tha. Toolbox talk diya gaya.",
    "{site} pe {activity} ke time {equipment} se sparking hui. {barrier} {state} tha. Fire watch nahi tha. Kaam turant band karaya gaya.",
    "Unsafe condition: {site} pe {barrier} {state} paya gaya. {equipment} bina proper support ke use ho raha tha. {activity} area mein bahut risk tha.",
    "{activity} ke dauran {site} mein ek worker ko {equipment} se chot lagte lagte bachi. {barrier} lagaya nahi tha. Bahut close call tha.",
    "Aaj subah {site} pe inspection mein {barrier} {state} mila {activity} area ke pass. {equipment} chalte hue bhi koi safety arrangement nahi tha.",
    "Worker ne report kiya ki {site} pe {activity} mein {barrier} bypass kiya ja raha hai. {equipment} ke saath kaam karte waqt ye bahut risky hai.",
    "{site} mein raat ki shift ke dauran {activity} ke time {equipment} se gas leak hua. {barrier} {state} tha. Emergency evacuation kiya gaya.",
]

# ─── Assamese Templates ──────────────────────────────────────────────────────

ASSAMESE_TEMPLATES = [
    "{site} ত {activity} কৰোঁতে {equipment} ৰ {barrier} নাছিল। কোনো আঘাত হোৱা নাই কিন্তু বহুত বিপদজনক অৱস্থা আছিল।",
    "{site} ত আজি {activity} ৰ সময়ত {equipment} ৰ ওচৰত {barrier} {state} পোৱা গ'ল। কামটো বন্ধ কৰা হ'ল।",
    "Near miss: {site} ত {equipment} প্ৰায় পৰি গৈছিল। {barrier} {state} আছিল। অতি গুৰুতৰ হ'ব পাৰিলেহেঁতেন।",
    "অসুৰক্ষিত কাম: {site} ত শ্ৰমিকে {barrier} নোহোৱাকৈ {activity} কৰি আছিল। {equipment} অসুৰক্ষিত অৱস্থাত আছিল।",
    "{site} ত {activity} ৰ সময়ত {equipment} ৰ পৰা গেছ লিক হ'ল। {barrier} {state} আছিল। জৰুৰীকালীন নিষ্কাশন কৰা হ'ল।",
]

# ─── Rare IOGP Rule Scenario Templates ────────────────────────────────────────

IOGP_RULE_TEMPLATES = {
    "Confined Space": [
        "Worker entered {equipment} tank at {site} for {activity} without gas testing or standby person. {barrier} was {state}. Rescue plan not in place.",
        "During {activity} inside vessel at {site}, oxygen levels dropped below safe limit. {barrier} was {state}. Worker extracted by colleague. Near fatal.",
    ],
    "Energy Isolation": [
        "Maintenance on {equipment} at {site} started before LOTO was applied. {barrier} was {state}. {equipment} unexpectedly energized during {activity}.",
        "Worker found performing {activity} on live {equipment} at {site}. Isolation tag was {state}. Potential electrocution or stored energy release.",
    ],
    "Working at Height": [
        "Worker on scaffolding at {site} during {activity} without {barrier}. Height approximately 8 meters. {equipment} passed up without tag line. Drop zone not barricaded.",
        "Fall from height near miss at {site}: Worker slipped on wet platform during {activity}. {barrier} was {state}. Caught by colleague before falling 6 meters.",
    ],
    "Hot Work": [
        "Welding on {equipment} at {site} during {activity} without valid hot work permit. {barrier} was {state}. Flammable vapors detected in area.",
        "Fire watch absent during {activity} involving {equipment} at {site}. {barrier} was {state}. Sparks fell on oily rags below — extinguished quickly.",
    ],
    "Line of Fire": [
        "During {activity} at {site}, two fitters positioned directly under suspended {equipment}. No {barrier} in exclusion zone. Crane operator unaware of personnel below.",
        "Worker in line of fire during {activity} at {site}. Pressurized {equipment} being serviced without depressurization. {barrier} was {state}.",
    ],
    "Safe Mechanical Lifting": [
        "Crane lifting {equipment} at {site} during {activity}. Sling certification expired. {barrier} was {state}. Load capacity not verified. Rigger not certified.",
        "{equipment} lifted without rigging plan at {site}. {barrier} was {state}. Load swung and nearly struck worker during {activity}.",
    ],
    "Driving": [
        "Vehicle reversing without banksman at {site} during {activity}. {barrier} was {state}. Nearly struck worker standing behind. Speed limit exceeded.",
        "Driver operating vehicle at {site} while using mobile phone. {barrier} {state}. Near collision with {equipment} during {activity}.",
    ],
    "Bypassing Safety Controls": [
        "Safety interlock on {equipment} at {site} deliberately bypassed during {activity} to maintain production. {barrier} was {state}. Management notified.",
        "Worker disabled alarm on {equipment} at {site} during {activity} because it was 'nuisance tripping'. {barrier} was {state}. High SIF potential.",
    ],
    "Work Authorisation": [
        "Work started on {equipment} at {site} without valid PTW during {activity}. {barrier} was {state}. Simultaneous operations conflict not identified.",
        "Expired permit found at {site} for ongoing {activity}. {barrier} was {state}. {equipment} work continued without re-authorization.",
    ],
}


def generate_from_template(template: str) -> str:
    """Fill a template with random values."""
    return template.format(
        site=random.choice(OIL_SITES),
        activity=random.choice(ACTIVITIES),
        equipment=random.choice(EQUIPMENT),
        barrier=random.choice(BARRIERS),
        state=random.choice(BARRIER_STATES),
    )


def generate_all() -> pd.DataFrame:
    """Generate all synthetic reports."""
    rows = []
    report_idx = 0

    # ── English near-miss / UA/UC reports (~50) ───────────────────────────
    for _ in range(50):
        template = random.choice(ENGLISH_NEAR_MISS_TEMPLATES)
        narrative = generate_from_template(template)
        severity = random.choice(["near_miss", "near_miss", "near_miss", "no_injury", "minor"])
        rows.append({
            "report_id": f"syn_{report_idx:04d}",
            "source": "synthetic",
            "date": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "narrative": narrative,
            "severity_raw": "synthetic_near_miss",
            "severity_normalized": severity,
            "industry": "oil_gas",
            "location": random.choice(OIL_SITES),
            "injury_type": "",
            "source_of_injury": "",
            "naics_sic": "211",
            "language": "en",
        })
        report_idx += 1

    # ── Hinglish reports (~50) ────────────────────────────────────────────
    for _ in range(50):
        template = random.choice(HINGLISH_TEMPLATES)
        narrative = generate_from_template(template)
        severity = random.choice(["near_miss", "near_miss", "minor", "serious", "no_injury"])
        rows.append({
            "report_id": f"syn_{report_idx:04d}",
            "source": "synthetic",
            "date": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "narrative": narrative,
            "severity_raw": "synthetic_hinglish",
            "severity_normalized": severity,
            "industry": "oil_gas",
            "location": random.choice(OIL_SITES),
            "injury_type": "",
            "source_of_injury": "",
            "naics_sic": "211",
            "language": "hinglish",
        })
        report_idx += 1

    # ── Assamese reports (~20) ────────────────────────────────────────────
    for _ in range(20):
        template = random.choice(ASSAMESE_TEMPLATES)
        narrative = generate_from_template(template)
        severity = random.choice(["near_miss", "near_miss", "serious", "minor"])
        rows.append({
            "report_id": f"syn_{report_idx:04d}",
            "source": "synthetic",
            "date": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "narrative": narrative,
            "severity_raw": "synthetic_assamese",
            "severity_normalized": severity,
            "industry": "oil_gas",
            "location": random.choice(OIL_SITES),
            "injury_type": "",
            "source_of_injury": "",
            "naics_sic": "211",
            "language": "as",
        })
        report_idx += 1

    # ── IOGP rule-specific scenarios (~30) ────────────────────────────────
    rules = list(IOGP_RULE_TEMPLATES.keys())
    for _ in range(30):
        rule = random.choice(rules)
        template = random.choice(IOGP_RULE_TEMPLATES[rule])
        narrative = generate_from_template(template)
        # IOGP scenarios are typically high-potential
        severity = random.choice(["serious", "serious", "near_miss"])
        rows.append({
            "report_id": f"syn_{report_idx:04d}",
            "source": "synthetic",
            "date": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "narrative": narrative,
            "severity_raw": f"synthetic_iogp_{rule.lower().replace(' ', '_')}",
            "severity_normalized": severity,
            "industry": "oil_gas",
            "location": random.choice(OIL_SITES),
            "injury_type": "",
            "source_of_injury": "",
            "naics_sic": "211",
            "language": "en",
        })
        report_idx += 1

    df = pd.DataFrame(rows, columns=config.UNIFIED_COLUMNS)
    return df


def main():
    print("=" * 60)
    print("Synthetic Report Generation")
    print("=" * 60)

    df = generate_all()
    df.to_csv(config.SYNTHETIC_FILE, index=False)

    print(f"[SYNTHETIC] Saved: {config.SYNTHETIC_FILE}")
    print(f"[SYNTHETIC] Total rows: {len(df):,}")
    print(f"\n[SYNTHETIC] By language:")
    print(df["language"].value_counts().to_string())
    print(f"\n[SYNTHETIC] By severity:")
    print(df["severity_normalized"].value_counts().to_string())
    print(f"\n[SYNTHETIC] Sample narratives:")
    for lang in ["en", "hinglish", "as"]:
        sample = df[df["language"] == lang].iloc[0]["narrative"]
        try:
            print(f"\n  [{lang}]: {sample[:120]}...")
        except UnicodeEncodeError:
            print(f"\n  [{lang}]: (contains non-ASCII characters, {len(sample)} chars total)")

    return df


if __name__ == "__main__":
    main()
