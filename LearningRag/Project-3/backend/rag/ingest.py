from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone , ServerlessSpec
from sentence_transformers import SentenceTransformer
from config import PINECONE_API_KEY, PINECONE_INDEX

import uuid
import os


# ----------------------------
# Global initialization (ONCE)
# ----------------------------

pc = Pinecone(api_key=PINECONE_API_KEY)


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
embedder = SentenceTransformer("all-MiniLM-L6-v2")

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)


# ----------------------------
# Ingestion function
# ----------------------------

def ingest_documents(file_paths: list[str]):
    vectors = []

    for path in file_paths:
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()

        chunks = splitter.split_text(text)

        for i, chunk in enumerate(chunks):
            vector_id = str(uuid.uuid4())
            embedding = embedder.encode(chunk).tolist()

            vectors.append(
                {
                    "id": vector_id,
                    "values": embedding,
                    "metadata": {
                        "text": chunk,
                        "source": os.path.basename(path),
                        "chunk_id": i
                    }
                }
            )

    if vectors:
        index.upsert(vectors, namespace="example-namespace")