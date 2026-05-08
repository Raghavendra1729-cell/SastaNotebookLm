# services/rag_service.py
import asyncio
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from core.config import GOOGLE_API_KEY, QDRANT_URL, QDRANT_API_KEY, HF_KEY

embeddings = HuggingFaceInferenceAPIEmbeddings(
    api_key=HF_KEY, 
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

COLLECTION_NAME = "notebook_collection"
VECTOR_SIZE = 384 

_client = None
_vector_store = None

def get_vector_store():
    global _client, _vector_store
    if _client is None:
        if QDRANT_URL and QDRANT_API_KEY:
            _client = QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY,
            )
        else:
            _client = QdrantClient(path="./local_qdrant")
            
        if not _client.collection_exists(COLLECTION_NAME):
            _client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
    
    if _vector_store is None:
        _vector_store = QdrantVectorStore(
            client=_client,
            collection_name=COLLECTION_NAME,
            embedding=embeddings,
        )
    return _vector_store

async def clear_all_data():
    global _client, _vector_store
    if _client is None:
        get_vector_store()
    
    if _client.collection_exists(COLLECTION_NAME):
        _client.delete_collection(COLLECTION_NAME)
        _client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
    _vector_store = None # Reset vector store to ensure it re-initializes with the new collection

async def ingest_document(file_path: str, extension: str) -> int:
    vector_store = get_vector_store()
    if extension == ".pdf":
        loader = PyPDFLoader(file_path)
    else:
        loader = TextLoader(file_path)
    docs = loader.load()
    
    splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=400)
    chunks = splitter.split_documents(docs)

    # We remove the heavy delays and batching to try and beat the Vercel 10s timeout.
    # Hugging Face Inference API generally handles larger batches better than Gemini Free Tier.
    vector_store.add_documents(chunks)
            
    return len(chunks)

async def get_context(query: str, top_k: int = 10) -> str:
    try:
        vector_store = get_vector_store()
        search_results = vector_store.similarity_search(query, k=top_k)
        if not search_results:
            return ""
        return "\n\n---\n\n".join([doc.page_content for doc in search_results])
    except Exception:
        return ""
