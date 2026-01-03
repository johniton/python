from models.retriever import retrieve
from rag.prompt import SYSTEM_PROMPT
from langchain_huggingface import ChatHuggingFace


def answer_question(question: str):
    matches = retrieve(question)

    if not matches:
        return {
            "answer": "I do not have enough information to answer this.",
            "sources": []
        }

    context = "\n\n".join(
        m["metadata"]["text"] for m in matches
    )

    llm = ChatHuggingFace(
        repo_id="mistralai/Mistral-7B-Instruct-v0.2",
        temperature=0.0
    )

    prompt = f"""
{SYSTEM_PROMPT}

Context:
{context}

Question:
{question}
"""

    response = llm.invoke(prompt)

    sources = [
        {
            "document": m["metadata"]["source"],
            "chunk_id": str(m["metadata"]["chunk_id"])
        }
        for m in matches
    ]

    return {
        "answer": response.content,
        "sources": sources
    }
