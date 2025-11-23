from langchain.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate

from app.components.llm import load_llm
from app.components.vector_store import load_vector_store

from app.config.config import HUGGINGFACE_REPO_ID,HF_TOKEN
from app.common.logger import get_logger
from app.common.custom_exception import CustomException


logger = get_logger(__name__)

CUSTOM_PROMPT_TEMPLATE = """You are a knowledgeable medical assistant similar to ChatGPT, designed to provide helpful and accurate medical information. Answer the following medical question in detail using the information provided in the context.

Please provide a comprehensive response that includes:

1. A clear definition or explanation of the medical condition/topic
2. Key symptoms, causes, or characteristics (if applicable) 
3. Treatment options or management approaches (if available in the context)
4. Any important additional information that would be helpful

Format your response in a clear, conversational manner similar to ChatGPT:
- Use natural paragraphs and sentences
- Do NOT use HTML tags like <br> or any other HTML formatting
- Use plain text with natural line breaks and spacing
- Make the response easy to read and understand
- Be informative yet approachable

Use only the information provided in the context below.

Context:
{context}

Question: {question}

Answer:"""

def set_custom_prompt():
    return PromptTemplate(template=CUSTOM_PROMPT_TEMPLATE,input_variables=["context" , "question"])

def create_qa_chain():
    try:
        logger.info("Loading vector store for context")
        db = load_vector_store()

        if db is None:
            raise CustomException("Vector store not present or empty")

        llm = load_llm()

        if llm is None:
            raise CustomException("LLM not loaded")

        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=db.as_retriever(search_kwargs={'k': 3}),
            return_source_documents=False,
            chain_type_kwargs={'prompt': set_custom_prompt()}
        )

        logger.info("Successfully created the QA chain")
        return qa_chain
 
    except Exception as e:
        error_message = CustomException("Failed to make a QA chain", e)
        logger.error(str(error_message))
        # 🚨 Explicitly return None on failure
        return None