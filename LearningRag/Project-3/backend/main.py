from fastapi import FastAPI, UploadFile, File
import shutil
import os

from rag.ingest import ingest_documents
from rag.pipline import answer_question
from rag.rag_schema import ChatRequest

app = FastAPI()

@app.post("/upload")
async def upload(files: list[UploadFile] = File(...)):
    paths = []

    for file in files:
        path = f"uploads/{file.filename}"
        with open(path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        paths.append(path)

    ingest_documents(paths)

    return {"status": "Documents indexed and ready"}


@app.post("/chat")
async def chat(req: ChatRequest):
    return answer_question(req.question)
