from dotenv import load_dotenv
load_dotenv()

from app.components.retriever import create_qa_chain

print("Testing updated QA chain with detailed responses...")
try:
    qa_chain = create_qa_chain()
    if qa_chain:
        print("QA chain created successfully!")
        
        # Test with a sample question
        test_question = "what is diabetes"
        print(f"\nTesting question: {test_question}")
        response = qa_chain.invoke({"query": test_question})
        result = response.get("result", "No response")
        print(f"\nDetailed Response:\n{result}")
        print(f"\nResponse length: {len(result)} characters")
        
    else:
        print("Failed to create QA chain")
except Exception as e:
    print(f"Error testing QA chain: {e}")
