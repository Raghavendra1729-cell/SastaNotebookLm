# services/rag_service.py
import asyncio
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from core.config import GOOGLE_API_KEY, QDRANT_URL, QDRANT_API_KEY

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-2",
    api_key=GOOGLE_API_KEY
)

COLLECTION_NAME = "notebook_collection"

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
                vectors_config=VectorParams(size=3072, distance=Distance.COSINE),
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
            vectors_config=VectorParams(size=3072, distance=Distance.COSINE),
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

    # Batch ingestion to avoid "Quota Exceeded" (429) errors on Google Free Tier
    # Google Gemini Free Tier has a limit of ~15 Requests Per Minute.
    batch_size = 40 
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        vector_store.add_documents(batch)
        if i + batch_size < len(chunks):
            # Wait 2 seconds between batches to stay under the 15 RPM limit
            await asyncio.sleep(2)
            
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
