# 🩺 RAG AI Medical Assistant Chatbot

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)
![LangChain](https://img.shields.io/badge/LangChain-Latest-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

**An intelligent medical assistant powered by RAG (Retrieval-Augmented Generation) technology**

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## 📋 Overview

The **RAG AI Medical Assistant Chatbot** is a sophisticated healthcare companion that leverages advanced natural language processing and retrieval-augmented generation to provide accurate, context-aware medical information. Built with LangChain, FAISS vector store, and powered by Groq's LLaMA 3.1 model, this chatbot delivers reliable medical insights in a beautiful, interactive interface.

### 🎯 Key Highlights

- **🔍 Intelligent Retrieval**: Uses FAISS vector database for fast and accurate medical information retrieval
- **🤖 Advanced AI**: Powered by Groq's LLaMA 3.1-8B-Instant model for high-quality responses
- **📚 Knowledge Base**: Built on the comprehensive GALE Encyclopedia of Medicine
- **💬 ChatGPT-like Interface**: Modern, responsive UI with gradient animations and smooth interactions
- **🔒 Secure & Private**: Runs locally with secure API key management
- **📱 Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices

---

## ✨ Features

### Core Functionality
- ✅ **Medical Question Answering**: Get detailed, accurate answers to medical questions
- ✅ **Context-Aware Responses**: Retrieves relevant information from medical encyclopedia
- ✅ **Conversational Memory**: Maintains chat history within sessions
- ✅ **Natural Language Processing**: Understands complex medical queries
- ✅ **Markdown Formatting**: Properly formatted responses with bold text and structured content

### User Interface
- 🎨 **Beautiful Gradient Design**: Animated background with glassmorphism effects
- 💫 **Interactive Elements**: Hover effects, animations, and smooth transitions
- 🎭 **Avatar System**: Distinct user and assistant avatars
- 📝 **Example Prompts**: Quick-start templates for common medical queries
- 🧹 **Session Management**: Easy chat clearing and new conversation start

### Technical Features
- ⚡ **Fast Response Times**: Optimized vector search with k=3 retrieval
- 🔄 **Automatic Text Chunking**: Intelligent document processing with 500-token chunks
- 🎯 **Custom Prompt Engineering**: Tailored prompts for medical context
- 📊 **Comprehensive Logging**: Detailed logs for debugging and monitoring
- 🛡️ **Error Handling**: Robust exception management with custom error classes

---

## 🎬 Demo

### 🎥 Video Demonstration
Watch the RAG AI Medical Assistant Chatbot in action - showcasing the interactive UI, real-time medical Q&A, and smooth user experience.

[**▶️ Watch Full Demo Video**](screenshots/demo-video.mp4)

### Welcome Screen - Empty Chat Interface
The chatbot features a beautiful gradient background with an intuitive welcome screen and example prompts to get started.

![Welcome Screen](screenshots/Screenshot%202025-11-23%20154129.png)

### Active Chat Interface
Real-time medical question answering with properly formatted responses, including bold headings and structured medical information.

![Chat Interface](screenshots/Screenshot%202025-11-23%20154324.png)

---

## 🏗️ Architecture

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   Flask Web Application     │
│  (application.py)           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   QA Chain (retriever.py)   │
│  - Custom Prompt Template   │
│  - RetrievalQA Chain        │
└────┬──────────────────┬─────┘
     │                  │
     ▼                  ▼
┌─────────────┐  ┌──────────────┐
│ Vector Store│  │   LLM Model  │
│   (FAISS)   │  │ (Groq LLaMA) │
│             │  │              │
│ • Embeddings│  │ • Temperature│
│ • Retrieval │  │ • Max Tokens │
└─────────────┘  └──────────────┘
```

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Backend Framework** | Flask 3.0.0 |
| **LLM Provider** | Groq (LLaMA 3.1-8B-Instant) |
| **Vector Database** | FAISS |
| **Embeddings** | HuggingFace (all-MiniLM-L6-v2) |
| **LLM Framework** | LangChain |
| **Frontend** | HTML5, CSS3, JavaScript |
| **Icons** | Font Awesome 6.4.0 |
| **Fonts** | Google Fonts (Inter) |

---

## 🚀 Installation

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- Git
- Groq API Key ([Get it here](https://console.groq.com))
- HuggingFace Token (optional, [Get it here](https://huggingface.co/settings/tokens))

### Step 1: Clone the Repository

```bash
git clone https://github.com/SajjadKhanYousafzai/RAG-AI-Medical-Assistant-Chatbot.git
cd RAG-AI-Medical-Assistant-Chatbot
```

### Step 2: Create Virtual Environment

```bash
# Windows
python -m venv my_env
my_env\Scripts\activate

# Linux/Mac
python3 -m venv my_env
source my_env/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Set Up Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY="your_groq_api_key_here"
HF_TOKEN="your_huggingface_token_here"
```

### Step 5: Initialize Vector Store (First Time Only)

```bash
python setup.py
```

This will:
- Load the medical encyclopedia PDF
- Create text chunks
- Generate embeddings
- Save the FAISS vector store

### Step 6: Run the Application

```bash
python app/application.py
```

Visit `http://127.0.0.1:5000` in your browser.

---

## 📖 Usage

### Starting a Conversation

1. **Launch the application** and open your browser
2. **Type your medical question** in the input field
3. **Press Enter or click Send** to get a response
4. **View the answer** with properly formatted text and medical information

### Example Queries

Try these example prompts:

- "What are the early symptoms of diabetes and how can it be prevented?"
- "How can I naturally lower my blood pressure without medication?"
- "What are the different types of hypertension medications and their side effects?"
- "Explain the difference between Type 1 and Type 2 diabetes in detail"

### Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Ctrl + C**: Stop the server (in terminal)

---

## 📁 Project Structure

```
RAG Medical Chatbot/
├── app/
│   ├── __init__.py
│   ├── application.py              # Main Flask application
│   ├── common/
│   │   ├── __init__.py
│   │   ├── custom_exception.py     # Custom exception handling
│   │   └── logger.py               # Logging configuration
│   ├── components/
│   │   ├── __init__.py
│   │   ├── data_loader.py          # PDF loading utilities
│   │   ├── embeddings.py           # Embedding model configuration
│   │   ├── llm.py                  # LLM initialization (Groq)
│   │   ├── pdf_loader.py           # PDF processing
│   │   ├── retriever.py            # QA chain creation
│   │   └── vector_store.py         # FAISS vector store operations
│   ├── config/
│   │   ├── __init__.py
│   │   └── config.py               # Configuration settings
│   └── templates/
│       └── index.html              # Frontend UI
├── data/
│   └── The_GALE_ENCYCLOPEDIA_of_MEDICINE_SECOND.pdf
├── logs/                           # Application logs
├── vectorstore/
│   └── db_faiss/                   # FAISS index files
├── my_env/                         # Virtual environment
├── .env                            # Environment variables
├── .gitignore                      # Git ignore rules
├── requirements.txt                # Python dependencies
├── setup.py                        # Vector store setup script
└── README.md                       # Project documentation
```

---

## ⚙️ Configuration

### Model Settings

Edit `app/config/config.py` to customize:

```python
# LLM Configuration
GROQ_MODEL = "llama-3.1-8b-instant"
TEMPERATURE = 0.3
MAX_TOKENS = 512

# Vector Store Configuration
DB_FAISS_PATH = "vectorstore/db_faiss"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
RETRIEVAL_K = 3  # Number of documents to retrieve
```

### Embedding Model

Change the embedding model in `app/components/embeddings.py`:

```python
model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: `QA chain could not be created (LLM or VectorStore issue)`

**Solution**: 
- Ensure GROQ_API_KEY is set in `.env`
- Run `python setup.py` to create vector store
- Check if `vectorstore/db_faiss/` exists

---

**Issue**: `Cannot copy out of meta tensor`

**Solution**: Already fixed in the code. Ensure you have the latest version with proper embedding configuration.

---

**Issue**: Port 5000 already in use

**Solution**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

---

## 🔐 Security

- ✅ API keys stored in `.env` file (not committed to Git)
- ✅ Session management with secure secret keys
- ✅ Input validation and sanitization
- ✅ Error messages don't expose sensitive information
- ✅ CORS and security headers configured

**Important**: Never commit your `.env` file or API keys to version control!

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow PEP 8 style guide for Python code
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting PR

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **GALE Encyclopedia of Medicine** for the comprehensive medical knowledge base
- **Groq** for providing fast LLM inference
- **LangChain** for the powerful RAG framework
- **HuggingFace** for embedding models
- **Font Awesome** for beautiful icons

---

## 📧 Contact

**Project Maintainer**: Sajjad Ali Shah

- GitHub: [@SajjadKhanYousafzai](https://github.com/SajjadKhanYousafzai)
- Repository: [RAG-AI-Medical-Assistant-Chatbot](https://github.com/SajjadKhanYousafzai/RAG-AI-Medical-Assistant-Chatbot)

---

## 🔮 Future Enhancements

- [ ] Add voice input/output capability
- [ ] Implement user authentication system
- [ ] Add medical image analysis
- [ ] Support for multiple languages
- [ ] Integration with medical databases (PubMed, etc.)
- [ ] Export chat history as PDF
- [ ] Add medication interaction checker
- [ ] Implement symptom checker with visual diagrams

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by Sajjad Ali Shah

</div>
