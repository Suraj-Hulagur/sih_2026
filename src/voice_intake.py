import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY not found in .env file")

# Setup Groq Client for Audio
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

def transcribe_audio_report(audio_path: str):
    print(f"Transcribing audio file: {audio_path}...")
    
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3",
            prompt="The following is a safety report from an Indian Oil and Gas worker. It may contain Hinglish and oilfield jargon like LOTO, scaffold, derrick, or kick.",
            response_format="json",
            temperature=0.0
        )
        
    print("\n--- TRANSCRIBED AUDIO TEXT ---")
    print(transcription.text)
    print("------------------------------")
    return transcription.text

if __name__ == "__main__":
    # Test it out! Just point this to an mp3 or wav file.
    test_audio = r"C:\Users\rithy\OneDrive\Desktop\SIH_2026\sih_2026\data\sample_voice_report.mp3"
    
    if os.path.exists(test_audio):
        transcribe_audio_report(test_audio)
    else:
        print(f"Place a sample audio file at {test_audio} to test the Voice intake!")
