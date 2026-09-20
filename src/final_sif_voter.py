import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_predict
import os

# Use config for all paths
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "data_pipeline"))
from data_pipeline.config import CLASSIFIED_REPORTS_FILE, HINGLISH_FILE, FINAL_TRIAGED_FILE

def run_disagreement_engine():
    input_file = CLASSIFIED_REPORTS_FILE
    csv_file = HINGLISH_FILE
    output_file = FINAL_TRIAGED_FILE
    
    if not os.path.exists(input_file):
        print("Data not found. Run rule engine first.")
        return

    # Load data
    with open(input_file, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
        
    df_features = pd.DataFrame(json_data)
    df_text = pd.read_csv(csv_file)[['report_id', 'narrative']]
    df = pd.merge(df_features, df_text, on='report_id')
    
    # METHOD 1: Deterministic Rule Engine (already ran, stored in 'sif_potential')
    m1_predictions = df['sif_potential'].astype(int)
    
    # METHOD 2: Random Forest — using cross_val_predict to avoid data leakage
    features = ['energy_type', 'energy_magnitude', 'barrier_state', 'iogp_rule']
    X_rf = pd.get_dummies(df[features])
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    # cross_val_predict: each row's prediction comes from a fold that DIDN'T train on it
    n_folds = min(5, len(df))  # Handle small datasets
    m2_predictions = cross_val_predict(rf, X_rf, m1_predictions, cv=n_folds)
    
    # METHOD 3: Raw Text Classifier — also using cross_val_predict
    vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
    X_text = vectorizer.fit_transform(df['narrative'])
    lr = LogisticRegression(class_weight='balanced', random_state=42, max_iter=1000)
    m3_predictions = cross_val_predict(lr, X_text, m1_predictions, cv=n_folds)
    
    # The Voting Engine
    final_results = []
    needs_review_count = 0
    
    for i in range(len(df)):
        v1 = bool(m1_predictions.iloc[i])
        v2 = bool(m2_predictions[i])
        v3 = bool(m3_predictions[i])
        
        # If all 3 methods agree completely
        if v1 == v2 == v3:
            final_status = "SIF_CONFIRMED" if v1 else "SAFE"
            needs_review = False
        else:
            # If there is ANY disagreement between the 3 models
            final_status = "NEEDS_HUMAN_REVIEW"
            needs_review = True
            needs_review_count += 1
            
        final_results.append({
            "report_id": df['report_id'].iloc[i],
            "narrative": df['narrative'].iloc[i],
            "m1_rule_engine": v1,
            "m2_random_forest": v2,
            "m3_raw_text": v3,
            "final_status": final_status,
            "needs_review": needs_review
        })
        
    final_df = pd.DataFrame(final_results)
    final_df.to_csv(output_file, index=False)
    
    print("Disagreement Engine (Voting System) Complete!")
    print(f"Total Reports: {len(df)}")
    print(f"Reports needing Human Review due to AI disagreement: {needs_review_count}")
    print(f"Saved to: {output_file}")

if __name__ == "__main__":
    run_disagreement_engine()
