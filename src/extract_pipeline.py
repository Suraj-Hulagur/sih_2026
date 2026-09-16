import os
import json
import time
import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Setup Groq Client
if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY not found in .env file")

print("Using Groq API...")
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

# You can change this to any model you prefer (e.g. openai/gpt-oss-120b if using a router)
MODEL_NAME = "openai/gpt-oss-120b" 

SYSTEM_PROMPT = """
You are an expert HSE (Health, Safety, and Environment) inspector for an Indian Oil & Gas company.
Your job is to read raw, unstructured safety reports (which may contain Hinglish or Assamese slang) 
and extract specific structured fields for a deterministic rule engine.

Return ONLY a valid JSON object matching this schema exactly.

Schema:
{
  "energy_type": "gravity | electrical | pressure | kinetic | thermal | chemical | none",
  "energy_magnitude": "high | low | unknown",
  "barrier_expected": "String describing the safety control that should have been there",
  "barrier_state": "working | missing | degraded | bypassed | unknown",
  "activity": "String describing the work being done",
  "location": "String describing where it happened",
  "evidence_phrases": ["list", "of", "exact", "phrases", "from", "text"]
}

--- FEW SHOT EXAMPLES ---
Input: "scaffolding par kaam kar raha tha bina safety belt ke. height almost 10 meter tha, fall arrestor nahi lagaya."
Output: {
  "energy_type": "gravity",
  "energy_magnitude": "high",
  "barrier_expected": "safety belt / fall arrestor",
  "barrier_state": "missing",
  "activity": "working on scaffolding",
  "location": "scaffolding (10 meter height)",
  "evidence_phrases": ["bina safety belt ke", "fall arrestor nahi lagaya"]
}

Input: "crane lifting ke time exclusion zone me log khade the. rigger ne barricade cross kiya."
Output: {
  "energy_type": "kinetic",
  "energy_magnitude": "high",
  "barrier_expected": "barricade / exclusion zone",
  "barrier_state": "bypassed",
  "activity": "crane lifting",
  "location": "exclusion zone",
  "evidence_phrases": ["rigger ne barricade cross kiya"]
}
--------------------------
"""

def extract_features(narrative: str):
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Extract the structured data from this report:\n\n{narrative}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.0
    )
    return response.choices[0].message.content

def run_pipeline():
    input_file = r"C:\Users\rithy\OneDrive\Desktop\SIH_2026\sih_2026\data\processed\hinglish_synthetic.csv"
    output_file = r"C:\Users\rithy\OneDrive\Desktop\SIH_2026\sih_2026\data\processed\extracted_features.json"
    
    print(f"Reading full dataset from {input_file}...")
    df = pd.read_csv(input_file)
    
    results = []
    
    # Process the entire dataframe (no .head() limit)
    for index, row in df.iterrows():
        print(f"[{index+1}/{len(df)}] Processing: {row['report_id']}")
        
        try:
            json_str = extract_features(row['narrative'])
            extracted_data = json.loads(json_str)
            
            final_record = {"report_id": row['report_id']}
            final_record.update(extracted_data)
            results.append(final_record)
            
            # Small delay to prevent hitting Groq rate limits on large files
            time.sleep(1)
            
        except Exception as e:
            print(f"Error processing {row['report_id']}: {e}")

    # Save to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nSuccessfully processed {len(results)} reports and saved to {output_file}")

if __name__ == "__main__":
    run_pipeline()
