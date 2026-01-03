from pydantic import BaseModel
from typing import List

class ChatRequest(BaseModel):
    question: str

class Source(BaseModel):
    document: str
    chunk_id: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]
