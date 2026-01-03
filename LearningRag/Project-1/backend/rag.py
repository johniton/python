from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
import os
from prompt import RESUME_PROMPT

def load_and_chunk_pdf(pdf_path: str):
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    return splitter.split_documents(documents)

def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="entence-transformers/all-MiniLM-L6-v2s"
    )

VECTOR_PATH = "backend/vector_store/index"

def create_vector_store(chunks, embeddings):
    db = FAISS.from_documents(chunks, embeddings)
    db.save_local(VECTOR_PATH)
    return db

def load_vector_store(embeddings):
    return FAISS.load_local(
        VECTOR_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )


def retrieve_context(query, vector_store, k=3):
    return vector_store.similarity_search(query, k=k)


def get_llm():
    # First create the endpoint
    llm = HuggingFaceEndpoint(
        repo_id="mistralai/Mistral-7B-Instruct-v0.2",
        temperature=0.2,
        max_new_tokens=300
    )
    # Wrap it in ChatHuggingFace
    return ChatHuggingFace(llm=llm)

def answer_question(question, vector_store, llm):
    docs = retrieve_context(question, vector_store)
    context = "\n\n".join(doc.page_content for doc in docs)
    
    prompt = RESUME_PROMPT.format(
        context=context,
        question=question
    )
    
    # Use invoke with message format
    from langchain_core.messages import HumanMessage
    messages = [HumanMessage(content=prompt)]
    response = llm.invoke(messages)
    
    return response.content