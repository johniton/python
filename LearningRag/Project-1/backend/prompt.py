from langchain_core.prompts import PromptTemplate


RESUME_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are an assistant answering questions strictly from the resume below.

Resume content:
{context}

Rules:
- Use only the resume content.
- If the answer is not present, say:
  "I don’t know based on the resume."
- Do NOT add external information.

Question:
{question}
"""
)
