# import os
# HF_TOKEN = os.environ.get("HF_TOKEN")

# # HUGGINGFACE_REPO_ID="mistralai/Mistral-7B-Instruct-v0.3"
# HUGGINGFACE_REPO_ID="mistralai/Magistral-Small-2507"
# DB_FAISS_PATH="vectorstore/db_faiss"
# DATA_PATH="data/"
# CHUNK_SIZE=500
# CHUNK_OVERLAP=50


import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.environ.get("HF_TOKEN")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
XAI_API_KEY = os.environ.get("XAI_API_KEY")
GROQ_MODEL_NAME = os.environ.get("GROQ_MODEL_NAME", "openai/gpt-oss-20b")

HUGGINGFACE_REPO_ID="mistralai/Mistral-7B-Instruct-v0.3"
DB_FAISS_PATH="vectorstore/db_faiss"
DATA_PATH="data/"
CHUNK_SIZE=500
CHUNK_OVERLAP=50