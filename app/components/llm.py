# from langchain_huggingface import HuggingFaceEndpoint
# from app.config.config import HF_TOKEN, HUGGINGFACE_REPO_ID

# from app.common.logger import get_logger
# from app.common.custom_exception import CustomException

# logger = get_logger(__name__)

# def load_llm(huggingface_repo_id: str = HUGGINGFACE_REPO_ID, hf_token: str = HF_TOKEN):
#     try:
#         logger.info("Loading LLM from Hugging Face Hub...")
#         llm = HuggingFaceEndpoint(
#             repo_id=huggingface_repo_id,
#             temperature=0.3,
#             max_new_tokens=256,
#             return_full_text=False,
#             huggingfacehub_api_token=hf_token,
#         )
        
#         logger.info("LLM loaded successfully")
#         return llm
#     except Exception as e:
#         error_message = CustomException("Failed to load LLM", e)
#         logger.error(str(error_message))

from langchain_groq import ChatGroq
from app.config.config import GROQ_API_KEY
from app.common.logger import get_logger
from app.common.custom_exception import CustomException

logger = get_logger(__name__)

def load_llm(model_name: str = "llama-3.1-8b-instant", groq_api_key: str = GROQ_API_KEY):
    try:
        logger.info("Loading LLM from Groq using LLaMA3 model...")

        llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name=model_name,
            temperature=0.3,
            max_tokens=512,
        )

        logger.info("LLM loaded successfully from Groq.")
        return llm

    except Exception as e:
        error_message = CustomException("Failed to load an LLM from Groq", e)
        logger.error(str(error_message))
        return None