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
                
            if not _client.collection_exists(COLLECTION_NAME):
                print(f"Creating collection {COLLECTION_NAME} with size {VECTOR_SIZE}")
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

        print(f"Ingesting {len(chunks)} chunks into Qdrant using Hugging Face")
        
        # Batch ingestion to prevent HF API from throwing "Expecting value line 1 char 0" (Timeout/413)
        batch_size = 20
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            try:
                vector_store.add_documents(batch)
                print(f"Successfully added batch {i//batch_size + 1}")
            except Exception as batch_err:
                print(f"Failed on batch {i//batch_size + 1}: {str(batch_err)}")
                if "Expecting value" in str(batch_err):
                    raise Exception("Hugging Face API failed to process the text. Check your HF_KEY or try a smaller file.")
                raise
            
            if i + batch_size < len(chunks):
                await asyncio.sleep(0.5) # Very small delay for HF rate limits
                
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
