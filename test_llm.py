from dotenv import load_dotenv
load_dotenv()

from app.components.llm import load_llm

print("Testing LLM loading...")
try:
    llm = load_llm()
    if llm:
        print("LLM loaded successfully!")
    else:
        print("Failed to load LLM")
except Exception as e:
    print(f"Error loading LLM: {e}")
