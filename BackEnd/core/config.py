import os
from dotenv import load_dotenv

load_dotenv()

HF_KEY = os.getenv("HF_KEY")
HF_MODEL = os.getenv("HF_MODEL", "HuggingFaceH4/zephyr-7b-beta")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_KEY") or os.getenv("GEMINI_API_KEY")