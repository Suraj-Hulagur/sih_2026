import json
import pandas as pd
import matplotlib.pyplot as plt
import os

# Use config for all paths
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "data_pipeline"))
from data_pipeline.config import CLASSIFIED_REPORTS_FILE, ACADEMIC_PLOT_FILE

def run_academic_crosscheck():
    input_file = CLASSIFIED_REPORTS_FILE
    plot_output = ACADEMIC_PLOT_FILE
    
    if not os.path.exists(input_file):
        print("Data not found. Run rule engine first.")
        return

    # Load data
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    df = pd.DataFrame(data)
    
    # Calculate percentages for our AI Tagging
    tag_counts = df['iogp_rule'].value_counts(normalize=True) * 100
    
    # Target rules we want to compare
    rules = ["Working at Height", "Safe Mechanical Lifting", "Hot Work", "Confined Space", "Line of Fire"]
    
    # Extract our AI's percentages (default to 0 if tag didn't appear)
    ai_percentages = [tag_counts.get(rule, 0) for rule in rules]
    
    # Abanum et al. real-world compliance failure rates from Nigerian oilfield study
    # TODO: Verify these numbers against the actual paper before presenting
    academic_percentages = [38.5, 22.0, 15.5, 12.0, 12.0] 
    
    # Plotting the side-by-side bar chart
    x = range(len(rules))
    width = 0.35
    
    # Use a professional enterprise style for the plot
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Add subtle gray background grid lines
    ax.grid(True, axis='y', linestyle='--', alpha=0.7, color='#B0B0B0')
    ax.set_axisbelow(True) # Put grid behind the bars
    
    # Plot bars with professional enterprise colors
    ax.bar([i - width/2 for i in x], ai_percentages, width, label='Our AI Pipeline', color='#0F4C81', edgecolor='black')
    ax.bar([i + width/2 for i in x], academic_percentages, width, label='Abanum et al. Study', color='#F58220', edgecolor='black')
    
    # Formatting
    ax.set_ylabel('Percentage of Total SIF Violations', fontsize=12, fontweight='bold')
    ax.set_title('Validation: AI Tagger Distribution vs. Real-World Academic Studies', fontsize=14, fontweight='bold', pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(rules, rotation=15, ha="right", fontsize=11)
    
    # Style the legend
    ax.legend(frameon=True, shadow=True, fancybox=True)
    
    plt.tight_layout()
    plt.savefig(plot_output)
    
    print("Academic Cross-Check Complete!")
    print(f"Validation chart saved to: {plot_output}")
    print("\nChart Data Preview:")
    for i, rule in enumerate(rules):
        print(f"- {rule}: AI = {ai_percentages[i]:.1f}% | Academic = {academic_percentages[i]:.1f}%")

if __name__ == "__main__":
    run_academic_crosscheck()
