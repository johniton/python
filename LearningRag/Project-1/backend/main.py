from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import shutil
import os
from fastapi.middleware.cors import CORSMiddleware




from rag import (
    load_and_chunk_pdf,
    get_embeddings,
    create_vector_store,
    load_vector_store,
    get_llm,
    answer_question
)

app = FastAPI()
embeddings = get_embeddings()
llm = get_llm()

PDF_PATH = "resume.pdf"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev-only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    question: str

@app.post("/upload")
def upload_resume(file: UploadFile = File(...)):
    with open(PDF_PATH, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    chunks = load_and_chunk_pdf(PDF_PATH)
    create_vector_store(chunks, embeddings)

    return {"status": "Resume uploaded and indexed"}

@app.post("/ask")
def ask(q: Question):
    db = load_vector_store(embeddings)
    answer = answer_question(q.question, db, llm)
    return {"answer": answer}
