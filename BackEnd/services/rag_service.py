# services/rag_service.py
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

async def ingest_document(file_path: str, extension: str) -> int:
    vector_store = get_vector_store()
    if extension == ".pdf":
        loader = PyPDFLoader(file_path)
    else:
        loader = TextLoader(file_path)
    docs = loader.load()
    
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)

    vector_store.add_documents(chunks)
    return len(chunks)

async def get_context(query: str, top_k: int = 3) -> str:
    try:
        vector_store = get_vector_store()
        search_results = vector_store.similarity_search(query, k=top_k)
        if not search_results:
            return ""
        return "\n\n---\n\n".join([doc.page_content for doc in search_results])
    except Exception:
        return ""
