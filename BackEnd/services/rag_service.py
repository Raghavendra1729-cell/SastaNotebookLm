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
VECTOR_SIZE = 3072 # Dimension for Google Gemini Embedding 2

_client = None
_vector_store = None

def get_vector_store():
    global _client, _vector_store
    try:
        if _client is None:
            if QDRANT_URL and QDRANT_API_KEY:
                print(f"Connecting to Qdrant Cloud at {QDRANT_URL}")
                _client = QdrantClient(
                    url=QDRANT_URL,
                    api_key=QDRANT_API_KEY,
                )
            else:
                print("Connecting to local Qdrant")
                _client = QdrantClient(path="./local_qdrant")
            
            # Check for dimension mismatch and recreate if necessary
            should_recreate = False
            if _client.collection_exists(COLLECTION_NAME):
                col_info = _client.get_collection(COLLECTION_NAME)
                existing_size = col_info.config.params.vectors.size
                if existing_size != VECTOR_SIZE:
                    print(f"Dimension mismatch: Existing {existing_size}, Expected {VECTOR_SIZE}. Recreating...")
                    should_recreate = True
            else:
                should_recreate = True

            if should_recreate:
                if _client.collection_exists(COLLECTION_NAME):
                    _client.delete_collection(COLLECTION_NAME)
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
    except Exception as e:
        print(f"Error in get_vector_store: {str(e)}")
        raise

async def clear_all_data():
    global _client, _vector_store
    try:
        if _client is None:
            get_vector_store()
        
        print(f"Clearing collection {COLLECTION_NAME}")
        if _client.collection_exists(COLLECTION_NAME):
            _client.delete_collection(COLLECTION_NAME)
        
        _client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        _vector_store = None 
    except Exception as e:
        print(f"Error in clear_all_data: {str(e)}")
        raise

async def ingest_document(file_path: str, extension: str) -> int:
    try:
        vector_store = get_vector_store()
        if extension == ".pdf":
            loader = PyPDFLoader(file_path)
        else:
            loader = TextLoader(file_path)
        docs = loader.load()
        
        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=400)
        chunks = splitter.split_documents(docs)

        print(f"Ingesting {len(chunks)} chunks into Qdrant using Google Embeddings")
        
        # Batch ingestion to avoid "Quota Exceeded" (429) errors on Google Free Tier
        batch_size = 40 
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            vector_store.add_documents(batch)
            if i + batch_size < len(chunks):
                await asyncio.sleep(2) # Delay to stay under 15 RPM limit
                
        return len(chunks)
    except Exception as e:
        print(f"Error in ingest_document: {str(e)}")
        raise

async def get_context(query: str, top_k: int = 10) -> str:
    try:
        vector_store = get_vector_store()
        search_results = vector_store.similarity_search(query, k=top_k)
        if not search_results:
            return ""
        return "\n\n---\n\n".join([doc.page_content for doc in search_results])
    except Exception:
        return ""
