"""
Local LLM & Embedding Client

Provides a unified interface for:
1. LLM text extraction (via Ollama locally or Groq API)
2. Sentence embeddings (via sentence-transformers locally)

The embedding model 'paraphrase-multilingual-MiniLM-L12-v2' (~420MB) understands
50+ languages including Hindi, Assamese, and English — critical for Hinglish reports.
It runs entirely on CPU and fits comfortably in 16GB RAM alongside Ollama.
"""
import os
import json
import numpy as np
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# ─── Extraction prompt ───────────────────────────────────────────────────────
# Lives here rather than in extract_pipeline.py so that any script can import it
# without triggering that module's client setup at import time.
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

# ─── LLM Client Setup ────────────────────────────────────────────────────────
LLM_BACKEND = os.getenv("LLM_BACKEND", "ollama").lower()

def get_llm_client():
    """Returns an OpenAI-compatible client pointing to the configured backend."""
    if LLM_BACKEND == "groq":
        if not os.getenv("GROQ_API_KEY"):
            raise ValueError("GROQ_API_KEY not found in .env file")
        return OpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1"
        ), os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    else:
        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/v1")
        return OpenAI(
            api_key="ollama",
            base_url=ollama_url
        ), os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")


def extract_features(narrative: str, client=None, model: str = None) -> dict:
    """
    Run the SCL extraction prompt over one report and return the parsed JSON.

    Pass an existing (client, model) pair to avoid rebuilding the client per call.
    Raises on malformed JSON so callers can decide whether to skip or fail.
    """
    if client is None or model is None:
        client, model = get_llm_client()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Extract the structured data from this report:\n\n{narrative}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.0,
    )
    return json.loads(response.choices[0].message.content)


# ─── Embedding Model ─────────────────────────────────────────────────────────
# Lazy-loaded: only downloads/loads when first needed
_embedding_model = None
EMBEDDING_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

def get_embedding_model():
    """
    Returns the sentence-transformers embedding model.
    Downloads on first use (~420MB), then cached locally.
    
    This model understands:
    - English, Hindi, Assamese, Bengali, and 46 other languages
    - Code-mixed text (Hinglish) 
    - Produces 384-dimensional embeddings
    """
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print(f"Loading multilingual embedding model: {EMBEDDING_MODEL_NAME}...")
            _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            print("Embedding model loaded successfully!")
        except ImportError:
            print("ERROR: sentence-transformers not installed. Run: pip install sentence-transformers")
            raise
    return _embedding_model


def embed_texts(texts: list[str]) -> np.ndarray:
    """
    Convert a list of text strings to numerical vectors (embeddings).
    
    Returns: numpy array of shape (len(texts), 384)
    
    Example:
        embeddings = embed_texts(["scaffolding par bina belt ke kaam", "worker fell from height"])
        # embeddings.shape = (2, 384)
        # These vectors capture meaning, so similar reports will have similar vectors
    """
    model = get_embedding_model()
    return model.encode(texts, show_progress_bar=len(texts) > 10, normalize_embeddings=True)


def compute_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """Cosine similarity between two normalized embeddings (already unit-length)."""
    return float(np.dot(embedding1, embedding2))


# ─── Quick test ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Test 1: Embedding model
    print("=== Testing Embedding Model ===")
    test_sentences = [
        "scaffolding par kaam kar raha tha bina safety belt ke",  # Hinglish
        "worker was working on scaffolding without safety belt",   # English equivalent
        "forklift driver phone pe baat kar raha tha",              # Unrelated Hinglish
    ]
    
    embeddings = embed_texts(test_sentences)
    print(f"Embedding shape: {embeddings.shape}")
    
    # Show that semantically similar sentences have high similarity
    sim_same = compute_similarity(embeddings[0], embeddings[1])
    sim_diff = compute_similarity(embeddings[0], embeddings[2])
    print(f"Hinglish vs English (same meaning): {sim_same:.3f}")
    print(f"Hinglish vs Unrelated:              {sim_diff:.3f}")
    print(f"(Higher = more similar. Same-meaning pair should score much higher)")
    
    # Test 2: LLM client
    print("\n=== Testing LLM Client ===")
    client, model = get_llm_client()
    print(f"Backend: {LLM_BACKEND}")
    print(f"Model: {model}")
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Say 'hello' in one word."}],
            temperature=0.0,
            max_tokens=10
        )
        print(f"LLM response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"LLM connection failed: {e}")
        print("Make sure Ollama is running: ollama serve")
