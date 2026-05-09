# Sasta NotebookLM

Sasta NotebookLM is a lightweight, fully functional Retrieval-Augmented Generation (RAG) application inspired by Google NotebookLM. It enables users to upload documents (PDF, TXT) and interactively query their contents using an LLM that is strictly grounded in the document context.

## 🚀 Live Demo & Source Code
- **Live Project**: [Insert Live URL Here]
- **GitHub Repository**: [Insert GitHub URL Here]

## 🏗️ Architecture & RAG Pipeline

The application features a complete end-to-end RAG pipeline:
1. **Ingestion & Parsing:** Documents are uploaded via a React frontend to a FastAPI backend. Text is extracted using `PyPDFLoader` or `TextLoader`.
2. **Chunking Strategy:** `RecursiveCharacterTextSplitter` is employed with a `chunk_size` of 2000 characters and `chunk_overlap` of 400 characters. This maintains semantic continuity across paragraph boundaries while optimizing for the context window of the embedding model.
3. **Embedding:** Text chunks are vectorized using `GoogleGenerativeAIEmbeddings` (specifically `models/gemini-embedding-2`), generating 3072-dimensional vectors.
4. **Vector Storage:** Embeddings and metadata are indexed in **Qdrant** (local or cloud) for fast and scalable similarity search.
5. **Retrieval:** User queries are embedded and matched against the Qdrant index using Cosine Similarity to fetch the Top-K (default 10) relevant chunks asynchronously.
6. **Generation:** A HuggingFace-hosted LLM generates answers governed by a strict system prompt to ensure responses are derived **solely** from the retrieved context, preventing hallucination.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide React
- **Backend:** Python, FastAPI, LangChain
- **Database (Vector):** Qdrant
- **LLM / Embeddings:** HuggingFace Serverless Inference / Google Gemini Embeddings

## ⚙️ Local Development Setup

### 1. Backend Setup

```bash
cd BackEnd
python3 -m venv .venv
source .venv/bin/activate  # (On Windows use .venv\Scripts\activate)
pip install -r requirements.txt
```

**Environment Variables (`BackEnd/.env`):**
```env
HF_KEY=your_huggingface_key
HF_MODEL=meta-llama/Meta-Llama-3-8B-Instruct # Or any preferred HF model
GOOGLE_API_KEY=your_gemini_api_key
CORS_ORIGINS=http://localhost:5173
# QDRANT_URL= (Optional for Qdrant Cloud)
# QDRANT_API_KEY= (Optional for Qdrant Cloud)
```

**Run Backend:**
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd Frontend
npm install
```

**Environment Variables (`Frontend/.env`):**
```env
VITE_BACKEND_URI=http://127.0.0.1:8000
```

**Run Frontend:**
```bash
npm run dev
```

## 🔍 Features & Capabilities

- **Multi-Format Support:** Seamlessly process `.pdf` and `.txt` files.
- **Strict Grounding:** The LLM is heavily prompted to refuse answering out-of-context questions (zero hallucination policy).
- **Asynchronous Processing:** Built on `asyncio` and `FastAPI` for non-blocking document ingestion and concurrent similarity search.
- **Batch Vector Operations:** Chunk embeddings are batched and rate-limited to gracefully handle free-tier API quotas.
- **Modern UI:** Features a sleek interface supporting drag-and-drop, raw text paste, and a conversational layout.

