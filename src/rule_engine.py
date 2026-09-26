import json
import os

# Use config for all paths
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "data_pipeline"))
from data_pipeline.config import EXTRACTED_FEATURES_FILE, CLASSIFIED_REPORTS_FILE, IOGP_RULES

def determine_sif(report):
    """
    Method 1: Deterministic Rule Engine for SIF Potential.
    Rule: if energy_magnitude is high AND barrier_state is missing/degraded/bypassed, then SIF = true.
    """
    energy_mag = str(report.get("energy_magnitude", "")).lower().strip()
    barrier = str(report.get("barrier_state", "")).lower().strip()
    
    # We treat 'unknown' energy magnitude as a potential high risk to be safe (fail-safe logic)
    high_energy = energy_mag in ["high", "unknown"]
    failed_barrier = barrier in ["missing", "degraded", "bypassed"]
    
    return high_energy and failed_barrier

def tag_iogp_rule(report):
    """
    Maps the extracted structured data to one or more of the 9 standard IOGP Life-Saving Rules
    using a deterministic keyword/category lookup.
    
    The 9 IOGP Rules:
    1. Bypassing Safety Controls
    2. Confined Space
    3. Driving
    4. Energy Isolation
    5. Hot Work
    6. Line of Fire
    7. Safe Mechanical Lifting
    8. Work Authorisation
    9. Working at Height
    """
    energy_type = str(report.get("energy_type", "")).lower()
    activity = str(report.get("activity", "")).lower()
    expected_barrier = str(report.get("barrier_expected", "")).lower()
    barrier_state = str(report.get("barrier_state", "")).lower()
    
    # Combine text for easy keyword searching
    combined_context = f"{energy_type} {activity} {expected_barrier}"
    
    tags = []
    
    # 1. Bypassing Safety Controls — barrier deliberately defeated or bypassed
    if barrier_state == "bypassed" or "bypass" in combined_context or "override" in combined_context or "defeat" in combined_context:
        tags.append("Bypassing Safety Controls")
    
    # 2. Confined Space — only when actual entry is involved, not just mentioning a tank
    if "confined space" in combined_context or ("tank" in combined_context and any(kw in combined_context for kw in ["entry", "inside", "enter", "entered", "gas test"])):
        tags.append("Confined Space")
    
    # 3. Driving
    if "drive" in combined_context or "truck" in combined_context or "forklift" in combined_context or "vehicle" in combined_context:
        tags.append("Driving")
    
    # 4. Energy Isolation
    if "loto" in combined_context or "lock out" in combined_context or "lockout" in combined_context or "isolation" in combined_context or (energy_type == "electrical" and "repair" in combined_context):
        tags.append("Energy Isolation")
    
    # 5. Hot Work
    if "weld" in combined_context or "grind" in combined_context or "hot work" in combined_context or energy_type == "thermal":
        tags.append("Hot Work")
    
    # 6. Line of Fire
    if "exclusion zone" in combined_context or "barricade" in combined_context or "line of fire" in combined_context or energy_type in ["kinetic", "pressure"]:
        tags.append("Line of Fire")
    
    # 7. Safe Mechanical Lifting
    if "crane" in combined_context or "lift" in combined_context or "sling" in combined_context or "hoist" in combined_context or "rigging" in combined_context:
        tags.append("Safe Mechanical Lifting")
    
    # 8. Work Authorisation
    if "permit" in combined_context or "ptw" in combined_context or "work authoris" in combined_context:
        tags.append("Work Authorisation")
    
    # 9. Working at Height
    if "height" in combined_context or "scaffold" in combined_context or "fall" in combined_context or energy_type == "gravity":
        tags.append("Working at Height")
    
    # If nothing matched, be honest about it
    if not tags:
        tags.append("No specific LSR match")
    
    return tags

def run_rule_engine():
    input_file = EXTRACTED_FEATURES_FILE
    output_file = CLASSIFIED_REPORTS_FILE

    if not os.path.exists(input_file):
        print(f"Error: Could not find {input_file}. Make sure Step 2 completed successfully.")
        return
        
    with open(input_file, 'r', encoding='utf-8') as f:
        reports = json.load(f)
        
    sif_count = 0
    
    for report in reports:
        # 1. Apply SIF Logic
        is_sif = determine_sif(report)
        report["sif_potential"] = is_sif
        
        if is_sif:
            sif_count += 1
            
        # 2. Apply IOGP Tagging (now returns a list for multi-label)
        iogp_tags = tag_iogp_rule(report)
        report["iogp_rules"] = iogp_tags
        report["iogp_rule"] = iogp_tags[0]  # Keep primary tag for backward compatibility
        
        # 3. Method 1 acts as our "Weak Label" generator for training Method 2 later
        report["label_source"] = "Method_1_Deterministic"

    # Save the fully classified data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(reports, f, indent=2)
        
    print(f"Rule Engine Complete!")
    print(f"Processed {len(reports)} reports.")
    print(f"Identified {sif_count} Critical SIF Precursors out of {len(reports)} ({sif_count/len(reports)*100:.1f}%)")
    print(f"Data saved to: {output_file}")
    
    # Print a quick preview of the first flagged report
    for report in reports:
        if report["sif_potential"]:
            print("\n--- PREVIEW OF FLAGGED REPORT ---")
            print(f"ID: {report['report_id']}")
            print(f"IOGP Rules: {report['iogp_rules']}")
            print(f"SIF Potential: {report['sif_potential']}")
            print(f"Energy: {report['energy_type']} ({report['energy_magnitude']})")
            print(f"Barrier Status: {report['barrier_state']}")
            break

if __name__ == "__main__":
    run_rule_engine()
