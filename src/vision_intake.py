import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup Gemini Client
if not os.getenv("GEMINI_API_KEY"):
    raise ValueError("GEMINI_API_KEY not found in .env file")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use the requested model
model = genai.GenerativeModel('gemini-3.5-flash')

def transcribe_handwritten_log(image_path: str):
    print(f"Uploading and processing image: {image_path}...")
    
    # Upload the file to Gemini's API
    sample_file = genai.upload_file(path=image_path)
    
    prompt = """
    This is a photo of a handwritten safety logbook from an oil rig. 
    It may contain messy cursive and field slang (Hinglish/Assamese).
    Please transcribe EXACTLY what is written on the page. 
    Do not add any markdown, formatting, or commentary. Just output the raw text you see.
    """
    
    # Generate content using the image and prompt
    response = model.generate_content([sample_file, prompt])
    
    print("\n--- TRANSCRIBED TEXT ---")
    print(response.text)
    print("------------------------")
    
    return response.text

if __name__ == "__main__":
    # Test it out! Just point this to a photo of a handwritten note.
    # Replace this with an actual image path on your computer.
    test_image = r"C:\Users\rithy\OneDrive\Desktop\SIH_2026\sih_2026\data\sample_handwritten_log.jpg"
    
    if os.path.exists(test_image):
        transcribe_handwritten_log(test_image)
    else:
        print(f"Place a sample image at {test_image} to test the Vision intake!")
