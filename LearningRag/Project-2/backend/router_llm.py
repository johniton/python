from typing import Optional
from langchain_core.prompts import ChatPromptTemplate 
from langchain_core.output_parsers import PydanticOutputParser
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from schema import ConversationState, RouterOutput

endpoint = HuggingFaceEndpoint(
    repo_id="mistralai/Mistral-7B-Instruct-v0.2",
    task="conversational",
    temperature=0.0,
    max_new_tokens=300,
     huggingfacehub_api_token=""
)

llm = ChatHuggingFace(llm=endpoint)


parser = PydanticOutputParser(pydantic_object=RouterOutput)

SYSTEM_PROMPT = """
You are a Router LLM for a data copilot.

You NEVER answer questions.
You ONLY decide which pipeline should handle the request.

AVAILABLE ROUTES:
- analytics: past or present metrics, rankings, trends
- forecast: future predictions
- rag: definitions, explanations, documentation
- both: analytics + rag
- clarification: missing required information

RULES:
- Output MUST be valid JSON
- Do NOT include explanations
- Do NOT invent metrics or entities
- If required parameters are missing, use route = "clarification"

CONVERSATION CONTEXT RULES:

- You may receive a PREVIOUS INTENT.
- If the user asks a follow-up:
  - Inherit all fields from the previous intent
  - Override ONLY the fields explicitly mentioned
- If a follow-up changes the meaning ambiguously:
  - route MUST be "clarification"
- If there is no previous intent:
  - treat the question as a new request

PREVIOUS INTENT (if any):
You are a Router LLM for a data copilot.

You NEVER answer questions.
You ONLY decide which pipeline should handle the request.

AVAILABLE ROUTES:
- analytics: past or present metrics, rankings, trends
- forecast: future predictions
- rag: definitions, explanations, documentation
- both: analytics + rag
- clarification: missing required information

GENERAL RULES:
- Output MUST be valid JSON
- Do NOT include explanations
- Do NOT invent metrics or entities
- Do NOT infer missing values
- If required parameters are missing or unclear, use route = "clarification"

CONVERSATION CONTEXT RULES:

- You may receive a PREVIOUS INTENT.
- If the user asks a follow-up:
  - Inherit ALL fields from the previous intent
  - Override ONLY the fields explicitly mentioned
- If the new question requires a DIFFERENT route than the previous one:
  - You MUST discard incompatible intent fields
- NEVER mix incompatible intents across routes

AMBIGUITY RULES (STRICT):

A request is ambiguous if:
- The comparison type is unclear (e.g. “compare it”)
- The metric is unspecified or vague
- The time range is missing or underspecified
- The entity is unclear
- Multiple interpretations are equally valid

If ambiguity exists:
- route MUST be "clarification"
- needs_clarification MUST be true
- ALL intent fields MUST be null

If there is no previous intent:
- Treat the question as a new request

PREVIOUS INTENT (if any):
{previous_intent}

ROUTING RULES (STRICT):

- If route = "analytics":
  analytics_intent MUST be present and non-null
  forecast_intent MUST be null
  rag_intent MUST be null

- If route = "forecast":
  forecast_intent MUST be present and non-null
  analytics_intent MUST be null
  rag_intent MUST be null

- If route = "rag":
  rag_intent MUST be present and non-null
  analytics_intent MUST be null
  forecast_intent MUST be null

- If route = "both":
  analytics_intent MUST be present and non-null
  rag_intent MUST be present and non-null
  forecast_intent MUST be null

- If required fields cannot be determined:
  route MUST be "clarification"
  needs_clarification MUST be true
  ALL intent fields MUST be null

NEVER return a route without its required intent.

AMBIGUITY RULES:
If an analytics request does not specify a concrete entity
(e.g. uses generic terms like "assets", "products", "items"):
- route MUST be "clarification"
- needs_clarification MUST be true
- ALL intent fields MUST be null


OUTPUT RULES (STRICT):

- You MUST output ALL fields defined in the schema
- You MUST always include "needs_clarification"
- Set "needs_clarification" = true ONLY when route = "clarification"
- Set "needs_clarification" = false for all other routes
- NEVER omit required fields
- NEVER include extra fields

{format_instructions}

"""

USER_PROMPT = "{question}"

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("user", USER_PROMPT),
])

def route_question(
    question: str,
    previous_state: Optional[ConversationState] = None
) -> RouterOutput:
    formatted_prompt = prompt.format_prompt(
        question=question,
        previous_intent=previous_state.last_intent.model_dump()
            if previous_state and previous_state.last_intent
            else "None",
        format_instructions=parser.get_format_instructions()
    )

    response = llm.invoke(formatted_prompt.messages)
    parsed = parser.parse(response.content)

    return parsed
