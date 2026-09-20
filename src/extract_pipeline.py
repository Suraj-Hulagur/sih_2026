import os
import json
import time
import pandas as pd

# Use config for all paths
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "data_pipeline"))
from data_pipeline.config import HINGLISH_FILE, EXTRACTED_FEATURES_FILE

# The client, the extraction prompt and the per-report call all live in llm_client
# so that this pipeline and src/oisd_experiment.py cannot drift apart.
from llm_client import LLM_BACKEND, get_llm_client, extract_features


def run_pipeline():
    input_file = HINGLISH_FILE
    output_file = EXTRACTED_FEATURES_FILE

    client, model_name = get_llm_client()
    print(f"Backend: {LLM_BACKEND} | model: {model_name}")

    print(f"Reading dataset from {input_file}...")
    df = pd.read_csv(input_file)

    results = []

    for index, row in df.iterrows():
        print(f"[{index+1}/{len(df)}] Processing: {row['report_id']}")

        try:
            extracted_data = extract_features(row['narrative'], client, model_name)

            final_record = {"report_id": row['report_id']}
            final_record.update(extracted_data)
            results.append(final_record)

            # Small delay to prevent rate limits (only needed for external APIs)
            if LLM_BACKEND == "groq":
                time.sleep(1)

        except Exception as e:
            print(f"Error processing {row['report_id']}: {e}")

    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    print(f"\nSuccessfully processed {len(results)} reports and saved to {output_file}")

if __name__ == "__main__":
    run_pipeline()
