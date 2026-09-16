import json
import os

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
    Maps the extracted structured data to one of the 9 standard IOGP Life-Saving Rules
    using a deterministic keyword/category lookup.
    """
    energy_type = str(report.get("energy_type", "")).lower()
    activity = str(report.get("activity", "")).lower()
    expected_barrier = str(report.get("barrier_expected", "")).lower()
    
    # Combine text for easy keyword searching
    combined_context = f"{energy_type} {activity} {expected_barrier}"
    
    if "height" in combined_context or "scaffold" in combined_context or "fall" in combined_context or energy_type == "gravity":
        return "Working at Height"
    
    elif "weld" in combined_context or "grind" in combined_context or "hot work" in combined_context or energy_type == "thermal":
        return "Hot Work"
    
    elif "confined space" in combined_context or "tank" in combined_context or "vessel" in combined_context:
        return "Confined Space"
    
    elif "crane" in combined_context or "lift" in combined_context or "sling" in combined_context or "hoist" in combined_context:
        return "Safe Mechanical Lifting"
    
    elif "drive" in combined_context or "truck" in combined_context or "forklift" in combined_context or "vehicle" in combined_context:
        return "Safe Driving"
    
    elif "loto" in combined_context or "lock out" in combined_context or "electrical" in combined_context or "isolation" in combined_context:
        return "Energy Isolation"
    
    elif "exclusion zone" in combined_context or "barricade" in combined_context or "line of fire" in combined_context or energy_type in ["kinetic", "pressure"]:
        return "Line of Fire"
        
    elif "permit" in combined_context or "ptw" in combined_context:
        return "Work Authorization"
        
    return "System Defect / General Safety" # Fallback if no specific high-risk rule applies

def run_rule_engine():
    input_file = r"C:\Users\rithy\OneDrive\Desktop\SIH_2026\sih_2026\data\processed\extracted_features.json"
    output_file = r"C:\Users\rithy\OneDrive\Desktop\SIH_2026\sih_2026\data\processed\classified_reports.json"
    
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
            
        # 2. Apply IOGP Tagging
        iogp_tag = tag_iogp_rule(report)
        report["iogp_rule"] = iogp_tag
        
        # 3. Method 1 acts as our "Weak Label" generator for training Method 2 later
        report["label_source"] = "Method_1_Deterministic"

    # Save the fully classified data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(reports, f, indent=2)
        
    print(f"Rule Engine Complete!")
    print(f"Processed {len(reports)} reports.")
    print(f"Identified {sif_count} Critical SIF Precursors.")
    print(f"Data saved to: {output_file}")
    
    # Print a quick preview of the first flagged report
    for report in reports:
        if report["sif_potential"]:
            print("\n--- PREVIEW OF FLAGED REPORT ---")
            print(f"ID: {report['report_id']}")
            print(f"IOGP Rule: {report['iogp_rule']}")
            print(f"SIF Potential: {report['sif_potential']}")
            print(f"Energy: {report['energy_type']} ({report['energy_magnitude']})")
            print(f"Barrier Status: {report['barrier_state']}")
            break

if __name__ == "__main__":
    run_rule_engine()
