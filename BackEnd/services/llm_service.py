from openai import OpenAI
from core.config import HF_KEY, HF_MODEL
from core.prompts import RAG_SYSTEM_PROMPT

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=HF_KEY,
)

async def get_llm_answer(query: str, context: str, history: list) -> str:
    has_context = bool(context and context.strip())
    system_prompt = (
        RAG_SYSTEM_PROMPT.format(context=context)
        if has_context
        else "You are a helpful AI assistant."
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": query})

    try:
        response = client.chat.completions.create(
            model=HF_MODEL,
            messages=messages,  # type: ignore
            temperature=0.1,
            max_tokens=512
        )
        return response.choices[0].message.content  # type: ignore
    except Exception as e:
        return f"Error connecting to LLM: {str(e)}"
