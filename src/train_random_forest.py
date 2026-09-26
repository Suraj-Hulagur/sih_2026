import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import shap
import matplotlib.pyplot as plt
import os

# Use config for all paths
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "data_pipeline"))
from data_pipeline.config import CLASSIFIED_REPORTS_FILE, SHAP_PLOT_FILE

def train_and_explain():
    input_file = CLASSIFIED_REPORTS_FILE
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return
        
    # 1. Load the weakly labeled data from Method 1
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    df = pd.DataFrame(data)
    
    # 2. Feature Engineering (Convert text categories to ML-readable numbers)
    # We select the physics/safety fields extracted by the LLM
    features = ['energy_type', 'energy_magnitude', 'barrier_state', 'iogp_rule']
    X_raw = df[features]
    
    # Target variable (SIF Potential)
    y = df['sif_potential'].astype(int)
    
    # One-Hot Encoding: Converts "energy_type=gravity" into a binary column
    X = pd.get_dummies(X_raw, drop_first=False)
    
    # 3. Train the Random Forest
    print("Training Random Forest Classifier on Weak Labels...")
    # Even though we only have 50 rows, this proves the pipeline works
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=5)
    rf_model.fit(X_train, y_train)
    
    y_pred = rf_model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy (on weak labels): {acc * 100:.2f}%\n")
    
    # 4. Explainability with SHAP (Crucial for avoiding the "Black Box" problem)
    print("Calculating SHAP Explainability Values...")
    explainer = shap.TreeExplainer(rf_model)
    shap_values = explainer.shap_values(X_test)
    
    # Extract the SHAP values for the positive class (SIF = True)
    # Depending on SHAP version, shap_values can be a list or an array
    if isinstance(shap_values, list):
        shap_values_sif = shap_values[1] 
    else:
        # For newer SHAP versions (shap>=0.45)
        shap_values_sif = shap_values[:, :, 1] if len(shap_values.shape) > 2 else shap_values

    # Generate a Summary Plot to show what features drive the SIF decision
    plt.style.use('seaborn-v0_8-whitegrid')
    plt.figure(figsize=(10, 6))
    
    shap.summary_plot(shap_values_sif, X_test, plot_type="bar", show=False, color='#0F4C81')
    
    plt.title("SHAP Explanation: What drives a 'Serious Injury (SIF)' Prediction?", fontsize=14, fontweight='bold', pad=15)
    plt.grid(True, axis='x', linestyle='--', alpha=0.7, color='#B0B0B0')
    plt.gca().set_axisbelow(True)
    plt.tight_layout()
    
    plt.savefig(SHAP_PLOT_FILE)
    print(f"SHAP Explainability chart saved to: {SHAP_PLOT_FILE}")
    
    # Pick a single report to explain specifically
    print("\n--- SHAP EXPLANATION FOR A SINGLE REPORT ---")
    instance_index = 0
    report_features = X_test.iloc[instance_index]
    actual_pred = rf_model.predict([report_features])[0]
    
    print(f"Model Predicted SIF: {bool(actual_pred)}")
    print("Top factors driving this specific decision:")
    
    instance_shap = shap_values_sif[instance_index]
    feature_impacts = list(zip(X.columns, instance_shap))
    feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
    
    for feature, impact in feature_impacts[:3]:
        direction = "INCREASED" if impact > 0 else "DECREASED"
        if report_features[feature] == 1:
            print(f"- {feature}: {direction} risk score by {abs(impact):.3f}")

if __name__ == "__main__":
    train_and_explain()
