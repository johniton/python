from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
from config import PINECONE_API_KEY, PINECONE_INDEX


# Initialize Pinecone ONCE
pc = Pinecone(api_key=PINECONE_API_KEY)

# Load embedder ONCE
embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')


existing_indexes = pc.list_indexes().names()

if PINECONE_INDEX not in existing_indexes:
    pc.create_index(
        name=PINECONE_INDEX,
        dimension=384,  # all-MiniLM-L6-v2
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        )
    )
    print("Index created")
else:
    print("Index already exists")

index = pc.Index(PINECONE_INDEX)

def retrieve(query: str, top_k: int = 4):
    query_embedding = embedder.encode(query).tolist()

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )

    return results["matches"]
